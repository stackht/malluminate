// Mall crowd model. `truth` is the synthetic "real world" used by the simulation and to
// generate training data. The neuro-fuzzy and neural models only see noisy samples of it.
import { makeRng, gaussian } from './rng.js'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const g = (x, c, w) => Math.exp(-((x - c) ** 2) / (2 * w * w))

// hour 9..22, day 0..6 (Mon..Sun), promo 0..1 -> crowd index 0..100
export function truth(hour, day, promo) {
  const base = 6 + 20 * g(hour, 10.8, 1.4) + 42 * g(hour, 13, 1.5) + 62 * g(hour, 18.8, 2.1)
  const dayMul = day >= 5 ? 1.4 : day === 4 ? 1.15 : 0.9
  const closing = hour > 21.5 ? Math.max(0, 1 - (hour - 21.5) * 1.6) : 1
  return Math.max(0, Math.min(100, base * dayMul * closing + promo * 24 * (0.5 + 0.5 * g(hour, 16, 4))))
}

export const crowdLevel = (v) => (v < 35 ? 'low' : v < 65 ? 'medium' : 'high')

export function makeCrowdData(n = 260, seed = 21) {
  const rng = makeRng(seed)
  return Array.from({ length: n }, () => {
    const hour = 9 + rng() * 13
    const day = Math.floor(rng() * 7)
    const promo = rng() < 0.35 ? 1 : 0
    const y = Math.max(0, Math.min(100, truth(hour, day, promo) + gaussian(rng) * 4))
    return { x: [hour, day, promo], y }
  })
}

// ---------- hybrid neuro-fuzzy (Sugeno ANFIS) with N inputs ----------
// inputs: hour (4 sets), day of week (3 sets: weekdays, Friday, weekend), promotion (2 sets)
export const ANFIS_SPEC = [
  { name: 'time of day', lo: 9, hi: 22, sets: ['morning', 'lunch', 'afternoon', 'evening'], centers: [0.1, 0.35, 0.6, 0.85] },
  { name: 'day of week', lo: 0, hi: 6, sets: ['weekday', 'Friday', 'weekend'], centers: [0.15, 0.68, 0.92] },
  { name: 'promotion', lo: 0, hi: 1, sets: ['none', 'running'], centers: [0, 1] },
]
const normIn = (spec, x) => x.map((v, i) => (v - spec[i].lo) / (spec[i].hi - spec[i].lo))
const gauss = (x, c, s) => Math.exp(-((x - c) ** 2) / (2 * s * s))

export function newAnfis(spec = ANFIS_SPEC) {
  const widths = spec.map((s) => (s.sets.length > 2 ? 0.13 : 0.4))
  const ruleCombos = []
  const rec = (i, acc) => { if (i === spec.length) { ruleCombos.push(acc); return } for (let j = 0; j < spec[i].sets.length; j++) rec(i + 1, [...acc, j]) }
  rec(0, [])
  return {
    spec,
    c: spec.map((s, i) => s.centers.map((v) => v + (i === 0 ? 0.03 : 0))),
    s: spec.map((s, i) => s.sets.map(() => widths[i])),
    theta: ruleCombos.map(() => new Array(spec.length + 1).fill(0)),
    rules: ruleCombos,
    epoch: 0,
  }
}

function fire(m, x) {
  return m.rules.map((combo) => combo.reduce((p, j, i) => p * gauss(x[i], m.c[i][j], m.s[i][j]), 1))
}
export function anfisRaw(m, xn) {
  const w = fire(m, xn)
  const W = w.reduce((a, b) => a + b, 0) || 1e-9
  const f = m.theta.map((t) => t.slice(0, -1).reduce((s, v, i) => s + v * xn[i], t[t.length - 1]))
  let y = 0
  for (let k = 0; k < w.length; k++) y += (w[k] / W) * f[k]
  return { y, w, W, f }
}
export const anfisPredict = (m, x) => {
  const r = anfisRaw(m, normIn(m.spec, x))
  return { ...r, value: Math.max(0, Math.min(100, r.y)) }
}

function solveLS(A, b, lambda = 1e-3) {
  const n = A[0].length
  const M = Array.from({ length: n }, () => new Array(n + 1).fill(0))
  for (let r = 0; r < A.length; r++) for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i][j] += A[r][i] * A[r][j]; M[i][n] += A[r][i] * b[r] }
  for (let i = 0; i < n; i++) M[i][i] += lambda
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r
    ;[M[i], M[p]] = [M[p], M[i]]
    for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c] }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i] }
  return x
}

export function anfisMse(m, data) {
  let s = 0
  for (const d of data) s += (anfisRaw(m, normIn(m.spec, d.x)).y - d.y) ** 2
  return s / data.length
}

const clip = (v) => Math.max(-0.004, Math.min(0.004, v))
// One epoch of hybrid learning: least squares for the rule outputs, gradient descent for the membership functions.
export function anfisEpoch(m, data, lr = 0.001) {
  const nIn = m.spec.length
  const X = data.map((d) => normIn(m.spec, d.x))
  const A = X.map((xn) => {
    const w = fire(m, xn)
    const W = w.reduce((a, b) => a + b, 0) || 1e-9
    const row = []
    for (let k = 0; k < w.length; k++) { for (let i = 0; i < nIn; i++) row.push((w[k] / W) * xn[i]); row.push(w[k] / W) }
    return row
  })
  const sol = solveLS(A, data.map((d) => d.y))
  const next = { ...m, theta: m.rules.map((_, k) => sol.slice(k * (nIn + 1), (k + 1) * (nIn + 1))), c: m.c.map((r) => [...r]), s: m.s.map((r) => [...r]) }
  const gc = m.c.map((r) => r.map(() => 0))
  const gs = m.s.map((r) => r.map(() => 0))
  data.forEach((d, idx) => {
    const xn = X[idx]
    const { y, w, W, f } = anfisRaw(next, xn)
    const e = (y - d.y) / data.length
    for (let k = 0; k < w.length; k++) {
      const dydw = (f[k] - y) / W
      const g1 = e * dydw * w[k]
      m.rules[k].forEach((j, i) => {
        gc[i][j] += g1 * ((xn[i] - next.c[i][j]) / next.s[i][j] ** 2)
        gs[i][j] += g1 * ((xn[i] - next.c[i][j]) ** 2 / next.s[i][j] ** 3)
      })
    }
  })
  for (let i = 0; i < nIn; i++) for (let j = 0; j < next.c[i].length; j++) {
    next.c[i][j] -= clip(lr * gc[i][j])
    next.s[i][j] = Math.max(0.05, next.s[i][j] - clip(lr * gs[i][j]))
  }
  next.epoch = m.epoch + 1
  return next
}

export const memberships = (m, i, n = 60) =>
  m.spec[i].sets.map((_, j) => Array.from({ length: n + 1 }, (__, k) => [m.spec[i].lo + ((m.spec[i].hi - m.spec[i].lo) * k) / n, gauss(k / n, m.c[i][j], m.s[i][j])]))

// ---------- plain neural network (the "neural only" comparison) ----------
export function trainMLP(data, { hidden = 8, epochs = 500, lr = 0.04, seed = 3 } = {}) {
  const rng = makeRng(seed)
  const spec = ANFIS_SPEC
  const nIn = spec.length
  const W1 = Array.from({ length: hidden }, () => Array.from({ length: nIn }, () => rng() * 2 - 1))
  const b1 = new Array(hidden).fill(0)
  const W2 = Array.from({ length: hidden }, () => rng() * 2 - 1)
  let b2 = 0.4
  const fwd = (x) => {
    const h = W1.map((w, j) => Math.tanh(w.reduce((s, v, i) => s + v * x[i], b1[j])))
    return { h, y: h.reduce((s, v, j) => s + v * W2[j], b2) }
  }
  for (let e = 0; e < epochs; e++) {
    for (const d of data) {
      const x = normIn(spec, d.x)
      const { h, y } = fwd(x)
      const err = y - d.y / 100
      for (let j = 0; j < hidden; j++) {
        const dh = err * W2[j] * (1 - h[j] * h[j])
        W2[j] -= lr * err * h[j]
        for (let i = 0; i < nIn; i++) W1[j][i] -= lr * dh * x[i]
        b1[j] -= lr * dh
      }
      b2 -= lr * err
    }
  }
  return { predict: (x) => Math.max(0, Math.min(100, fwd(normIn(spec, x)).y * 100)) }
}
