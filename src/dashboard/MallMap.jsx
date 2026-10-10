import { EDGES, NODES, NODE, EDGE, edgeKey, levelOf } from '../lib/mall.js'

export const ROUTE = '#4fd1ff'
export const ARCH_COLORS = ['#8be0a0', '#f2c14e', '#d58bff', '#ff8fab']
const LEVEL = { low: '#35c98b', medium: '#ffb02e', high: '#ff5252' }
const TYPE = { store: '#e8c46a', food: '#ff9a5a', fun: '#b48cff', service: '#6fd3ff', hub: '#e8edf7', facility: '#9aa4b8', entrance: '#35c98b' }

const tempColor = (t) => {
  const k = Math.max(0, Math.min(1, (t - 22) / 8))
  return `hsl(${210 - k * 210} 70% 38%)`
}

export default function MallMap({ engine, tool, layers, selectedZone, selectedEdge, route, onZone, onEdge }) {
  const pts = (ids) => ids.map((id) => `${NODE[id].x},${NODE[id].y}`).join(' ')
  return (
    <div className="simmap svgwrap">
      <svg viewBox="0 0 960 620" role="img" aria-label="Live shopping mall floor plan">
        <defs>
          <pattern id="mallgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#161a22" strokeWidth="1" /></pattern>
          <filter id="mglow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <rect width="960" height="620" fill="url(#mallgrid)" />

        {layers.lights && NODES.map((n) => {
          const b = engine.zones[n.id].light / 100
          return <circle key={'g' + n.id} cx={n.x} cy={n.y} r={26 + 56 * b} fill="#ffe08a" opacity={0.05 + 0.34 * b} filter="url(#mglow)" />
        })}

        {EDGES.map((e) => {
          const a = NODE[e.a]
          const b = NODE[e.b]
          const closed = engine.blocked[e.id]
          const lvl = levelOf(engine.crowd[e.id] || 0)
          return (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#07090d" strokeWidth="14" strokeLinecap="round" />
              {selectedEdge === e.id && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth="17" strokeLinecap="round" opacity="0.45" />}
              {closed ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ff5252" strokeWidth="4" strokeDasharray="3 11" strokeLinecap="round" />
              ) : (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={layers.crowd ? LEVEL[lvl] : '#4a505b'} strokeWidth="7" strokeLinecap="round" opacity={layers.crowd ? 0.55 : 1} />
              )}
              {closed && (
                <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
                  <circle r="11" fill="#ff5252" stroke="#0b0e16" strokeWidth="2.5" />
                  <path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" stroke="#0b0e16" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
              <line className="edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} onClick={() => onEdge(e.id)}>
                <title>{`${a.name} to ${b.name}${tool === 'block' ? ' (click to close or reopen)' : ''}`}</title>
              </line>
            </g>
          )
        })}

        {layers.routes && route && route.length > 1 && (
          <g pointerEvents="none">
            <polyline points={pts(route)} fill="none" stroke={ROUTE} strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" opacity="0.22" />
            <polyline points={pts(route)} fill="none" stroke={ROUTE} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" className="amb-route" />
          </g>
        )}

        {/* customers */}
        <g pointerEvents="none">
          {engine.agents.map((a) => {
            const here = a.route[a.ri] ?? a.at
            let x
            let y
            if (a.state === 'dwell' || a.route[a.ri + 1] === undefined) {
              const ang = a.id * 2.4
              const rad = 14 + (a.id % 5) * 3.2
              x = NODE[here].x + Math.cos(ang) * rad
              y = NODE[here].y + Math.sin(ang) * rad
            } else {
              const E = EDGE[edgeKey(here, a.route[a.ri + 1])]
              const A = NODE[here]
              const B = NODE[a.route[a.ri + 1]]
              const f = a.pos / E.length
              const dx = B.x - A.x
              const dy = B.y - A.y
              const len = Math.hypot(dx, dy)
              const off = ((a.id % 7) - 3) * 1.4
              x = A.x + dx * f - (dy / len) * off
              y = A.y + dy * f + (dx / len) * off
            }
            return <circle key={a.id} cx={x} cy={y} r="2.6" fill={ARCH_COLORS[a.arch]} stroke="#05070b" strokeWidth="0.6" opacity={a.state === 'dwell' ? 0.75 : 1} />
          })}
        </g>

        {NODES.map((n) => {
          const z = engine.zones[n.id]
          const sel = selectedZone === n.id
          const w = 74
          const h = 40
          const fill = layers.climate ? tempColor(z.temp) : '#0c0f16'
          return (
            <g key={n.id} className="mapnode" transform={`translate(${n.x} ${n.y})`} onClick={() => onZone(n.id)}>
              {sel && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx="12" fill="none" stroke="#e8c46a" strokeWidth="2.5" strokeDasharray="5 4" />}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="8" fill={fill} stroke={TYPE[n.type]} strokeWidth="2" />
              <rect x={-w / 2 + 6} y={h / 2 - 6} width={(w - 12) * (z.pct / 100)} height="3" rx="1.5" fill={LEVEL[levelOf(z.pct)]} />
              <text textAnchor="middle" y="-2" fontSize="12" fontWeight="800" fill="#eef0f6">{n.short}</text>
              {layers.climate && <text textAnchor="middle" y="11" fontSize="10.5" fontWeight="700" fill="#fff" opacity="0.9">{z.temp.toFixed(1)}°</text>}
              {layers.labels && <text y={h / 2 + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#a8afbd" style={{ paintOrder: 'stroke' }} stroke="#07090d" strokeWidth="3.5">{n.name}</text>}
              <title>{`${n.name}: ${Math.round(z.pct)}% full, ${z.temp.toFixed(1)} °C, AC ${Math.round(z.ac)}%, lights ${Math.round(z.light)}%`}</title>
            </g>
          )
        })}
      </svg>
      <div className="map-badges">
        <span className={'badge ' + (engine.running ? 'live' : 'paused')}>{engine.running ? 'RUNNING' : 'PAUSED'}</span>
        <span className="badge sim" title="Deterministic sample mall with synthetic customers. No live feed, cameras or sensors are connected.">SIMULATED MALL</span>
        {!engine.isOpen() && <span className="badge paused">MALL CLOSED</span>}
        {tool === 'block' && <span className="badge tool">CLOSE TOOL: click a walkway</span>}
      </div>
      <div className="map-legend">
        <span><i style={{ background: '#35c98b' }} />quiet</span>
        <span><i style={{ background: '#ffb02e' }} />busy</span>
        <span><i style={{ background: '#ff5252' }} />crowded or closed</span>
        <span><i style={{ background: ROUTE }} />route</span>
        {['Errand', 'Family', 'Window', 'Spender'].map((s, i) => <span key={s}><i style={{ background: ARCH_COLORS[i], borderRadius: 8 }} />{s}</span>)}
      </div>
    </div>
  )
}
