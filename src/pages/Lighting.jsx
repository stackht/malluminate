import { useMemo, useState } from 'react'
import { LIGHT_SYSTEM } from '../lib/systems.js'
import { infer } from '../lib/fuzzy.js'
import { GateHead, Panel, Howto, Slider } from '../components/Ui.jsx'
import { MFPlot, OutputPlot, RuleTable } from '../components/FuzzyView.jsx'

function Corridor({ ambient, activity, brightness }) {
  const b = brightness / 100
  const sky = 20 + ambient * 1.1
  const lamps = [90, 250, 410, 570, 730]
  const people = Math.round(activity / 14)
  return (
    <div className="svgwrap">
      <svg viewBox="0 0 820 240" role="img" aria-label="Mall corridor with lamps">
        <defs>
          {lamps.map((x) => (
            <radialGradient key={x} id={`lg${x}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe9a0" stopOpacity={0.9 * b} />
              <stop offset="100%" stopColor="#ffe9a0" stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <rect width="820" height="240" fill={`rgb(${sky * 0.28}, ${sky * 0.3}, ${sky * 0.42})`} />
        <rect x="320" y="0" width="180" height="46" fill={`rgb(${120 + ambient}, ${150 + ambient * 0.8}, ${200 + ambient * 0.5})`} opacity={0.15 + ambient / 140} />
        <text x="410" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0b0e16" opacity={ambient > 8 ? 0.8 : 0}>skylight</text>
        <rect y="170" width="820" height="70" fill="#1d1f25" />
        <rect y="160" width="820" height="12" fill="#2b2e36" />
        {lamps.map((x) => (
          <g key={x}>
            <circle cx={x} cy={62} r={26 + 90 * b} fill={`url(#lg${x})`} />
            <ellipse cx={x} cy={172} rx={30 + 80 * b} ry={10 + 22 * b} fill={`url(#lg${x})`} />
            <rect x={x - 14} y="52" width="28" height="7" rx="3" fill={b > 0.05 ? '#fff3c4' : '#4a4d52'} opacity={0.35 + 0.65 * b} />
            <rect x={x - 1.5} y="0" width="3" height="52" fill="#15171c" />
          </g>
        ))}
        {Array.from({ length: people }).map((_, i) => (
          <g key={i} transform={`translate(${40 + ((i * 97) % 740)} 168)`}>
            <circle cy="-26" r="6" fill="#07080b" />
            <rect x="-5" y="-20" width="10" height="26" rx="3" fill="#07080b" />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function Lighting() {
  const [ambient, setAmbient] = useState(18)
  const [activity, setActivity] = useState(60)
  const res = useMemo(() => infer(LIGHT_SYSTEM, { ambient, activity }), [ambient, activity])
  const b = Math.round(res.crisp)
  return (
    <div className="page">
      <GateHead tech="Fuzzy inference" icon="bulb" title="Smart lighting">
        Lights follow the daylight coming through skylights and the number of customers around: dimmer when it is bright or empty, brighter when it is dark and busy.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Corridor" tag="simulated">
            <Corridor ambient={ambient} activity={activity} brightness={b} />
            <div className="row" style={{ marginTop: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Ambient light" value={ambient} min={0} max={100} unit=" %" onChange={setAmbient} hint="0 is dark, 100 is bright daylight" /></div>
              <div style={{ flex: 1, minWidth: 220 }}><Slider label="Customer activity" value={activity} min={0} max={100} unit=" % full" onChange={setActivity} /></div>
            </div>
          </Panel>
          <Panel title="Fuzzification" tag="membership functions">
            <div className="stack">
              <MFPlot variable={LIGHT_SYSTEM.inputs.ambient} value={ambient} active={res.fuzzified.ambient} />
              <MFPlot variable={LIGHT_SYSTEM.inputs.activity} value={activity} active={res.fuzzified.activity} />
            </div>
          </Panel>
          <Panel title="Fuzzy rules" tag="9 rules"><RuleTable system={LIGHT_SYSTEM} result={res} nameOf={{ ambient: 'light', activity: 'activity' }} /></Panel>
          <Panel title="Defuzzified output" tag="centroid"><OutputPlot system={LIGHT_SYSTEM} result={res} unit="%" /></Panel>
        </div>
        <div className="stack">
          <div className="callout">
            <p style={{ fontWeight: 800 }}>Lighting brightness</p>
            <h2 style={{ fontSize: 'clamp(3.4rem, 7vw, 5.4rem)', lineHeight: 0.9 }} className="num">{b}<span style={{ fontSize: '0.4em', marginLeft: 6 }}>%</span></h2>
            <p>{b < 12 ? 'Lights off: daylight is enough.' : b < 40 ? 'Low glow.' : b < 75 ? 'Medium brightness.' : 'Full brightness: dark and busy.'}</p>
          </div>
          <Panel title="Energy saved vs always-on"><div className="metric"><b>{100 - b}%</b><span>of full-power lighting not used here</span></div></Panel>
          <Howto>
            <p>Two inputs and nine rules, for example <strong>IF ambient is dark AND activity is busy THEN brightness is high</strong>. Membership functions let a reading be partly “dim” and partly “bright”, so the output changes smoothly instead of jumping.</p>
            <p>Atrium skylights bring in daylight; interior stores get almost none, so the dashboard shows very different lighting from section to section.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
