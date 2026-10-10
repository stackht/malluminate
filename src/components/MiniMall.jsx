import { EDGES, NODES, NODE, levelOf } from '../lib/mall.js'

const LEVEL = { low: '#16996a', medium: '#e29a06', high: '#e5392a' }

// Static floor plan with search overlays. Used by the navigator page.
export default function MiniMall({ crowd = {}, blocked = {}, explored = [], frontier = [], current = null, pathEdges = [], start = null, goal = null, order = null, onEdge, onNode }) {
  const ex = new Set(explored)
  const fr = new Set(frontier)
  const pe = new Set(pathEdges)
  return (
    <div className="svgwrap">
      <svg viewBox="0 0 960 620" role="img" aria-label="Mall walkways">
        <rect width="960" height="620" fill="#ffffff" />
        {EDGES.map((e) => {
          const a = NODE[e.a]
          const b = NODE[e.b]
          const closed = blocked[e.id]
          return (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9c9c4" strokeWidth="18" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffffff" strokeWidth="16" />
              {closed ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e5392a" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
              ) : (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LEVEL[levelOf(crowd[e.id] || 0)]} strokeWidth="5" opacity="0.35" />
              )}
              {pe.has(e.id) && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1d3bff" strokeWidth="9" />}
              {closed && (
                <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
                  <circle r="11" fill="#ffffff" stroke="#e5392a" strokeWidth="2.5" />
                  <path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" stroke="#e5392a" strokeWidth="2.6" strokeLinecap="round" />
                </g>
              )}
              {onEdge && <line className="edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} onClick={() => onEdge(e.id)}><title>{`${a.name} to ${b.name}: click to close or reopen`}</title></line>}
            </g>
          )
        })}
        {NODES.map((n) => {
          const isS = n.id === start
          const isG = n.id === goal
          const dark = isS || isG
          return (
            <g key={n.id} className="mapnode" transform={`translate(${n.x} ${n.y})`} onClick={onNode ? () => onNode(n.id) : undefined}>
              {current === n.id && <rect x="-44" y="-28" width="88" height="56" fill="none" stroke="#0b0b0c" strokeWidth="2.5" />}
              {fr.has(n.id) && <rect x="-42" y="-26" width="84" height="52" fill="none" stroke="#0b0b0c" strokeWidth="1.5" strokeDasharray="5 4" />}
              <rect x="-36" y="-20" width="72" height="40" fill={isG ? '#1d3bff' : isS ? '#0b0b0c' : ex.has(n.id) ? '#e8ecff' : '#ffffff'} stroke={ex.has(n.id) ? '#1d3bff' : '#0b0b0c'} strokeWidth={ex.has(n.id) ? 2.2 : 1.1} />
              <text textAnchor="middle" y="4.5" fontSize="12.5" fontWeight="800" fill={dark ? '#ffffff' : '#0b0b0c'} style={{ letterSpacing: '0.04em' }}>{n.short}</text>
              {order && order[n.id] != null && <text y="-31" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1d3bff" style={{ paintOrder: 'stroke' }} stroke="#ffffff" strokeWidth="4">{order[n.id]}</text>}
              <text y="34" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2b2b2f" style={{ paintOrder: 'stroke' }} stroke="#ffffff" strokeWidth="3.5">{n.name}</text>
              <title>{n.name}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
