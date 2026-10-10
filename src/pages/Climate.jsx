import { useMemo, useState } from 'react'
import { useMall } from '../state.jsx'
import { AC_SYSTEM } from '../lib/systems.js'
import { infer } from '../lib/fuzzy.js'
import { NODES, NODE } from '../lib/mall.js'
import { GateHead, Panel, Howto, Slider } from '../components/Ui.jsx'
import { MFPlot, OutputPlot, RuleTable } from '../components/FuzzyView.jsx'

export default function Climate() {
  const { zones, metrics, mode } = useMall()
  const [temp, setTemp] = useState(27.5)
  const [crowd, setCrowd] = useState(65)
  const res = useMemo(() => infer(AC_SYSTEM, { temperature: temp, crowd }), [temp, crowd])
  const power = Math.round(res.crisp)
  const hot = [...NODES].sort((a, b) => zones[b.id].temp - zones[a.id].temp).slice(0, 3)

  return (
    <div className="page">
      <GateHead tech="Fuzzy controller" icon="snow" title="Climate control">
        A simple fuzzy logic controller sets the air-conditioning power from indoor temperature and how crowded the section is: more people mean more heat, so the cooling reacts earlier.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Inputs" tag="what-if">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Indoor temperature" value={temp} min={16} max={36} step={0.5} unit=" °C" onChange={setTemp} /></div>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Crowd in the section" value={crowd} min={0} max={100} unit=" % full" onChange={setCrowd} /></div>
            </div>
          </Panel>
          <Panel title="Step 1: fuzzify" tag="membership degrees">
            <div className="stack">
              <MFPlot variable={AC_SYSTEM.inputs.temperature} value={temp} active={res.fuzzified.temperature} />
              <MFPlot variable={AC_SYSTEM.inputs.crowd} value={crowd} active={res.fuzzified.crowd} />
            </div>
          </Panel>
          <Panel title="Step 2: fire the rules" tag="min for AND">
            <RuleTable system={AC_SYSTEM} result={res} nameOf={{ temperature: 'temp', crowd: 'crowd' }} />
          </Panel>
          <Panel title="Step 3: defuzzify" tag="centroid">
            <OutputPlot system={AC_SYSTEM} result={res} unit="%" />
          </Panel>
        </div>
        <div className="stack">
          <div className="callout">
            <p style={{ fontWeight: 800 }}>Air-conditioning power</p>
            <h2 style={{ fontSize: 'clamp(3.4rem, 7vw, 5.4rem)', lineHeight: 0.9 }} className="num">{power}<span style={{ fontSize: '0.4em', marginLeft: 6 }}>%</span></h2>
            <p>{power < 15 ? 'Off: the section is cool enough.' : power < 40 ? 'Low cooling: comfortable, few people.' : power < 70 ? 'Medium cooling.' : 'High cooling: warm and crowded.'}</p>
          </div>
          <Panel title="In the live mall" tag={mode === 'ai' ? 'AI mode' : 'fixed mode'}>
            <div className="metrics" style={{ marginBottom: 10 }}>
              <div className="metric"><b>{metrics.temp.toFixed(1)}</b><span>avg °C</span></div>
              <div className="metric"><b>{metrics.saved}</b><span>% energy saved</span></div>
            </div>
            <p className="lbl" style={{ marginBottom: 4 }}>Warmest sections</p>
            <table><tbody>{hot.map((n) => <tr key={n.id}><td>{NODE[n.id].name}</td><td className="r num">{zones[n.id].temp.toFixed(1)} °C · AC {Math.round(zones[n.id].ac)}%</td></tr>)}</tbody></table>
            <p className="note" style={{ marginTop: 8 }}>The dashboard runs this controller for every section. In fixed mode the AC stays at 50%.</p>
          </Panel>
          <Howto>
            <p>A <strong>Mamdani</strong> controller: <strong>fuzzify</strong> turns each reading into degrees of “cold / comfortable / warm / hot” and “low / medium / high crowd”. <strong>Infer</strong>: each rule fires as strongly as its weakest condition. <strong>Aggregate</strong> the clipped output shapes and <strong>defuzzify</strong> with the centroid to get one cooling percentage.</p>
            <p>Try 24 °C with a full crowd: still comfortable, but the crowd rule raises the cooling before the temperature climbs.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
