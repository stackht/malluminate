import { EDGES, NODES, NODE, EDGE, edgeKey, levelOf } from '../lib/mall.js'

export const ROUTE = '#1d3bff'
export const ARCH_COLORS = ['#16996a', '#e29a06', '#8a4dff', '#ff3d7f']
const LEVEL = { low: '#16996a', medium: '#e29a06', high: '#e5392a' }
const TYPE_FILL = { store: '#eef1ff', food: '#fff3e2', fun: '#f3edff', service: '#e7f6ee', hub: '#ffffff', facility: '#f2f2ef', entrance: '#0b0b0c' }

// light = cool, warm = hot, kept pale so ink text stays legible
const tempFill = (t) => {
  const k = Math.max(0, Math.min(1, (t - 22) / 8))
  return `hsl(${215 - k * 215} ${70 + k * 15}% ${93 - k * 6}%)`
}

export default function MallMap({ engine, tool, layers, selectedZone, selectedEdge, route, onZone, onEdge }) {
  const pts = (ids) => ids.map((id) => `${NODE[id].x},${NODE[id].y}`).join(' ')
  return (
    <div className="simmap svgwrap">
      <svg viewBox="0 0 960 620" role="img" aria-label="Live shopping mall floor plan">
        <defs>
          <pattern id="mallgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#f0f0ed" strokeWidth="1" /></pattern>
          <filter id="mglow"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        <rect width="960" height="620" fill="#ffffff" />
        <rect x="22" y="22" width="916" height="578" fill="#fafaf8" stroke="#0b0b0c" strokeWidth="2.2" />
        <rect x="22" y="22" width="916" height="578" fill="url(#mallgrid)" />
        <text x="44" y="52" fontSize="13" fontWeight="800" fill="#0b0b0c" style={{ letterSpacing: '0.12em' }}>MALLUMINATE · LEVEL 1</text>
        <text x="44" y="68" fontSize="10.5" fontWeight="600" fill="#66666b">Synthetic floor plan, not to scale of any real building</text>
        <g transform="translate(900 66)" fill="#0b0b0c"><path d="M0 -22L8 0H-8Z" /><text y="18" textAnchor="middle" fontSize="11" fontWeight="800">N</text></g>
        <g transform="translate(44 584)"><path d="M0 0H125M0 -5V5M62.5 -3V3M125 -5V5" stroke="#0b0b0c" strokeWidth="1.6" fill="none" /><text x="132" y="4" fontSize="10.5" fontWeight="700" fill="#0b0b0c">20 m</text></g>

        {layers.lights && NODES.map((n) => {
          const b = engine.zones[n.id].light / 100
          return <circle key={'g' + n.id} cx={n.x} cy={n.y} r={30 + 62 * b} fill="#ffc83d" opacity={0.08 + 0.42 * b} filter="url(#mglow)" />
        })}

        {EDGES.map((e) => {
          const a = NODE[e.a]
          const b = NODE[e.b]
          const closed = engine.blocked[e.id]
          const lvl = levelOf(engine.crowd[e.id] || 0)
          return (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9c9c4" strokeWidth="22" strokeLinecap="butt" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffffff" strokeWidth="20" strokeLinecap="butt" />
              {selectedEdge === e.id && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1d3bff" strokeWidth="22" strokeLinecap="butt" opacity="0.18" />}
              {closed ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e5392a" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
              ) : (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={layers.crowd ? LEVEL[lvl] : '#e4e4e0'} strokeWidth="6" strokeLinecap="butt" opacity={layers.crowd ? (lvl === 'low' ? 0.38 : 0.9) : 1} />
              )}
              {closed && (
                <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
                  <circle r="11" fill="#ffffff" stroke="#e5392a" strokeWidth="2.5" />
                  <path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" stroke="#e5392a" strokeWidth="2.6" strokeLinecap="round" />
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
            <polyline points={pts(route)} fill="none" stroke={ROUTE} strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.14" />
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
              const rad = 24 + (a.id % 5) * 4
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
              const off = ((a.id % 7) - 3) * 1.3
              x = A.x + dx * f - (dy / len) * off
              y = A.y + dy * f + (dx / len) * off
            }
            return <circle key={a.id} cx={x} cy={y} r="3.9" fill={ARCH_COLORS[a.arch]} stroke="#ffffff" strokeWidth="1.2" opacity={a.state === 'dwell' ? 0.8 : 1} />
          })}
        </g>

        {NODES.map((n) => {
          const z = engine.zones[n.id]
          const sel = selectedZone === n.id
          const w = 92
          const h = 50
          const fill = layers.climate ? tempFill(z.temp) : TYPE_FILL[n.type]
          const dark = !layers.climate && n.type === 'entrance'
          const bar = (w - 14) * (z.pct / 100)
          return (
            <g key={n.id} className="mapnode" transform={`translate(${n.x} ${n.y})`} onClick={() => onZone(n.id)}>
              {sel && (
                <g stroke="#1d3bff" strokeWidth="2.5" fill="none">
                  <path d={`M${-w / 2 - 6} ${-h / 2 + 8}V${-h / 2 - 6}H${-w / 2 + 8}`} />
                  <path d={`M${w / 2 + 6} ${-h / 2 + 8}V${-h / 2 - 6}H${w / 2 - 8}`} />
                  <path d={`M${-w / 2 - 6} ${h / 2 - 8}V${h / 2 + 6}H${-w / 2 + 8}`} />
                  <path d={`M${w / 2 + 6} ${h / 2 - 8}V${h / 2 + 6}H${w / 2 - 8}`} />
                </g>
              )}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke="#0b0b0c" strokeWidth={sel ? 2 : 1.2} />
              <rect x={-w / 2 + 7} y={h / 2 - 8} width={w - 14} height="3.5" fill={dark ? "#3a3a3f" : "#e3e3df"} />
              <rect x={-w / 2 + 7} y={h / 2 - 8} width={bar} height="3.5" fill={LEVEL[levelOf(z.pct)]} />
              <text textAnchor="middle" y={layers.climate ? -3 : 2} fontSize="14" fontWeight="800" fill={dark ? "#ffffff" : "#0b0b0c"} style={{ letterSpacing: '0.04em' }}>{n.short}</text>
              {layers.climate && <text textAnchor="middle" y="12" fontSize="11.5" fontWeight="700" fill="#0b0b0c">{z.temp.toFixed(1)}°</text>}
              {layers.labels && <text y={h / 2 + 16} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#2b2b2f" style={{ paintOrder: 'stroke' }} stroke="#ffffff" strokeWidth="3.5">{n.name}</text>}
              <title>{`${n.name}: ${Math.round(z.pct)}% full, ${z.temp.toFixed(1)} °C, AC ${Math.round(z.ac)}%, lights ${Math.round(z.light)}%`}</title>
            </g>
          )
        })}
      </svg>
      <div className="map-badges">
        <span className={'badge ' + (engine.running ? 'live' : 'paused')}>{engine.running ? 'RUNNING' : 'PAUSED'}</span>
        <span className="badge sim" title="Deterministic sample mall with synthetic customers. No live feed, cameras or sensors are connected.">SIMULATED MALL</span>
        {!engine.isOpen() && <span className="badge">MALL CLOSED</span>}
        {tool === 'block' && <span className="badge tool">CLOSE TOOL: click a walkway</span>}
      </div>
      <div className="map-legend">
        <span><i style={{ background: '#16996a', opacity: 0.5 }} />quiet</span>
        <span><i style={{ background: '#e29a06' }} />busy</span>
        <span><i style={{ background: '#e5392a' }} />crowded or closed</span>
        <span><i style={{ background: ROUTE }} />route</span>
        {['Errand', 'Family', 'Window', 'Spender'].map((s, i) => <span key={s}><i style={{ background: ARCH_COLORS[i], borderRadius: 8 }} />{s}</span>)}
      </div>
    </div>
  )
}
