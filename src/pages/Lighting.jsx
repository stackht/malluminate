import { useMemo, useState } from 'react'
import { useMall } from '../state.jsx'
import { LIGHT_SYSTEM, LIGHT_SUGENO, SUGENO_CONST } from '../lib/systems.js'
import { lightingBoth, compareGrid } from '../lib/lighting.js'
import { GateHead, Panel, Howto, Slider, Seg, LinePlot, SERIES_COLORS } from '../components/Ui.jsx'
import { MFPlot, OutputPlot, RuleTable } from '../components/FuzzyView.jsx'

function Corridor({ ambient, activity, brightness, label }) {
  const b = brightness / 100
  const sky = 20 + ambient * 1.1
  const lamps = [70, 190, 310, 430]
  const people = Math.round(activity / 16)
  const id = label.replace(/\W/g, '')
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6 }}>{label}: {Math.round(brightness)} % brightness</div>
      <div className="svgwrap">
        <svg viewBox="0 0 500 200" role="img" aria-label={`Corridor lit by the ${label} controller`}>
          <defs>
            {lamps.map((x) => (
              <radialGradient key={x} id={`lg${id}${x}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe9a0" stopOpacity={0.9 * b} />
                <stop offset="100%" stopColor="#ffe9a0" stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          <rect width="500" height="200" fill={`rgb(${sky * 0.28}, ${sky * 0.3}, ${sky * 0.42})`} />
          <rect x="190" y="0" width="120" height="34" fill={`rgb(${120 + ambient}, ${150 + ambient * 0.8}, ${200 + ambient * 0.5})`} opacity={0.15 + ambient / 140} />
          <rect y="140" width="500" height="60" fill="#1d1f25" />
          <rect y="132" width="500" height="10" fill="#2b2e36" />
          {lamps.map((x) => (
            <g key={x}>
              <circle cx={x} cy={52} r={22 + 74 * b} fill={`url(#lg${id}${x})`} />
              <ellipse cx={x} cy={142} rx={26 + 60 * b} ry={8 + 18 * b} fill={`url(#lg${id}${x})`} />
              <rect x={x - 12} y="44" width="24" height="6" rx="3" fill={b > 0.05 ? '#fff3c4' : '#4a4d52'} opacity={0.35 + 0.65 * b} />
              <rect x={x - 1.5} y="0" width="3" height="44" fill="#15171c" />
            </g>
          ))}
          {Array.from({ length: people }).map((_, i) => (
            <g key={i} transform={`translate(${34 + ((i * 83) % 440)} 140)`}>
              <circle cy="-22" r="5" fill="#07080b" />
              <rect x="-4" y="-17" width="8" height="22" rx="3" fill="#07080b" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// Sugeno output: each rule contributes a crisp value z with weight = firing strength.
function SugenoOutput({ result, mamdani }) {
  const colors = { off: SERIES_COLORS[3], low: SERIES_COLORS[0], medium: SERIES_COLORS[2], high: SERIES_COLORS[1] }
  const series = result.fired.filter((r) => r.strength > 0.001).map((r) => ({ pts: [[r.z, 0], [r.z, r.strength]], color: colors[r.then], w: 7 }))
  return (
    <div>
      <div className="field-top" style={{ marginBottom: 4 }}>
        <span className="lbl">Sugeno output: weighted crisp values</span>
        <span className="legend">{Object.entries(SUGENO_CONST).map(([k, v]) => <span key={k}><i style={{ background: colors[k] }} />{k} = {v}</span>)}</span>
      </div>
      <div className="svgwrap">
        <LinePlot series={series} xRange={[0, 100]} yRange={[0, 1]} markers={[{ at: result.crisp, label: `Sugeno ${result.crisp.toFixed(1)}%`, color: '#1d3bff', dash: '0' }, { at: mamdani, label: `Mamdani ${mamdani.toFixed(1)}%`, color: '#0b0b0c' }]} width={420} height={160} />
      </div>
    </div>
  )
}

const diffColor = (d) => `hsl(${220 - Math.min(1, d / 6) * 220} 70% ${92 - Math.min(1, d / 6) * 22}%)`

export default function Lighting() {
  const { engine, metrics, mode } = useMall()
  const [ambient, setAmbient] = useState(18)
  const [activity, setActivity] = useState(60)
  const [view, setView] = useState('both')

  const r = useMemo(() => lightingBoth(ambient, activity), [ambient, activity])
  const grid = useMemo(() => compareGrid(5), [])
  const coarse = useMemo(() => Array.from({ length: 11 }, (_, i) => Array.from({ length: 11 }, (__, j) => lightingBoth(i * 10, j * 10))), [])
  const sweepA = useMemo(() => {
    const m = []
    const s = []
    for (let a = 0; a <= 100; a += 2) { const x = lightingBoth(a, activity); m.push([a, x.mamdani]); s.push([a, x.sugeno]) }
    return [m, s]
  }, [activity])
  const sweepB = useMemo(() => {
    const m = []
    const s = []
    for (let b = 0; b <= 100; b += 2) { const x = lightingBoth(ambient, b); m.push([b, x.mamdani]); s.push([b, x.sugeno]) }
    return [m, s]
  }, [ambient])
  const timing = useMemo(() => {
    const N = 4000
    let t0 = performance.now()
    for (let i = 0; i < N; i++) lightingBoth(i % 100, (i * 7) % 100)
    return performance.now() - t0
  }, [])

  const live = engine.lightModel
  const shown = view === 'both' ? ['mamdani', 'sugeno'] : [view]

  return (
    <div className="page">
      <GateHead tech="Mamdani and Sugeno FIS" icon="bulb" title="Smart lighting">
        Two fuzzy inference systems decide how bright the lights should be from ambient light and customer activity: a Mamdani system (fuzzy output sets, centroid) and a Sugeno system (crisp rule outputs, weighted average). Compare their answers.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Corridor" tag="simulated">
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))`, gap: 20 }}>
              {shown.includes('mamdani') && <Corridor ambient={ambient} activity={activity} brightness={r.mamdani} label="Mamdani" />}
              {shown.includes('sugeno') && <Corridor ambient={ambient} activity={activity} brightness={r.sugeno} label="Sugeno" />}
            </div>
            <div className="row" style={{ marginTop: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Ambient light" value={ambient} min={0} max={100} unit=" %" onChange={setAmbient} hint="0 is dark, 100 is bright daylight" /></div>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Customer activity" value={activity} min={0} max={100} unit=" % full" onChange={setActivity} /></div>
              <div className="field"><label>Show</label><Seg label="Models shown" value={view} onChange={setView} options={[{ value: 'both', label: 'Both' }, { value: 'mamdani', label: 'Mamdani' }, { value: 'sugeno', label: 'Sugeno' }]} /></div>
            </div>
          </Panel>

          <Panel title="Fuzzification" tag="shared by both models">
            <div className="stack">
              <MFPlot variable={LIGHT_SYSTEM.inputs.ambient} value={ambient} active={r.m.fuzzified.ambient} />
              <MFPlot variable={LIGHT_SYSTEM.inputs.activity} value={activity} active={r.m.fuzzified.activity} />
            </div>
          </Panel>

          <Panel title="Mamdani: rules and output" tag="min, max, centroid">
            <RuleTable system={LIGHT_SYSTEM} result={r.m} nameOf={{ ambient: 'light', activity: 'activity' }} />
            <div style={{ marginTop: 16 }}><OutputPlot system={LIGHT_SYSTEM} result={r.m} unit="%" /></div>
          </Panel>

          <Panel title="Sugeno: rules and output" tag="zero-order, weighted average">
            <table>
              <thead><tr><th>IF</th><th>THEN brightness z =</th><th style={{ width: '30%' }}>Strength</th></tr></thead>
              <tbody>
                {r.s.fired.map((x, i) => (
                  <tr key={i} style={{ opacity: x.strength > 0.001 ? 1 : 0.45 }}>
                    <td>{Object.entries(x.if).map(([k, v]) => `${k === 'ambient' ? 'light' : k} ${v}`).join(' and ')}</td>
                    <td><b>{x.z}</b> <span className="note">({x.then})</span></td>
                    <td><div className="row tight"><div className="bar" style={{ flex: 1 }}><i style={{ width: `${x.strength * 100}%` }} /></div><span className="num note" style={{ minWidth: '3.2ch' }}>{x.strength.toFixed(2)}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}><SugenoOutput result={r.s} mamdani={r.mamdani} /></div>
          </Panel>

          <Panel title="Compare across the range" tag="same inputs, both models">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div className="field-top" style={{ marginBottom: 4 }}><span className="lbl">Brightness vs ambient light (activity {activity}%)</span><span className="legend"><span><i style={{ background: '#1d3bff' }} />Mamdani</span><span><i style={{ background: '#0b0b0c' }} />Sugeno</span></span></div>
                <div className="svgwrap"><LinePlot series={[{ pts: sweepA[0], color: '#1d3bff' }, { pts: sweepA[1], color: '#0b0b0c', dash: '5 4', w: 2 }]} xRange={[0, 100]} yRange={[0, 100]} markers={[{ at: ambient }]} width={420} height={170} xLabel="ambient %" /></div>
              </div>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div className="field-top" style={{ marginBottom: 4 }}><span className="lbl">Brightness vs activity (ambient {ambient}%)</span></div>
                <div className="svgwrap"><LinePlot series={[{ pts: sweepB[0], color: '#1d3bff' }, { pts: sweepB[1], color: '#0b0b0c', dash: '5 4', w: 2 }]} xRange={[0, 100]} yRange={[0, 100]} markers={[{ at: activity }]} width={420} height={170} xLabel="activity %" /></div>
              </div>
            </div>
          </Panel>

          <Panel title="Where do they differ?" tag="|Sugeno − Mamdani| in points">
            <div className="weekgrid" style={{ gridTemplateColumns: `4.5em repeat(11, 1fr)` }}>
              <span className="lbl" />
              {Array.from({ length: 11 }, (_, j) => <span key={j} className="lbl" style={{ textAlign: 'center' }}>{j * 10}</span>)}
              {coarse.map((row, i) => [
                <span key={'l' + i} className="lbl">{i * 10}</span>,
                ...row.map((c, j) => <span key={i + '-' + j} className="wcell" style={{ background: diffColor(Math.abs(c.diff)) }} title={`ambient ${i * 10}, activity ${j * 10}: Mamdani ${c.mamdani.toFixed(1)}, Sugeno ${c.sugeno.toFixed(1)}`}>{Math.abs(c.diff).toFixed(0)}</span>),
              ])}
            </div>
            <p className="note" style={{ marginTop: 8 }}>Rows are ambient light, columns are customer activity. The models agree closely where one rule dominates and differ most where neighbouring rules overlap.</p>
          </Panel>
        </div>

        <div className="stack">
          <div className="callout">
            <p>Mamdani FIS</p>
            <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.8rem)', lineHeight: 0.9 }} className="num">{r.mamdani.toFixed(1)}<span style={{ fontSize: '0.4em', marginLeft: 6 }}>%</span></h2>
            <p>Centroid of the clipped output sets</p>
          </div>
          <div className="callout">
            <p>Sugeno FIS</p>
            <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.8rem)', lineHeight: 0.9 }} className="num">{r.sugeno.toFixed(1)}<span style={{ fontSize: '0.4em', marginLeft: 6 }}>%</span></h2>
            <p>Weighted average of crisp rule outputs</p>
          </div>
          <Panel title="Comparison" tag="both models">
            <table>
              <tbody>
                <tr><td>Difference now (Sugeno − Mamdani)</td><td className="r num"><b>{r.diff >= 0 ? '+' : ''}{r.diff.toFixed(1)} points</b></td></tr>
                <tr><td>Mean |difference|, {grid.n} input pairs</td><td className="r num">{grid.meanAbs.toFixed(2)} points</td></tr>
                <tr><td>Largest difference</td><td className="r num">{grid.maxAbs.toFixed(1)} points</td></tr>
                <tr><td>Correlation of the two outputs</td><td className="r num">{grid.correlation.toFixed(4)}</td></tr>
                <tr><td>Time for 4000 evaluations of both</td><td className="r num">{timing.toFixed(0)} ms</td></tr>
              </tbody>
            </table>
            <p className="note" style={{ marginTop: 8 }}>Mamdani samples 201 points of the output sets for every answer; Sugeno needs only a weighted sum, so it is cheaper and gives smoother, more predictable outputs.</p>
          </Panel>
          <Panel title="In the live mall" tag={mode === 'ai' ? 'AI mode' : 'fixed mode'}>
            <p className="lbl" style={{ marginBottom: 6 }}>FIS used by the dashboard lighting</p>
            <Seg label="Lighting FIS" value={live} onChange={(m) => engine.setLightModel(m)} options={[{ value: 'mamdani', label: 'Mamdani' }, { value: 'sugeno', label: 'Sugeno' }]} />
            <div className="metrics" style={{ marginTop: 12 }}>
              <div className="metric"><b>{metrics.saved}</b><span>% energy saved (frozen reading)</span></div>
            </div>
            <p className="note" style={{ marginTop: 8 }}>Switch the model and open the dashboard: every section's lamps follow the chosen FIS.</p>
          </Panel>
          <Howto>
            <p>Both systems share the <strong>same two inputs, the same membership functions and the same nine rules</strong>, for example “IF ambient is dark AND activity is busy THEN brightness is high”.</p>
            <p><strong>Mamdani</strong>: each rule's output is a fuzzy set (off, low, medium, high). The sets are clipped at the rule strength, combined with a maximum, and the centroid of the result is the brightness.</p>
            <p><strong>Sugeno</strong>: each rule's output is a single number z (off 5, low 30, medium 60, high 88). The brightness is the weighted average Σ w·z / Σ w, where w is the rule strength.</p>
            <p>The two agree closely because Sugeno's numbers sit near the centres of Mamdani's sets. They differ most where several rules overlap, because the centroid depends on the shape and width of the sets.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
