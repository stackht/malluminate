import { useEffect, useMemo, useState } from 'react'
import { gridAStar } from '../lib/search.js'
import Icon from '../components/Icon.jsx'
import usePlayer from '../components/usePlayer.js'
import { GateHead, Panel, Howto, Seg } from '../components/Ui.jsx'

const make = (n) => {
  const g = Array.from({ length: n }, () => Array(n).fill('.'))
  g[0][0] = 'S'
  g[n - 1][n - 1] = 'G'
  g[Math.floor(n / 2)][Math.floor(n / 2)] = '#'
  return g
}

export default function Robot() {
  const [size, setSize] = useState(3)
  const [grid, setGrid] = useState(() => make(3))
  const [tool, setTool] = useState('#')

  const rows = useMemo(() => grid.map((r) => r.join('')), [grid])
  const res = useMemo(() => gridAStar(rows), [rows])
  const player = usePlayer(Math.max(0, res.steps.length - 1), 700)
  useEffect(() => player.finish(), [rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const step = res.steps[player.idx]
  const done = player.idx >= res.steps.length - 1

  const resize = (n) => {
    setSize(n)
    setGrid(make(n))
  }
  const paint = (r, c) =>
    setGrid((g) => {
      const next = g.map((row) => [...row])
      if (tool === 'S' || tool === 'G') next.forEach((row, i) => row.forEach((v, j) => { if (v === tool) next[i][j] = '.' }))
      next[r][c] = next[r][c] === tool ? '.' : tool
      return next
    })

  const key = (r, c) => `${r},${c}`
  const closed = new Set(step?.closed ?? [])
  const open = Object.fromEntries((step?.open ?? []).map((o) => [key(...o.pos), o]))
  const onPath = new Set(done && res.found ? res.path.map((p) => key(...p)) : [])
  const goal = (() => { let g = null; grid.forEach((row, r) => row.forEach((v, c) => { if (v === 'G') g = [r, c] })); return g })()

  return (
    <div className="page">
      <GateHead tech="A* on a grid" icon="robot" title="Robot pathfinder">
        A cleaning robot in a 3 × 3 section of the mall must travel from Start (S) to Goal (G). It moves up, down, left or right and cannot pass an obstacle (#). A* finds an efficient path.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Grid" tag="click a cell to paint">
            <div className="row" style={{ marginBottom: 14 }}>
              <span className="lbl">Brush</span>
              <Seg label="Brush" value={tool} onChange={setTool} options={[{ value: '#', label: 'Obstacle #' }, { value: 'S', label: 'Start S' }, { value: 'G', label: 'Goal G' }]} />
              <span className="lbl">Size</span>
              <Seg label="Grid size" value={size} onChange={resize} options={[3, 4, 5].map((v) => ({ value: v, label: `${v} × ${v}` }))} />
              <button className="btn ghost sm" onClick={() => resize(size)}>Reset grid</button>
            </div>
            <div className="robotgrid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
              {grid.map((row, r) => row.map((v, c) => {
                const k = key(r, c)
                const o = open[k]
                const cur = step && key(...step.current) === k
                const h = goal ? Math.abs(r - goal[0]) + Math.abs(c - goal[1]) : 0
                return (
                  <button key={k} className={'cell' + (v === '#' ? ' wall' : '') + (v === 'S' ? ' start' : '') + (v === 'G' ? ' goal' : '') + (onPath.has(k) ? ' path' : '') + (closed.has(k) ? ' closed' : '') + (cur ? ' cur' : '') + (o ? ' open' : '')} onClick={() => paint(r, c)} aria-label={`Row ${r + 1} column ${c + 1}: ${v === '.' ? 'free' : v}`}>
                    <b>{v === '.' ? '' : v}</b>
                    {v !== '#' && <small>h={h}{o ? ` g=${o.g} f=${o.f}` : ''}</small>}
                  </button>
                )
              }))}
            </div>
            <div className="legend" style={{ marginTop: 12 }}>
              <span><i style={{ boxShadow: 'inset 0 0 0 2px #1d3bff' }} />in the open list (g, f shown)</span>
              <span><i style={{ background: 'rgba(90,178,255,.35)' }} />closed (already expanded)</span>
              <span><i style={{ background: '#1d3bff' }} />final path</span>
              <span className="note">h = Manhattan distance to the goal.</span>
            </div>
          </Panel>
          <Panel title="Search">
            <div className="row">
              {player.playing ? <button className="btn" onClick={player.pause}><Icon name="pause" size={16} />Pause</button> : <button className="btn" onClick={player.play}><Icon name="play" size={16} />Play</button>}
              <button className="btn ghost" onClick={player.step} disabled={done}><Icon name="step" size={16} />Step</button>
              <button className="btn ghost" onClick={player.finish}>Skip to end</button>
              <button className="btn ghost" onClick={player.reset}><Icon name="reset" size={16} />Reset</button>
              <span className="note num">Expansion {Math.min(player.idx + 1, res.steps.length)} of {res.steps.length}</span>
            </div>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Result" tag="A*">
            {res.error ? (
              <div className="empty">{res.error}</div>
            ) : res.found ? (
              <>
                <div className="metrics" style={{ marginBottom: 10 }}>
                  <div className="metric"><b>{res.cost}</b><span>moves</span></div>
                  <div className="metric"><b>{res.steps.length}</b><span>cells expanded</span></div>
                </div>
                <p className="note">{res.path.map(([r, c]) => `(${r + 1},${c + 1})`).join(' → ')}</p>
              </>
            ) : (
              <div className="empty">The obstacles block every route. Remove one.</div>
            )}
          </Panel>
          {step && (
            <Panel title="Current step">
              <table>
                <tbody>
                  <tr><td>Expanding cell</td><td className="r num">({step.current[0] + 1},{step.current[1] + 1})</td></tr>
                  <tr><td>g (moves so far)</td><td className="r num">{step.g}</td></tr>
                  <tr><td>h (estimate to goal)</td><td className="r num">{step.h}</td></tr>
                  <tr><td>f = g + h</td><td className="r num"><b>{step.f}</b></td></tr>
                </tbody>
              </table>
            </Panel>
          )}
          <Howto>
            <p>A* keeps an <strong>open list</strong> of cells it could expand next and always picks the one with the lowest <strong>f = g + h</strong>.</p>
            <p><strong>g</strong> is the moves already made. <strong>h</strong> is a guess of the moves left: here the Manhattan distance, which never overestimates because the robot cannot move diagonally. That makes the first path found a shortest one.</p>
            <p>Try making the obstacle block the middle and watch the robot go around it.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
