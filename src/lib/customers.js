// Synthetic customer records, the Perceptron rule (supervised, predefined categories)
// and competitive learning (unsupervised, groups discovered without labels).
import { makeRng, gaussian } from './rng.js'

export const CATEGORIES = ['Budget', 'Standard', 'Premium']
export const FEATURES = [
  { key: 'age', label: 'Age', max: 80 },
  { key: 'visits', label: 'Visits / month', max: 10 },
  { key: 'spend', label: 'Spend per visit ($)', max: 300 },
  { key: 'dwell', label: 'Time in mall (min)', max: 200 },
  { key: 'promo', label: 'Promotion response', max: 1 },
]

// Four hidden shopping styles generate the data; the models never see these names.
export const ARCHETYPES = [
  { name: 'Quick errand', age: 40, visits: 6, spend: 28, dwell: 28, promo: 0.3, goals: ['pharmacy', 'electronics', 'info', 'food'], dwellMin: [3, 10] },
  { name: 'Family outing', age: 38, visits: 3, spend: 100, dwell: 150, promo: 0.6, goals: ['kids', 'food', 'cinema', 'clothing'], dwellMin: [12, 30] },
  { name: 'Window shopper', age: 24, visits: 5, spend: 24, dwell: 110, promo: 0.85, goals: ['clothing', 'shoes', 'cafe', 'books'], dwellMin: [8, 20] },
  { name: 'Big spender', age: 45, visits: 4, spend: 240, dwell: 90, promo: 0.35, goals: ['clothing', 'shoes', 'electronics', 'food'], dwellMin: [10, 25] },
]

export const categoryOf = (r) => (r.spend < 45 ? 0 : r.spend >= 150 ? 2 : 1)
export const vec = (r) => FEATURES.map((f) => Math.max(0, Math.min(1.2, r[f.key] / f.max)))

export function makeRecord(rng, archetype) {
  const a = ARCHETYPES[archetype]
  const j = (v, s) => Math.max(0.05, v * (1 + gaussian(rng) * s))
  const rec = { archetype, age: Math.round(Math.min(75, Math.max(16, a.age + gaussian(rng) * 7))), visits: +j(a.visits, 0.25).toFixed(1), spend: +j(a.spend, 0.22).toFixed(0), dwell: +j(a.dwell, 0.2).toFixed(0), promo: +Math.max(0, Math.min(1, a.promo + gaussian(rng) * 0.12)).toFixed(2) }
  rec.category = categoryOf(rec)
  return rec
}

export function makeCustomers(n = 200, seed = 31) {
  const rng = makeRng(seed)
  return Array.from({ length: n }, (_, i) => makeRecord(rng, i % 4))
}

// ----- Perceptron (one unit per category; predicted class = highest net input), trained with the perceptron rule -----
export function newPerceptron(seed = 5) {
  const rng = makeRng(seed)
  return { w: CATEGORIES.map(() => FEATURES.map(() => rng() - 0.5)), b: CATEGORIES.map(() => rng() - 0.5), epoch: 0 }
}
const net = (p, x, k) => p.w[k].reduce((s, w, i) => s + w * x[i], p.b[k])
export const perceptronPredict = (p, x) => {
  let best = 0
  for (let k = 1; k < CATEGORIES.length; k++) if (net(p, x, k) > net(p, x, best)) best = k
  return best
}
// Multi-class perceptron rule: when the predicted class is wrong,
//   w[correct] <- w[correct] + eta x    and    w[predicted] <- w[predicted] - eta x
export function perceptronEpoch(p, data, eta = 0.15) {
  const n = { w: p.w.map((r) => [...r]), b: [...p.b], epoch: p.epoch + 1 }
  let errors = 0
  for (const d of data) {
    const x = vec(d)
    const pred = perceptronPredict(n, x)
    if (pred !== d.category) {
      errors++
      for (let i = 0; i < x.length; i++) {
        n.w[d.category][i] += eta * x[i]
        n.w[pred][i] -= eta * x[i]
      }
      n.b[d.category] += eta
      n.b[pred] -= eta
    }
  }
  return { model: n, errors }
}

// ----- Competitive learning (winner-take-all) on shopping-pattern features -----
const PAT = [1, 2, 3, 4] // visits, spend, dwell, promo
export const patVec = (r) => PAT.map((i) => vec(r)[i])
export function newCompetitive(data, k = 4, seed = 7) {
  const rng = makeRng(seed)
  const units = Array.from({ length: k }, () => patVec(data[Math.floor(rng() * data.length)]).map((v) => v + (rng() - 0.5) * 0.05))
  return { units, epoch: 0, trail: units.map((u) => [[...u]]) }
}
const d2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)
export const winnerOf = (units, x) => units.reduce((best, u, i) => (d2(u, x) < d2(units[best], x) ? i : best), 0)
export function competitiveEpoch(m, data, eta = 0.1) {
  const units = m.units.map((u) => [...u])
  for (const d of data) {
    const x = patVec(d)
    const w = winnerOf(units, x)
    for (let i = 0; i < x.length; i++) units[w][i] += eta * (x[i] - units[w][i])
  }
  return { units, epoch: m.epoch + 1, trail: m.trail.map((t, i) => [...t, [...units[i]]]) }
}
// Descriptive name for a discovered group, derived from its centre (names are assigned after learning).
export function describeGroup(u) {
  const [visits, spend, dwell, promo] = [u[0] * 10, u[1] * 300, u[2] * 200, u[3]]
  const name = spend > 150 ? 'Big spenders' : spend < 60 ? (promo > 0.62 ? 'Window shoppers' : 'Quick errands') : 'Family outings'
  return { name, visits: +visits.toFixed(1), spend: Math.round(spend), dwell: Math.round(dwell), promo: +promo.toFixed(2) }
}
