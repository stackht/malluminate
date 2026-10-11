// Both lighting models side by side (PS 7): Mamdani (centroid) and Sugeno (weighted average).
import { infer, inferSugeno } from './fuzzy.js'
import { LIGHT_SYSTEM, LIGHT_SUGENO } from './systems.js'

export const lightingBoth = (ambient, activity) => {
  const m = infer(LIGHT_SYSTEM, { ambient, activity })
  const s = inferSugeno(LIGHT_SUGENO, { ambient, activity })
  return { mamdani: m.crisp, sugeno: s.crisp, diff: s.crisp - m.crisp, m, s }
}

export const lightingBrightness = (model, ambient, activity) =>
  model === 'sugeno' ? inferSugeno(LIGHT_SUGENO, { ambient, activity }).crisp : infer(LIGHT_SYSTEM, { ambient, activity }).crisp

// Compare the two models over a grid of ambient light and activity values.
export function compareGrid(step = 5) {
  const rows = []
  let sum = 0
  let max = 0
  let n = 0
  let corrNum = 0
  let mm = 0
  let ss = 0
  const pts = []
  for (let a = 0; a <= 100; a += step) {
    const row = []
    for (let b = 0; b <= 100; b += step) {
      const r = lightingBoth(a, b)
      row.push(r)
      pts.push([r.mamdani, r.sugeno])
      sum += Math.abs(r.diff)
      max = Math.max(max, Math.abs(r.diff))
      n++
    }
    rows.push(row)
  }
  const mx = pts.reduce((s, p) => s + p[0], 0) / n
  const sx = pts.reduce((s, p) => s + p[1], 0) / n
  for (const [x, y] of pts) {
    corrNum += (x - mx) * (y - sx)
    mm += (x - mx) ** 2
    ss += (y - sx) ** 2
  }
  return { rows, meanAbs: sum / n, maxAbs: max, correlation: corrNum / Math.sqrt(mm * ss), n }
}
