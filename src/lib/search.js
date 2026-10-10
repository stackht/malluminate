import { ADJ, EDGE, NODE, edgeCost, heuristic } from './mall.js'

export const ALGOS = {
  bfs: { label: 'Breadth-first (BFS)', blurb: 'Explores level by level. Finds the path with the fewest walkways.' },
  dfs: { label: 'Depth-first (DFS)', blurb: 'Dives down one branch first. Finds a path quickly, not always the shortest.' },
  astar: { label: 'A*', blurb: 'Uses distance so far plus a straight-line estimate. Finds the cheapest path.' },
}

// Records one snapshot per expansion so the UI can animate the search.
// `blocked` maps walkway id -> true for closed walkways, which are not available actions.
export function search(algo, start, goal, crowd = {}, blocked = {}) {
  const g = { [start]: 0 }
  const parent = {}
  const explored = []
  const seen = new Set()
  let frontier = [start]
  const steps = []
  let found = false
  const prio = (n) => g[n] + heuristic(n, goal)

  while (frontier.length) {
    let cur
    if (algo === 'bfs') cur = frontier.shift()
    else if (algo === 'dfs') cur = frontier.pop()
    else {
      frontier.sort((a, b) => prio(a) - prio(b))
      cur = frontier.shift()
    }
    if (seen.has(cur)) continue
    seen.add(cur)
    explored.push(cur)
    steps.push({ current: cur, explored: [...explored], frontier: [...frontier], g: { ...g } })
    if (cur === goal) {
      found = true
      break
    }
    const nbrs = ADJ[cur].filter((x) => !blocked[x.edge] && !seen.has(x.to))
    // DFS pushes in reverse so the first neighbour is explored first
    for (const { to, edge } of algo === 'dfs' ? [...nbrs].reverse() : nbrs) {
      const ng = g[cur] + edgeCost(EDGE[edge], crowd)
      if (algo === 'astar') {
        if (g[to] === undefined || ng < g[to]) {
          g[to] = ng
          parent[to] = { from: cur, edge }
          if (!frontier.includes(to)) frontier.push(to)
        }
      } else if (algo === 'dfs') {
        // classic DFS: push every neighbour; the last push of a node decides its parent
        g[to] = ng
        parent[to] = { from: cur, edge }
        frontier.push(to)
      } else if (g[to] === undefined) {
        g[to] = ng
        parent[to] = { from: cur, edge }
        frontier.push(to)
      }
    }
  }

  const path = []
  const pathEdges = []
  if (found) {
    let n = goal
    path.push(n)
    while (n !== start) {
      pathEdges.push(parent[n].edge)
      n = parent[n].from
      path.push(n)
    }
    path.reverse()
    pathEdges.reverse()
  }
  const cost = pathEdges.reduce((s, e) => s + edgeCost(EDGE[e], crowd), 0)
  const meters = pathEdges.reduce((s, e) => s + EDGE[e].meters, 0)
  return { found, path, pathEdges, cost, meters, expanded: steps.length, steps }
}

export const walkMinutes = (meters) => meters / 1.3 / 60

// ---------- PS 4: robot on a small grid (A*) ----------
// grid: array of strings using S start, G goal, # obstacle, . free.
export function gridAStar(grid) {
  const rows = grid.length
  const cols = grid[0].length
  let s = null
  let g = null
  grid.forEach((row, r) => [...row].forEach((c, k) => {
    if (c === 'S') s = [r, k]
    if (c === 'G') g = [r, k]
  }))
  if (!s || !g) return { found: false, path: [], steps: [], error: 'Place both S and G.' }
  const h = ([r, c]) => Math.abs(r - g[0]) + Math.abs(c - g[1])
  const key = ([r, c]) => `${r},${c}`
  const open = [{ pos: s, g: 0, f: h(s), parent: null }]
  const best = { [key(s)]: 0 }
  const closed = new Set()
  const steps = []
  while (open.length) {
    open.sort((a, b) => a.f - b.f || h(a.pos) - h(b.pos))
    const cur = open.shift()
    if (closed.has(key(cur.pos))) continue
    closed.add(key(cur.pos))
    steps.push({ current: cur.pos, g: cur.g, h: h(cur.pos), f: cur.f, open: open.map((o) => ({ pos: o.pos, g: o.g, h: h(o.pos), f: o.f })), closed: [...closed] })
    if (key(cur.pos) === key(g)) {
      const path = []
      for (let n = cur; n; n = n.parent) path.unshift(n.pos)
      return { found: true, path, steps, cost: cur.g }
    }
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const r = cur.pos[0] + dr
      const c = cur.pos[1] + dc
      if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] === '#' || closed.has(key([r, c]))) continue
      const ng = cur.g + 1
      if (best[key([r, c])] === undefined || ng < best[key([r, c])]) {
        best[key([r, c])] = ng
        open.push({ pos: [r, c], g: ng, f: ng + h([r, c]), parent: cur })
      }
    }
  }
  return { found: false, path: [], steps }
}

export const nodeName = (id) => NODE[id]?.name ?? id
