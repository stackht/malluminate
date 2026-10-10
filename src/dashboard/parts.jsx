import { useMemo } from 'react'
import { SCENARIOS, OPEN, CLOSE } from '../sim/engine.js'
import { fmtClock, fmtWall, DAY_SHORT } from '../sim/format.js'
import { DAYS } from '../lib/crowd.js'
import { crowdAll } from '../lib/models.js'
import { NODES, STORE_IDS, NODE, roadName } from '../lib/mall.js'
import Icon from '../components/Icon.jsx'
import { LinePlot, Seg, Slider, Pill } from '../components/Ui.jsx'

export function TopBar({ sim }) {
  const started = sim.time > SCENARIOS[sim.scenario].start
  return (
    <header className="topbar">
      <div className="topbar-status">
        <span className="chip sim" title="This application runs a deterministic sample mall with synthetic customers. No live feed, camera or sensor is connected."><i /> Simulated data</span>
        <span className={'chip ' + (sim.isOpen() ? 'ok' : 'sim')}><i /> Mall {sim.isOpen() ? 'open' : 'closed'}</span>
      </div>
      <div className="clocks">
        <div title="Simulation time: advances only while the simulation runs"><span>Simulation time</span><b className="num">{DAY_SHORT[sim.day()]} {fmtClock(sim.time)}</b></div>
        <div title="Your computer's clock: not related to the simulation"><span>Wall clock</span><b className="num">{fmtWall(sim.wallNow)}</b></div>
      </div>
      <div className="runctl">
        {sim.running ? (
          <button className="btn" onClick={() => sim.pause()}><Icon name="pause" size={16} />Pause</button>
        ) : (
          <button className="btn" onClick={() => sim.start()}><Icon name="play" size={16} />{started ? 'Resume' : 'Start'}</button>
        )}
        <button className="btn ghost" onClick={() => sim.reset()}><Icon name="reset" size={16} />Reset</button>
        <Seg label="Simulation speed" value={sim.speed} onChange={(v) => sim.setSpeed(v)} options={[1, 10, 60, 300].map((v) => ({ value: v, label: `${v}×` }))} />
        <Seg label="Building control mode" value={sim.mode} onChange={(m) => sim.setMode(m)} options={[{ value: 'fixed', label: 'Fixed' }, { value: 'ai', label: 'AI · fuzzy' }]} />
      </div>
    </header>
  )
}

export function Kpis({ sim }) {
  const m = sim.metrics
  const cards = [
    { k: 'Visitors inside', v: m.inside, u: '', hint: 'Customers currently in the mall' },
    { k: 'Crowd level', v: m.crowd, u: '/100', level: m.level, extra: m.level, hint: 'Visitors inside as a share of the busiest expected day. Low under 35, high from 65' },
    { k: 'Indoor temperature', v: m.temp.toFixed(1), u: '°C', level: m.temp < 26 ? 'low' : m.temp < 28.5 ? 'medium' : 'high', hint: 'Average over all sections, weighted by how many people are there' },
    { k: 'Power draw', v: m.power.toFixed(0), u: 'kW', extra: `${m.saved >= 0 ? m.saved : 0}% saved`, level: m.saved >= 20 ? 'low' : undefined, hint: 'Lighting plus air conditioning. Saved is versus fixed control (lights 100%, AC 50%)' },
    { k: 'Active alerts', v: m.alerts, u: '', level: m.alerts ? 'medium' : 'low', hint: 'Closed walkways + overcrowded sections + running promotion' },
  ]
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div className={'kpi' + (c.level ? ' ' + c.level : '')} key={c.k} title={c.hint}>
          <span>{c.k}</span>
          <b className="num">{c.v}<small>{c.u}</small></b>
          {c.extra && <em className="kpi-x">{c.extra}</em>}
        </div>
      ))}
    </div>
  )
}

export function Controls({ sim, tool, setTool, layers, setLayers, selectedEdge }) {
  const closed = Object.keys(sim.blocked)
  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }))
  return (
    <div className="controls panel">
      <div className="controls-grid">
        <div className="field">
          <Slider label="Visitor flow (× expected)" value={sim.scale} min={0} max={2} step={0.1} unit="×" onChange={(v) => sim.setScale(v)} />
          <div className="row tight">
            <button className="btn ghost sm" onClick={() => sim.addVisitors(10)}>+ 10 visitors</button>
            <button className="btn ghost sm" onClick={() => sim.removeVisitors(10)}>− 10 visitors</button>
          </div>
        </div>
        <div className="field">
          <span className="lbl">Promotion</span>
          <div className="row tight">
            <button className="btn ghost sm chipbtn" aria-pressed={sim.promo.on} onClick={() => sim.setPromo(!sim.promo.on)}>{sim.promo.on ? 'Running' : 'Start promotion'}</button>
            <select value={sim.promo.store} onChange={(e) => sim.setPromo(sim.promo.on, e.target.value)} aria-label="Promoted store" style={{ flex: 1, minWidth: 120 }}>
              {STORE_IDS.map((id) => <option key={id} value={id}>{NODE[id].name}</option>)}
            </select>
          </div>
          <label className="lbl" style={{ marginTop: 6 }}>Day of week</label>
          <select value={sim.day()} onChange={(e) => sim.setDay(Number(e.target.value))} aria-label="Day of week">
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <span className="lbl">Map tool</span>
          <Seg label="Map tool" value={tool} onChange={setTool} options={[{ value: 'select', label: 'Select' }, { value: 'block', label: 'Close walkways' }]} />
          <div className="row tight">
            <button className="btn ghost sm" disabled={!selectedEdge} onClick={() => selectedEdge && sim.toggleBlock(selectedEdge)}>{selectedEdge ? (sim.blocked[selectedEdge] ? `Reopen ${roadName(selectedEdge)}` : `Close ${roadName(selectedEdge)}`) : 'Select a walkway'}</button>
            <button className="btn ghost sm" disabled={!closed.length} onClick={() => sim.setBlockedMap({})}>Reopen {closed.length || ''} closed</button>
          </div>
          <span className="lbl" style={{ marginTop: 6 }}>Scenario (applies on reset)</span>
          <select value={sim.scenario} onChange={(e) => sim.setScenario(e.target.value)} aria-label="Scenario">
            {Object.entries(SCENARIOS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <span className="lbl">Map layers</span>
          <div className="row tight">
            {[['crowd', 'Crowd'], ['climate', 'Temperature'], ['lights', 'Lighting'], ['routes', 'Routes'], ['labels', 'Names']].map(([k, label]) => (
              <button key={k} className="btn ghost sm chipbtn" aria-pressed={layers[k]} onClick={() => toggle(k)}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Charts({ sim }) {
  const h = sim.history
  const t0 = h.length ? h[0].t : 0
  const x = (p) => (p.t - t0) / 60
  const xr = [0, Math.max(10, h.length ? x(h[h.length - 1]) : 10)]
  const promo = sim.promo.on ? 1 : 0
  const forecast = useMemo(() => h.map((p) => [x(p), crowdAll(Math.min(CLOSE, Math.max(OPEN, (p.t % 86400) / 3600)), (sim.startDay + Math.floor(p.t / 86400)) % 7, promo).combined]), [h.length, promo]) // eslint-disable-line react-hooks/exhaustive-deps
  const one = (pts) => (pts.length > 1 ? pts : [[0, 0], [1, 0]])
  const last = (k) => (h.length ? h[h.length - 1][k] : 0)
  return (
    <div className="charts">
      <div className="chart">
        <div className="field-top"><span className="lbl">Crowd index: actual vs AI forecast</span><span className="val">{Math.round(last('crowd'))}<small>/100</small></span></div>
        <div className="svgwrap"><LinePlot series={[{ pts: one(forecast), color: '#e8c46a', dash: '5 4', w: 2 }, { pts: one(h.map((p) => [x(p), p.crowd])), color: '#4fd1ff' }]} xRange={xr} yRange={[0, 100]} width={360} height={140} yTicks={2} xLabel="sim min" /></div>
        <div className="legend" style={{ marginTop: 6 }}><span><i style={{ background: '#4fd1ff' }} />actual</span><span><i style={{ background: '#e8c46a' }} />neuro-fuzzy forecast</span></div>
      </div>
      <div className="chart">
        <div className="field-top"><span className="lbl">Visitors inside</span><span className="val">{Math.round(last('inside'))}</span></div>
        <div className="svgwrap"><LinePlot series={[{ pts: one(h.map((p) => [x(p), p.inside])), color: '#35c98b' }]} xRange={xr} yRange={[0, Math.max(100, ...h.map((p) => p.inside))]} width={360} height={140} yTicks={2} xLabel="sim min" /></div>
      </div>
      <div className="chart">
        <div className="field-top"><span className="lbl">Average temperature</span><span className="val">{last('temp').toFixed(1)}<small>°C</small></span></div>
        <div className="svgwrap"><LinePlot series={[{ pts: one(h.map((p) => [x(p), p.temp])), color: '#ff7a59' }]} xRange={xr} yRange={[20, 32]} width={360} height={140} yTicks={3} xLabel="sim min" /></div>
      </div>
      <div className="chart">
        <div className="field-top"><span className="lbl">Power draw</span><span className="val">{last('power').toFixed(0)}<small> kW</small></span></div>
        <div className="svgwrap"><LinePlot series={[{ pts: one(h.map((p) => [x(p), p.power])), color: '#ffb02e' }]} xRange={xr} yRange={[0, 60]} width={360} height={140} yTicks={3} xLabel="sim min" /></div>
      </div>
    </div>
  )
}

const TYPE_LABEL = { system: 'System', incident: 'Incident', crowd: 'Crowd', promo: 'Promotion', ai: 'AI' }
export function EventFeed({ sim }) {
  return (
    <div className="panel eventfeed">
      <div className="panel-head"><h2>Event feed</h2><span className="tag">{sim.events.length} events</span></div>
      <ol>
        {sim.events.slice(0, 14).map((e) => (
          <li key={e.id} className={'ev ' + e.type}>
            <span className="num ev-t">{fmtClock(e.t)}</span>
            <span className="ev-k">{TYPE_LABEL[e.type] || e.type}</span>
            <span className="ev-x">{e.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export const zoneOptions = NODES.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)
export { Pill }
