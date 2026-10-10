// The synthetic shopping mall: sections (nodes) connected by walkways (edges).
// All names and numbers are made up for the demo. 1 map unit = 0.16 m.
export const M_PER_UNIT = 0.16

export const NODES = [
  { id: 'entrance', name: 'Main Entrance', short: 'ENT', type: 'entrance', x: 110, y: 520, cap: 40, sky: 0.5 },
  { id: 'atrium', name: 'Central Atrium', short: 'ATR', type: 'hub', x: 330, y: 400, cap: 90, sky: 1 },
  { id: 'info', name: 'Information Desk', short: 'INF', type: 'service', x: 330, y: 545, cap: 25, sky: 0.3 },
  { id: 'clothing', name: 'Clothing Store', short: 'CLO', type: 'store', x: 190, y: 250, cap: 60, sky: 0.1 },
  { id: 'shoes', name: 'Shoe Store', short: 'SHO', type: 'store', x: 85, y: 105, cap: 40, sky: 0.1 },
  { id: 'electronics', name: 'Electronics Store', short: 'ELE', type: 'store', x: 500, y: 150, cap: 55, sky: 0.1 },
  { id: 'books', name: 'Bookstore', short: 'BOK', type: 'store', x: 650, y: 85, cap: 35, sky: 0.2 },
  { id: 'food', name: 'Food Court', short: 'FOD', type: 'food', x: 560, y: 410, cap: 120, sky: 0.6 },
  { id: 'cinema', name: 'Cinema', short: 'CIN', type: 'fun', x: 830, y: 320, cap: 90, sky: 0 },
  { id: 'pharmacy', name: 'Pharmacy', short: 'PHA', type: 'service', x: 500, y: 545, cap: 25, sky: 0.1 },
  { id: 'kids', name: 'Kids Zone', short: 'KID', type: 'fun', x: 840, y: 120, cap: 50, sky: 0.3 },
  { id: 'restroom', name: 'Restrooms', short: 'WC', type: 'facility', x: 700, y: 535, cap: 20, sky: 0 },
  { id: 'escalator', name: 'Escalator Hall', short: 'ESC', type: 'hub', x: 470, y: 275, cap: 60, sky: 0.8 },
  { id: 'parking', name: 'Parking Exit', short: 'PRK', type: 'entrance', x: 880, y: 540, cap: 40, sky: 0.1 },
  { id: 'cafe', name: 'Cafe', short: 'CAF', type: 'food', x: 665, y: 245, cap: 45, sky: 0.3 },
]
export const NODE = Object.fromEntries(NODES.map((n) => [n.id, n]))

const PAIRS = [
  ['entrance', 'atrium'], ['atrium', 'info'], ['atrium', 'clothing'], ['atrium', 'escalator'], ['atrium', 'food'],
  ['info', 'pharmacy'], ['pharmacy', 'food'], ['pharmacy', 'restroom'], ['restroom', 'parking'], ['food', 'restroom'],
  ['food', 'cinema'], ['food', 'cafe'], ['clothing', 'shoes'], ['clothing', 'escalator'], ['escalator', 'electronics'],
  ['escalator', 'cafe'], ['electronics', 'books'], ['books', 'kids'], ['kids', 'cafe'], ['cafe', 'cinema'], ['cinema', 'parking'],
]
export const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)
export const EDGES = PAIRS.map(([a, b]) => {
  const A = NODE[a]
  const B = NODE[b]
  const length = Math.hypot(A.x - B.x, A.y - B.y)
  const meters = length * M_PER_UNIT
  return { id: edgeKey(a, b), a, b, length, meters, cap: Math.max(6, Math.round(meters * 1.1)) }
})
export const EDGE = Object.fromEntries(EDGES.map((e) => [e.id, e]))

// Neighbour lists keep the insertion order of PAIRS, so BFS and DFS are deterministic.
export const ADJ = Object.fromEntries(NODES.map((n) => [n.id, []]))
for (const e of EDGES) {
  ADJ[e.a].push({ to: e.b, edge: e.id })
  ADJ[e.b].push({ to: e.a, edge: e.id })
}

export const STORE_IDS = NODES.filter((n) => ['store', 'food', 'fun', 'service'].includes(n.type)).map((n) => n.id)
export const edgeCost = (e, crowd) => e.length * (1 + (crowd[e.id] ?? 0) / 100)
export const heuristic = (a, b) => Math.hypot(NODE[a].x - NODE[b].x, NODE[a].y - NODE[b].y)
export const levelOf = (v) => (v < 35 ? 'low' : v < 65 ? 'medium' : 'high')
export const roadName = (id) => `${NODE[EDGE[id].a].short}-${NODE[EDGE[id].b].short}`
