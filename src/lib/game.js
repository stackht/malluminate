// PS 5: Store selection game solved with Minimax and alpha-beta pruning.
// MAX = the mall manager, who picks which store gets the featured banner in each of two rounds.
// MIN = a rival shopping centre, who answers each round with the counter-offer that hurts the most.
// Payoff = expected footfall x margin of the featured stores, after the rival's effect.
export const STORES = [
  { id: 'clothing', name: 'Clothing Store', base: 62, margin: 0.9 },
  { id: 'electronics', name: 'Electronics Store', base: 48, margin: 1.0 },
  { id: 'food', name: 'Food Court', base: 74, margin: 0.55 },
  { id: 'cinema', name: 'Cinema', base: 52, margin: 0.8 },
  { id: 'books', name: 'Bookstore', base: 30, margin: 0.7 },
]

// How much each rival counter-offer reduces a store's payoff in the round it is played (0..1)
export const COUNTERS = [
  { id: 'sale', name: 'Rival flash sale on fashion', hit: { clothing: 0.45, electronics: 0.1, food: 0, cinema: 0, books: 0.05 } },
  { id: 'tech', name: 'Rival gadget fair', hit: { clothing: 0, electronics: 0.5, food: 0, cinema: 0, books: 0.1 } },
  { id: 'park', name: 'Rival free parking', hit: { clothing: 0.15, electronics: 0.15, food: 0.15, cinema: 0.15, books: 0.15 } },
  { id: 'movie', name: 'Rival 2-for-1 movie night', hit: { clothing: 0, electronics: 0, food: 0.3, cinema: 0.55, books: 0.1 } },
]
const LINGER = 0.5 // a counter-offer keeps working at half strength in the next round
const FATIGUE = 0.5 // featuring the same store twice earns half the second time

const value = (store, counter, linger, repeat) => {
  const hit = Math.min(0.9, counter.hit[store.id] + (linger ? LINGER * linger.hit[store.id] : 0))
  return store.base * store.margin * (1 - hit) * (repeat ? FATIGUE : 1)
}

// state: { picks: [storeIdx...], counters: [counterIdx...], score }
export function minimax(state, maximizing, alpha, beta, stats, prune = true) {
  stats.nodes++
  if (state.counters.length === 2) return { value: state.score, line: [] }
  let best = { value: maximizing ? -Infinity : Infinity, line: [] }
  const options = maximizing ? STORES.map((_, i) => i) : COUNTERS.map((_, i) => i)
  for (const o of options) {
    let child
    if (maximizing) {
      child = minimax({ ...state, picks: [...state.picks, o] }, false, alpha, beta, stats, prune)
    } else {
      const round = state.counters.length
      const store = STORES[state.picks[round]]
      const linger = round === 1 ? COUNTERS[state.counters[0]] : null
      const repeat = round === 1 && state.picks[0] === state.picks[1]
      const gain = value(store, COUNTERS[o], linger, repeat)
      child = minimax({ ...state, counters: [...state.counters, o], score: state.score + gain }, true, alpha, beta, stats, prune)
    }
    const better = maximizing ? child.value > best.value : child.value < best.value
    if (better) best = { value: child.value, line: [{ who: maximizing ? 'MAX' : 'MIN', text: maximizing ? STORES[o].name : COUNTERS[o].name }, ...child.line] }
    if (maximizing) alpha = Math.max(alpha, best.value)
    else beta = Math.min(beta, best.value)
    if (prune && beta <= alpha) { stats.pruned++; break }
  }
  return best
}

// Evaluate every first-round choice so the UI can show the manager's whole decision.
export function solveGame() {
  const root = { picks: [], counters: [], score: 0 }
  const pruned = { nodes: 0, pruned: 0 }
  const full = { nodes: 0, pruned: 0 }
  minimax(root, true, -Infinity, Infinity, full, false)
  const options = STORES.map((s, i) => {
    const r = minimax({ ...root, picks: [i] }, false, -Infinity, Infinity, pruned, true)
    return { store: s, value: r.value, line: [{ who: 'MAX', text: s.name }, ...r.line] }
  }).sort((a, b) => b.value - a.value)
  return { options, best: options[0], prunedNodes: pruned.nodes, fullNodes: full.nodes }
}

// The rival's best reply to a first-round pick (for "play it yourself").
export function rivalReply(pickIdx) {
  const stats = { nodes: 0, pruned: 0 }
  const r = minimax({ picks: [pickIdx], counters: [], score: 0 }, false, -Infinity, Infinity, stats, true)
  return r
}

// Round-2 reply: the last move, so the rival just picks the counter-offer that cuts the payoff most.
export function rivalRound2(p1, c1, p2) {
  const store = STORES[p2]
  let best = null
  COUNTERS.forEach((c, i) => {
    const v = value(store, c, COUNTERS[c1], p1 === p2)
    if (!best || v < best.v) best = { i, v, name: c.name }
  })
  return best
}
export const lineScore = (p1, c1, p2, c2) => value(STORES[p1], COUNTERS[c1], null, false) + value(STORES[p2], COUNTERS[c2], COUNTERS[c1], p1 === p2)
export const counterIndex = (name) => COUNTERS.findIndex((c) => c.name === name)
