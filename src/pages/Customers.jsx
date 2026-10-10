import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, FEATURES, vec, newPerceptron, perceptronEpoch, perceptronPredict, newCompetitive, competitiveEpoch, winnerOf, patVec, describeGroup } from '../lib/customers.js'
import { customerData } from '../lib/models.js'
import { GateHead, Panel, Howto, Seg, Slider } from '../components/Ui.jsx'
import Icon from '../components/Icon.jsx'

const CAT_COLORS = ['#16996a', '#e29a06', '#1d3bff']
const GROUP_COLORS = ['#1d3bff', '#e29a06', '#16996a', '#8a4dff']

function Scatter({ w = 560, h = 330, xKey, yKey, xMax, yMax, xLabel, yLabel, children }) {
  const px = (v) => 50 + (v / xMax) * (w - 64)
  const py = (v) => 12 + (1 - v / yMax) * (h - 52)
  return (
    <div className="svgwrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="plot" role="img" aria-label={`${yLabel} against ${xLabel}`}>
        <rect x="50" y="12" width={w - 64} height={h - 52} fill="#f7f7f5" />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line className="grid" x1={px(f * xMax)} x2={px(f * xMax)} y1="12" y2={h - 40} /><text x={px(f * xMax)} y={h - 24} textAnchor="middle">{Math.round(f * xMax)}</text><line className="grid" x1="50" x2={w - 14} y1={py(f * yMax)} y2={py(f * yMax)} /><text x="44" y={py(f * yMax) + 4} textAnchor="end">{Math.round(f * yMax * 100) / 100}</text></g>)}
        <text x={w - 14} y={h - 6} textAnchor="end" style={{ fill: '#aeb0b5' }}>{xLabel}</text>
        <text x="50" y="9" style={{ fill: '#aeb0b5' }}>{yLabel}</text>
        {children(px, py)}
      </svg>
    </div>
  )
}

function PerceptronLab() {
  const [p, setP] = useState(() => newPerceptron())
  const [hist, setHist] = useState([])
  const [eta, setEta] = useState(0.15)
  const [auto, setAuto] = useState(false)
  const [q, setQ] = useState({ age: 35, visits: 4, spend: 90, dwell: 80, promo: 0.5 })

  const train = () => { const r = perceptronEpoch(p, customerData, eta); setP(r.model); setHist((h) => [...h, r.errors]) }
  const reset = () => { setAuto(false); setP(newPerceptron()); setHist([]) }
  const last = hist[hist.length - 1]
  useEffect(() => {
    if (!auto) return undefined
    if (last === 0 || hist.length > 80) { setAuto(false); return undefined }
    const id = setTimeout(train, 90)
    return () => clearTimeout(id)
  }, [auto, hist]) // eslint-disable-line react-hooks/exhaustive-deps

  const conf = useMemo(() => {
    const m = [0, 0, 0].map(() => [0, 0, 0])
    for (const d of customerData) m[d.category][perceptronPredict(p, vec(d))]++
    return m
  }, [p])
  const acc = Math.round((100 * conf.reduce((s, r, i) => s + r[i], 0)) / customerData.length)
  const x = vec(q)
  const nets = CATEGORIES.map((_, k) => p.w[k].reduce((s, w, i) => s + w * x[i], p.b[k]))
  const pred = perceptronPredict(p, x)

  return (
    <div className="layout">
      <div className="stack">
        <Panel title="Customer records" tag="supervised · synthetic">
          <Scatter xLabel="Spend per visit ($)" yLabel="Visits / month" xMax={300} yMax={10}>
            {(px, py) => customerData.map((d, i) => {
              const ok = perceptronPredict(p, vec(d)) === d.category
              return <circle key={i} cx={px(d.spend)} cy={py(Math.min(10, d.visits))} r="4.2" fill={CAT_COLORS[d.category]} stroke={ok ? '#ffffff' : '#0b0b0c'} strokeWidth={ok ? 0.8 : 2.4} opacity="0.9" />
            })}
          </Scatter>
          <div className="legend" style={{ marginTop: 10 }}>
            {CATEGORIES.map((c, i) => <span key={c}><i style={{ background: CAT_COLORS[i], borderRadius: 7 }} />{c}</span>)}
            <span><i style={{ boxShadow: 'inset 0 0 0 2px #0b0b0c' }} />misclassified (black ring)</span>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={train}><Icon name="step" size={16} />Train 1 epoch</button>
            {auto ? <button className="btn ghost" onClick={() => setAuto(false)}><Icon name="pause" size={16} />Stop</button> : <button className="btn ghost" onClick={() => setAuto(true)}><Icon name="play" size={16} />Auto-train</button>}
            <button className="btn ghost" onClick={reset}><Icon name="reset" size={16} />Reset</button>
            <div style={{ minWidth: 180, flex: 1 }}><Slider label="Learning rate η" value={eta} min={0.02} max={0.6} step={0.01} onChange={setEta} /></div>
          </div>
        </Panel>
      </div>
      <div className="stack">
        <Panel title="Training status" tag={`epoch ${p.epoch}`}>
          <div className="metrics" style={{ marginBottom: 10 }}>
            <div className="metric"><b>{last ?? '-'}</b><span>errors last epoch</span></div>
            <div className="metric"><b>{acc}</b><span>% correct</span></div>
          </div>
          <table>
            <thead><tr><th>Actual \ predicted</th>{CATEGORIES.map((c) => <th key={c} className="r">{c}</th>)}</tr></thead>
            <tbody>{conf.map((row, i) => <tr key={i}><td>{CATEGORIES[i]}</td>{row.map((v, j) => <td key={j} className="r num" style={i === j ? { color: 'var(--blue)', fontWeight: 800 } : undefined}>{v}</td>)}</tr>)}</tbody>
          </table>
          {last === 0 && <p style={{ fontWeight: 800, color: 'var(--low)', marginTop: 8 }}>Converged: every record classified correctly.</p>}
        </Panel>
        <Panel title="Classify a new customer">
          {FEATURES.map((f) => <Slider key={f.key} label={f.label} value={q[f.key]} min={f.key === 'age' ? 16 : 0} max={f.max} step={f.key === 'promo' ? 0.05 : f.key === 'visits' ? 0.5 : 1} onChange={(v) => setQ({ ...q, [f.key]: v })} />)}
          <p style={{ fontWeight: 800, fontSize: '1.3rem', marginTop: 6 }}>{CATEGORIES[pred]} customer</p>
          <span className="formula">net = {nets.map((n, i) => `${CATEGORIES[i][0]}: ${n.toFixed(2)}`).join('   ')}</span>
        </Panel>
        <Howto>
          <p>Each category has a perceptron unit: <strong>net = w·x + b</strong>. The customer gets the category with the highest net input. When the answer is wrong, the perceptron rule moves two weight vectors:</p>
          <span className="formula">w_correct ← w_correct + η x<br />w_predicted ← w_predicted − η x</span>
          <p>Categories (Budget, Standard, Premium) are the predefined labels, based on typical spend. Records are synthetic.</p>
        </Howto>
      </div>
    </div>
  )
}

function CompetitiveLab() {
  const [m, setM] = useState(() => newCompetitive(customerData))
  const [eta, setEta] = useState(0.1)
  const [auto, setAuto] = useState(false)
  const train = () => setM((x) => competitiveEpoch(x, customerData, eta))
  const reset = () => { setAuto(false); setM(newCompetitive(customerData)) }
  useEffect(() => {
    if (!auto) return undefined
    if (m.epoch >= 40) { setAuto(false); return undefined }
    const id = setTimeout(train, 250)
    return () => clearTimeout(id)
  }, [auto, m.epoch]) // eslint-disable-line react-hooks/exhaustive-deps
  const assign = useMemo(() => customerData.map((d) => winnerOf(m.units, patVec(d))), [m])
  const info = m.units.map(describeGroup)
  // unit coordinates in (spend, dwell) for the 2D view: patVec = [visits, spend, dwell, promo]
  return (
    <div className="layout">
      <div className="stack">
        <Panel title="Shopping-pattern discovery" tag="unsupervised · no labels used">
          <Scatter xLabel="Spend per visit ($)" yLabel="Time in mall (min)" xMax={300} yMax={200}>
            {(px, py) => (
              <>
                {customerData.map((d, i) => <circle key={i} cx={px(d.spend)} cy={py(Math.min(200, d.dwell))} r="3.8" fill={m.epoch ? GROUP_COLORS[assign[i]] : '#8d9096'} opacity="0.75" />)}
                {m.trail.map((t, k) => <path key={k} d={`M${t.map((u) => `${px(u[1] * 300).toFixed(1)} ${py(u[2] * 200).toFixed(1)}`).join('L')}`} fill="none" stroke={GROUP_COLORS[k]} strokeWidth="2" strokeDasharray="3 3" />)}
                {m.units.map((u, k) => (
                  <g key={k} transform={`translate(${px(u[1] * 300)} ${py(u[2] * 200)})`}>
                    <rect x="-11" y="-11" width="22" height="22" rx="4" fill={GROUP_COLORS[k]} stroke="#ffffff" strokeWidth="3" />
                    <text textAnchor="middle" dy="4" fontSize="12" fontWeight="800" style={{ fill: '#ffffff' }}>{k + 1}</text>
                  </g>
                ))}
              </>
            )}
          </Scatter>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={train}><Icon name="step" size={16} />Train 1 epoch</button>
            {auto ? <button className="btn ghost" onClick={() => setAuto(false)}><Icon name="pause" size={16} />Stop</button> : <button className="btn ghost" onClick={() => setAuto(true)}><Icon name="play" size={16} />Auto-train</button>}
            <button className="btn ghost" onClick={reset}><Icon name="reset" size={16} />Reset</button>
            <div style={{ minWidth: 180, flex: 1 }}><Slider label="Learning rate η" value={eta} min={0.01} max={0.4} step={0.01} onChange={setEta} /></div>
          </div>
        </Panel>
      </div>
      <div className="stack">
        <Panel title="Groups found" tag={`epoch ${m.epoch}`}>
          <table>
            <thead><tr><th>Unit</th><th>Pattern</th><th className="r">Spend</th><th className="r">Stay</th><th className="r">Members</th></tr></thead>
            <tbody>{info.map((g, k) => <tr key={k}><td><span className="pill" style={{ background: GROUP_COLORS[k] }}>{k + 1}</span></td><td>{g.name}</td><td className="r num">${g.spend}</td><td className="r num">{g.dwell} m</td><td className="r num">{assign.filter((a) => a === k).length}</td></tr>)}</tbody>
          </table>
          <p className="note" style={{ marginTop: 8 }}>Groups are found from visits, spend, time in mall and promotion response. The descriptive names are added after learning by reading each group's centre.</p>
        </Panel>
        <Howto>
          <p>No labels this time. Four units start near random customers. For each record the unit with the <strong>closest weights wins</strong> and only the winner moves toward it:</p>
          <span className="formula">w_win ← w_win + η (x − w_win)</span>
          <p>Over the epochs each unit settles on a cluster of similar shoppers. The view shows spend against time in mall, two of the four features used.</p>
        </Howto>
      </div>
    </div>
  )
}

export default function Customers() {
  const [tab, setTab] = useState('perceptron')
  return (
    <div className="page">
      <GateHead tech="Perceptron + competitive learning" icon="users" title="Customer insight">
        Supervised learning sorts customers into predefined categories with the Perceptron rule. Unsupervised competitive learning finds groups of similar shoppers with no labels at all.
      </GateHead>
      <div className="row" style={{ marginBottom: 24 }}>
        <Seg label="Learning type" value={tab} onChange={setTab} options={[{ value: 'perceptron', label: 'Supervised: Perceptron' }, { value: 'competitive', label: 'Unsupervised: Competitive' }]} />
      </div>
      {tab === 'perceptron' ? <PerceptronLab /> : <CompetitiveLab />}
    </div>
  )
}
