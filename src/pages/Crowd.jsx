import { useEffect, useMemo, useRef, useState } from 'react'
import { useMall } from '../state.jsx'
import { newAnfis, anfisEpoch, anfisMse, anfisPredict, memberships, ANFIS_SPEC, DAYS, crowdLevel } from '../lib/crowd.js'
import { crowdData, crowdModels } from '../lib/models.js'
import { infer } from '../lib/fuzzy.js'
import { FUZZY_CROWD } from '../lib/systems.js'
import { GateHead, Panel, Howto, Slider, Seg, Pill, LinePlot, SERIES_COLORS } from '../components/Ui.jsx'
import Icon from '../components/Icon.jsx'

const heat = (v) => `hsl(${150 - (Math.max(0, Math.min(100, v)) / 100) * 150} 65% ${30 + (v / 100) * 10}%)`

export default function Crowd() {
  const live = useMall()
  const initial = useRef(newAnfis()).current
  const [model, setModel] = useState(initial)
  const [losses, setLosses] = useState(() => [anfisMse(initial, crowdData)])
  const [auto, setAuto] = useState(false)
  const [hour, setHour] = useState(Math.round(Math.min(21, Math.max(9, live.hour)) * 4) / 4)
  const [day, setDay] = useState(live.day)
  const [promo, setPromo] = useState(live.promo.on ? 1 : 0)

  const train = (n = 1) => {
    setModel((m) => {
      let x = m
      const ls = []
      for (let i = 0; i < n; i++) { x = anfisEpoch(x, crowdData); ls.push(anfisMse(x, crowdData)) }
      setLosses((l) => [...l, ...ls])
      return x
    })
  }
  const reset = () => { setAuto(false); setModel(initial); setLosses([anfisMse(initial, crowdData)]) }
  useEffect(() => {
    if (!auto) return undefined
    if (model.epoch >= 80) { setAuto(false); return undefined }
    const id = setTimeout(() => train(1), 80)
    return () => clearTimeout(id)
  }, [auto, model.epoch]) // eslint-disable-line react-hooks/exhaustive-deps

  const { mlp } = crowdModels()
  const x = [hour, day, promo]
  const fz = infer(FUZZY_CROWD, { time: hour, day, promo }).crisp
  const nn = mlp.predict(x)
  const nf = anfisPredict(model, x).value
  const lvl = crowdLevel(nf)

  const accuracy = useMemo(() => {
    const score = (f) => Math.round((100 * crowdData.filter((d) => crowdLevel(f(d.x)) === crowdLevel(d.y)).length) / crowdData.length)
    return { fuzzy: score((p) => infer(FUZZY_CROWD, { time: p[0], day: p[1], promo: p[2] }).crisp), neural: score((p) => mlp.predict(p)), neuro: score((p) => anfisPredict(model, p).value) }
  }, [model, mlp])

  const mf0 = useMemo(() => memberships(initial, 0), [initial])
  const mf = useMemo(() => memberships(model, 0), [model])
  const hours = Array.from({ length: 13 }, (_, i) => 9 + i)
  const lossNow = losses[losses.length - 1]

  return (
    <div className="page">
      <GateHead tech="Neuro-fuzzy (ANFIS)" icon="brain" title="Crowd forecast">
        A hybrid neuro-fuzzy system predicts whether the mall will be low, medium or high crowd from time of day, day of week and promotions. Fuzzy rules supply the reasoning; training supplies the numbers.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Prediction" tag="synthetic training data">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Time of day" value={hour} min={9} max={21.75} step={0.25} unit=" h" onChange={setHour} /></div>
              <div className="field" style={{ minWidth: 150 }}>
                <label>Day of week</label>
                <select value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="Day of week">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
              </div>
              <div className="field"><label>Promotion</label><Seg label="Promotion" value={promo} onChange={setPromo} options={[{ value: 0, label: 'None' }, { value: 1, label: 'Running' }]} /></div>
            </div>
            <table style={{ marginTop: 14 }}>
              <thead><tr><th>Model</th><th className="r">Crowd index</th><th className="r">Class</th><th className="r">Accuracy on the data</th></tr></thead>
              <tbody>
                <tr><td>Fuzzy rules only</td><td className="r num">{fz.toFixed(0)}</td><td className="r"><Pill level={crowdLevel(fz)} /></td><td className="r num">{accuracy.fuzzy}%</td></tr>
                <tr><td>Neural network only</td><td className="r num">{nn.toFixed(0)}</td><td className="r"><Pill level={crowdLevel(nn)} /></td><td className="r num">{accuracy.neural}%</td></tr>
                <tr className="sel"><td><b>Neuro-fuzzy (hybrid)</b></td><td className="r num"><b>{nf.toFixed(0)}</b></td><td className="r"><Pill level={lvl} /></td><td className="r num"><b>{accuracy.neuro}%</b></td></tr>
              </tbody>
            </table>
          </Panel>

          <Panel title="Week at a glance" tag="neuro-fuzzy prediction">
            <div className="weekgrid" style={{ gridTemplateColumns: `4.5em repeat(${hours.length}, 1fr)` }}>
              <span />
              {hours.map((h) => <span key={h} className="lbl" style={{ textAlign: 'center' }}>{h}</span>)}
              {DAYS.map((d, di) => [
                <span key={d} className="lbl">{d.slice(0, 3)}</span>,
                ...hours.map((h) => {
                  const v = anfisPredict(model, [h, di, promo]).value
                  return <span key={d + h} className="wcell" style={{ background: heat(v) }} title={`${d} ${h}:00 → ${v.toFixed(0)} (${crowdLevel(v)})`}>{Math.round(v)}</span>
                }),
              ])}
            </div>
            <div className="legend" style={{ marginTop: 10 }}><span><i style={{ background: heat(10) }} />low</span><span><i style={{ background: heat(50) }} />medium</span><span><i style={{ background: heat(90) }} />high</span><span className="note">Hour of day across, promotion {promo ? 'on' : 'off'}.</span></div>
          </Panel>

          <Panel title="Learned membership functions: time of day" tag="dashed = before training">
            <div className="field-top" style={{ marginBottom: 4 }}><span className="legend">{ANFIS_SPEC[0].sets.map((l, k) => <span key={l}><i style={{ background: SERIES_COLORS[k] }} />{l}</span>)}</span></div>
            <div className="svgwrap">
              <LinePlot series={[...mf0.map((pts, k) => ({ pts, color: SERIES_COLORS[k], dash: '3 4', w: 1.5, opacity: 0.5 })), ...mf.map((pts, k) => ({ pts, color: SERIES_COLORS[k] }))]} xRange={[9, 22]} yRange={[0, 1]} markers={[{ at: hour }]} width={420} height={150} />
            </div>
          </Panel>
        </div>

        <div className="stack">
          <div className="callout">
            <p style={{ fontWeight: 800 }}>Predicted crowd</p>
            <h2 style={{ fontSize: 'clamp(3.4rem, 7vw, 5.4rem)', lineHeight: 0.9 }} className="num">{Math.round(nf)}<span style={{ fontSize: '0.4em', marginLeft: 6 }}>/ 100</span></h2>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'capitalize' }}>{lvl} crowd expected</p>
          </div>
          <Panel title="Training" tag={`epoch ${model.epoch}`}>
            <div className="row" style={{ marginBottom: 12 }}>
              <button className="btn" onClick={() => train(1)}><Icon name="step" size={16} />Train 1</button>
              <button className="btn ghost" onClick={() => train(10)}>Train 10</button>
              {auto ? <button className="btn ghost" onClick={() => setAuto(false)}><Icon name="pause" size={16} />Stop</button> : <button className="btn ghost" onClick={() => setAuto(true)}><Icon name="play" size={16} />Auto</button>}
              <button className="btn ghost" onClick={reset}><Icon name="reset" size={16} />Reset</button>
            </div>
            <div className="metric" style={{ marginBottom: 8 }}><b>{lossNow.toFixed(0)}</b><span>mean squared error {losses.length > 1 ? `(started at ${losses[0].toFixed(0)})` : '(untrained)'}</span></div>
            <div className="svgwrap"><LinePlot series={[{ pts: losses.map((l, i) => [i, l]), color: '#e8c46a' }]} xRange={[0, Math.max(10, losses.length - 1)]} yRange={[0, Math.ceil(Math.max(...(losses.length > 2 ? losses.slice(1) : losses)) / 10) * 10 || 10]} yTicks={4} width={420} height={150} /></div>
          </Panel>
          <Panel title="Training data" tag={`${crowdData.length} synthetic samples`}>
            <table>
              <thead><tr><th>Time</th><th>Day</th><th>Promo</th><th className="r">Crowd</th></tr></thead>
              <tbody>{crowdData.slice(0, 6).map((d, i) => <tr key={i}><td className="num">{d.x[0].toFixed(1)}</td><td>{DAYS[d.x[1]].slice(0, 3)}</td><td>{d.x[2] ? 'yes' : 'no'}</td><td className="r num">{d.y.toFixed(0)} <Pill level={crowdLevel(d.y)} /></td></tr>)}</tbody>
            </table>
          </Panel>
          <Howto>
            <p><strong>Fuzzy side:</strong> 4 time-of-day sets × 3 day sets × 2 promotion sets give 24 IF-THEN rules (for example “IF evening AND weekend AND promotion running THEN crowd is high”). Each rule outputs a linear function of the inputs (Takagi-Sugeno).</p>
            <p><strong>Neural side:</strong> every epoch uses <strong>hybrid learning</strong>: least squares fits the rule outputs, then gradient descent nudges the membership curves. Crowd below 35 is low, below 65 medium, otherwise high.</p>
            <p>The data is generated from a made-up crowd pattern with noise. It shows the method, not real mall traffic.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
