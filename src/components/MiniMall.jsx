import { EDGES, NODES, NODE, levelOf } from '../lib/mall.js'

const LEVEL = { low: '#35c98b', medium: '#ffb02e', high: '#ff5252' }

// Static floor plan with search overlays. Used by the navigator page.
export default function MiniMall({ crowd = {}, blocked = {}, explored = [], frontier = [], current = null, pathEdges = [], start = null, goal = null, order = null, onEdge, onNode }) {
  const ex = new Set(explored)
  const fr = new Set(frontier)
  const pe = new Set(pathEdges)
  return (
    <div className="svgwrap">
      <svg viewBox="0 0 960 620" role="img" aria-label="Mall walkways">
        <rect width="960" height="620" fill="#0a0d13" />
        {EDGES.map((e) => {
          const a = NODE[e.a]
          const b = NODE[e.b]
          const closed = blocked[e.id]
          return (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#07090d" strokeWidth="14" strokeLinecap="round" />
              {closed ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ff5252" strokeWidth="4" strokeDasharray="3 11" strokeLinecap="round" />
              ) : (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LEVEL[levelOf(crowd[e.id] || 0)]} strokeWidth="7" strokeLinecap="round" opacity="0.5" />
              )}
              {pe.has(e.id) && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e8c46a" strokeWidth="10" strokeLinecap="round" className="route-glow" />}
              {closed && (
                <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
                  <circle r="11" fill="#ff5252" stroke="#0b0e16" strokeWidth="2.5" />
                  <path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5" stroke="#0b0e16" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
              {onEdge && <line className="edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} onClick={() => onEdge(e.id)}><title>{`${a.name} to ${b.name}: click to close or reopen`}</title></line>}
            </g>
          )
        })}
        {NODES.map((n) => {
          const isS = n.id === start
          const isG = n.id === goal
          return (
            <g key={n.id} className="mapnode" transform={`translate(${n.x} ${n.y})`} onClick={onNode ? () => onNode(n.id) : undefined}>
              {current === n.id && <circle r="38" fill="none" stroke="#fff" strokeWidth="3" />}
              {fr.has(n.id) && <rect x="-42" y="-26" width="84" height="52" rx="12" fill="none" stroke="#e8c46a" strokeWidth="2.5" strokeDasharray="5 4" />}
              <rect x="-36" y="-20" width="72" height="40" rx="8" fill={isG ? '#ff5252' : isS ? '#f3f2ec' : '#0c0f16'} stroke={ex.has(n.id) ? '#5ab2ff' : isS || isG ? '#e8c46a' : '#3a4150'} strokeWidth={ex.has(n.id) ? 3.5 : 2} />
              <text textAnchor="middle" y="4.5" fontSize="12.5" fontWeight="800" fill={isG ? '#101010' : isS ? '#101010' : '#eef0f6'}>{n.short}</text>
              {order && order[n.id] != null && <text y="-28" textAnchor="middle" fontSize="12" fontWeight="800" fill="#e8c46a" style={{ paintOrder: 'stroke' }} stroke="#07090d" strokeWidth="4">{order[n.id]}</text>}
              <text y="34" textAnchor="middle" fontSize="11" fontWeight="600" fill="#a8afbd" style={{ paintOrder: 'stroke' }} stroke="#07090d" strokeWidth="3.5">{n.name}</text>
              <title>{n.name}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
