import { useMemo, useState } from 'react'
import { NODES, NODE, levelOf } from '../lib/mall.js'
import { ALGOS, walkMinutes } from '../lib/search.js'
import { infer } from '../lib/fuzzy.js'
import { AC_SYSTEM } from '../lib/systems.js'
import { lightingBoth } from '../lib/lighting.js'
import { crowdAll, classifyCustomer, groupOfCustomer, groupInfo, languageModels } from '../lib/models.js'
import { crowdLevel, DAYS } from '../lib/crowd.js'
import { CATEGORIES } from '../lib/customers.js'
import { generate } from '../lib/ngram.js'
import { solveGame } from '../lib/game.js'
import { loadProgram } from '../lib/prolog.js'
import { mallKb } from '../lib/mallkb.js'
import { daylight } from '../sim/engine.js'
import { fmtClock } from '../sim/format.js'
import { Pill, Slider, Seg } from '../components/Ui.jsx'
import { ARCH_COLORS } from './MallMap.jsx'

function Sec({ title, ps, open, children }) {
  return (
    <details className="dsec" open={open}>
      <summary><span>{title}</span><small className="ps-note">{ps}</small></summary>
      <div className="dsec-body">{children}</div>
    </details>
  )
}
const nodeOptions = NODES.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)

// ---------- PS 1, 3, 4: navigation ----------
function NavSection({ plan }) {
  const { from, to, algo, setFrom, setTo, setAlgo, results } = plan
  const r = results[algo]
  return (
    <>
      <div className="row">
        <div className="field" style={{ flex: 1, minWidth: 130 }}><label>From</label><select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From">{nodeOptions}</select></div>
        <div className="field" style={{ flex: 1, minWidth: 130 }}><label>To</label><select value={to} onChange={(e) => setTo(e.target.value)} aria-label="To">{nodeOptions}</select></div>
      </div>
      <div className="field" style={{ margin: '8px 0' }}>
        <label>Route drawn on the map</label>
        <select value={algo} onChange={(e) => setAlgo(e.target.value)} aria-label="Search algorithm">{Object.entries(ALGOS).map(([k, a]) => <option key={k} value={k}>{a.label}</option>)}</select>
      </div>
      <table>
        <thead><tr><th>Algorithm</th><th className="r">Walkways</th><th className="r">Walk</th><th className="r">Expanded</th></tr></thead>
        <tbody>
          {Object.entries(results).map(([k, x]) => (
            <tr key={k} className={k === algo ? 'sel' : ''}>
              <td>{ALGOS[k].label.split(' (')[0]}</td>
              <td className="r num">{x.found ? x.pathEdges.length : '-'}</td>
              <td className="r num">{x.found ? `${walkMinutes(x.meters).toFixed(1)} min` : '-'}</td>
              <td className="r num">{x.expanded}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note" style={{ marginTop: 8 }}>{r.found ? r.path.map((id) => NODE[id].short).join(' → ') + '. Closed walkways are skipped; A* also avoids crowded ones.' : 'No open route between these sections.'}</p>
    </>
  )
}

// ---------- PS 6: climate ----------
function ClimateSection({ sim, zone, setZone }) {
  const z = sim.zones[zone]
  const fz = useMemo(() => infer(AC_SYSTEM, { temperature: z.temp, crowd: z.pct }), [Math.round(z.temp * 4), Math.round(z.pct / 3)]) // eslint-disable-line react-hooks/exhaustive-deps
  const ov = sim.override[zone]
  const top = fz.fired.filter((r) => r.strength > 0.05).sort((a, b) => b.strength - a.strength).slice(0, 3)
  return (
    <>
      <div className="field"><label>Section</label><select value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Section">{nodeOptions}</select></div>
      <table style={{ marginTop: 8 }}>
        <tbody>
          <tr><td>Temperature</td><td className="r num">{z.temp.toFixed(1)} °C</td></tr>
          <tr><td>Crowd</td><td className="r num"><Pill level={levelOf(z.pct)}>{Math.round(z.pct)}%</Pill></td></tr>
          <tr><td>Fuzzy controller says</td><td className="r num"><b>{fz.crisp.toFixed(0)}% cooling</b></td></tr>
          <tr className="sel"><td>Applied ({sim.mode}{ov?.ac != null ? ', manual' : ''})</td><td className="r num"><b>{Math.round(z.ac)}% cooling</b></td></tr>
        </tbody>
      </table>
      {top.length > 0 && <ul className="rules">{top.map((r, i) => <li key={i}><span>temp {r.if.temperature} and crowd {r.if.crowd} → {r.then}</span><span className="num">{r.strength.toFixed(2)}</span></li>)}</ul>}
      <Slider label="Manual cooling override" value={ov?.ac ?? Math.round(z.ac)} min={0} max={100} unit="%" onChange={(v) => sim.setOverride(zone, { ac: v })} />
      <button className="btn ghost sm" disabled={ov?.ac == null} onClick={() => sim.setOverride(zone, { ac: null })}>Back to automatic</button>
    </>
  )
}

// ---------- PS 7: lighting ----------
function LightSection({ sim, zone }) {
  const z = sim.zones[zone]
  const activity = Math.min(100, z.pct * 1.2)
  const both = useMemo(() => lightingBoth(z.ambient, activity), [z.ambient, Math.round(activity / 3)]) // eslint-disable-line react-hooks/exhaustive-deps
  const ov = sim.override[zone]
  const mean = Object.values(sim.zones).reduce((s, q) => s + q.light, 0) / NODES.length
  return (
    <>
      <p className="note" style={{ marginBottom: 6 }}>Selected section: <b>{NODE[zone].name}</b> (choose it on the map or under Climate).</p>
      <table>
        <tbody>
          <tr><td>Ambient (daylight) light</td><td className="r num">{z.ambient}%</td></tr>
          <tr><td>Customer activity</td><td className="r num">{Math.round(activity)}%</td></tr>
          <tr><td>Mamdani FIS (centroid)</td><td className="r num"><b>{both.mamdani.toFixed(1)}%</b></td></tr>
          <tr><td>Sugeno FIS (weighted average)</td><td className="r num"><b>{both.sugeno.toFixed(1)}%</b></td></tr>
          <tr><td>Difference</td><td className="r num">{both.diff >= 0 ? '+' : ''}{both.diff.toFixed(1)} points</td></tr>
          <tr className="sel"><td>Applied ({sim.mode}{sim.mode === 'ai' ? `, ${sim.lightModel}` : ''}{ov?.light != null ? ', manual' : ''})</td><td className="r num"><b>{Math.round(z.light)}%</b></td></tr>
        </tbody>
      </table>
      <p className="note" style={{ margin: '8px 0' }}>Whole mall: lights at {Math.round(mean)}% on average, daylight {Math.round(100 * daylight(sim.hour()))}% outside. Turn on the Lighting layer to see the glow.</p>
      <p className="lbl" style={{ marginBottom: 6 }}>Lighting FIS used in AI mode</p>
      <Seg label="Lighting FIS" value={sim.lightModel} onChange={(m) => sim.setLightModel(m)} options={[{ value: 'mamdani', label: 'Mamdani' }, { value: 'sugeno', label: 'Sugeno' }]} />
      <Slider label="Manual brightness override" value={ov?.light ?? Math.round(z.light)} min={0} max={100} unit="%" onChange={(v) => sim.setOverride(zone, { light: v })} />
      <button className="btn ghost sm" disabled={ov?.light == null} onClick={() => sim.setOverride(zone, { light: null })}>Back to automatic</button>
    </>
  )
}

// ---------- PS 8: crowd forecast ----------
function CrowdSection({ sim }) {
  const hour = Math.min(21.9, Math.max(9, sim.hour()))
  const day = sim.day()
  const promo = sim.promo.on ? 1 : 0
  const now = useMemo(() => crowdAll(hour, day, promo), [Math.round(hour * 4), day, promo]) // eslint-disable-line react-hooks/exhaustive-deps
  const ahead = useMemo(() => [1, 2, 3].map((d) => ({ h: hour + d, v: crowdAll(Math.min(21.9, hour + d), day, promo).combined })), [Math.round(hour * 4), day, promo]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <p className="note" style={{ marginBottom: 6 }}>{DAYS[day]}, {String(Math.floor(hour)).padStart(2, '0')}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}, promotion {promo ? 'running' : 'off'}.</p>
      <table>
        <thead><tr><th>Model</th><th className="r">Crowd index</th></tr></thead>
        <tbody>
          <tr><td>Fuzzy rules only</td><td className="r num">{now.fuzzy.toFixed(0)}</td></tr>
          <tr><td>Neural network only</td><td className="r num">{now.neural.toFixed(0)}</td></tr>
          <tr className="sel"><td><b>Neuro-fuzzy (combined)</b></td><td className="r num"><b>{now.combined.toFixed(0)}</b> <Pill level={crowdLevel(now.combined)} /></td></tr>
        </tbody>
      </table>
      <p className="lbl" style={{ margin: '10px 0 4px' }}>Forecast for the next hours</p>
      <div className="row tight">
        {ahead.map((a) => <span key={a.h} className="tag">{String(Math.floor(a.h)).padStart(2, '0')}:00 · {a.v.toFixed(0)} · {crowdLevel(a.v)}</span>)}
      </div>
      <p className="note" style={{ marginTop: 8 }}>Trained on synthetic data, not on real footfall counts.</p>
    </>
  )
}

// ---------- PS 9: customers ----------
function CustomerSection({ sim }) {
  const stats = useMemo(() => {
    const cat = [0, 0, 0].map(() => [0, 0, 0]) // actual x predicted
    const groups = [0, 0, 0, 0]
    for (const a of sim.agents) {
      cat[a.rec.category][classifyCustomer(a.rec)]++
      groups[groupOfCustomer(a.rec)]++
    }
    return { cat, groups }
  }, [sim.version]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = stats.cat.flat().reduce((a, b) => a + b, 0)
  const right = stats.cat.reduce((s, row, i) => s + row[i], 0)
  const info = groupInfo()
  return (
    <>
      <table>
        <thead><tr><th>Perceptron category</th>{CATEGORIES.map((c) => <th key={c} className="r">{c}</th>)}</tr></thead>
        <tbody>
          {CATEGORIES.map((c, i) => <tr key={c}><td>Actually {c}</td>{stats.cat[i].map((v, j) => <td key={j} className="r num" style={i === j ? { color: 'var(--blue)', fontWeight: 800 } : undefined}>{v}</td>)}</tr>)}
        </tbody>
      </table>
      <p className="note" style={{ margin: '6px 0 10px' }}>Correct for {total ? Math.round((100 * right) / total) : 0}% of the {total} customers inside.</p>
      <p className="lbl">Groups found by competitive learning (no labels)</p>
      <ul className="rules" style={{ marginTop: 6 }}>
        {info.map((g, i) => <li key={i}><span>{g.name} · ${g.spend}, {g.dwell} min</span><span className="num">{stats.groups[i]} inside</span></li>)}
      </ul>
    </>
  )
}

// ---------- PS 10: assistant ----------
function AssistantSection({ sim }) {
  const ctx = (() => {
    const busiest = [...NODES].sort((a, b) => sim.zones[b.id].pct - sim.zones[a.id].pct)[0]
    if (Object.keys(sim.blocked).length) return 'the walkway'
    if (sim.promo.on) return 'flash sale'
    if (sim.metrics.crowd >= 65 || sim.zones[busiest.id].pct >= 80) return 'heavy crowd'
    if (sim.metrics.crowd >= 35) return 'the food court'
    return 'welcome to the mall'
  })()
  const seed = Math.floor(sim.time / 60)
  const a = useMemo(() => {
    const { bi, tri } = languageModels()
    return { bi: generate(bi, ctx, { temperature: 0.6, seed, maxWords: 14 }).text, tri: generate(tri, ctx, { temperature: 0.6, seed, maxWords: 16 }).text }
  }, [ctx, Math.floor(seed / 5)]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <p className="note">Seed chosen from the simulation: “{ctx}”.</p>
      <p className="lbl" style={{ marginTop: 8 }}>Bigram micro model (1 word of context)</p>
      <p className="alertline" style={{ fontSize: '1.2rem' }}>{a.bi}</p>
      <p className="lbl" style={{ marginTop: 8 }}>Trigram small model (2 words of context)</p>
      <p className="alertline" style={{ fontSize: '1.2rem' }}>{a.tri}</p>
      <p className="note" style={{ marginTop: 6 }}>Sampled from a small predefined mall corpus. It is not live external intelligence and may not match the exact situation.</p>
    </>
  )
}

// ---------- PS 5: store game ----------
function GameSection() {
  const g = useMemo(() => solveGame(), [])
  return (
    <>
      <p>Over two rounds the mall features a store while a rival answers. Minimax says the best opening feature is <b>{g.best.store.name}</b> (expected payoff <b className="num">{g.best.value.toFixed(1)}</b>).</p>
      <p className="note" style={{ margin: '6px 0 8px' }}>Line of play: {g.best.line.map((l) => l.text).join(' → ')}. Alpha-beta searched {g.prunedNodes} of {g.fullNodes} states. A separate game simulation, independent of the live mall.</p>
      <a className="btn ghost sm" href="#/game">Open the store game</a>
    </>
  )
}

// ---------- PS 2: Prolog on the live mall ----------
function PrologSection({ sim, plan }) {
  const [open, setOpen] = useState(false)
  const closedKey = Object.keys(sim.blocked).sort().join(',')
  const out = useMemo(() => {
    const p = loadProgram(mallKb(sim.blocked))
    const sp = p.query(`shortest_path(${plan.from}, ${plan.to}, P).`, 1)
    const dfs = p.query(`path(${plan.from}, ${plan.to}, P).`, 1)
    return { sp, dfs }
  }, [closedKey, plan.from, plan.to]) // eslint-disable-line react-hooks/exhaustive-deps
  const fmt = (r) => (r.ok ? (r.solutions.length ? r.solutions[0].P : 'false (no route)') : r.error)
  return (
    <>
      <p className="note">The mall's walkways are written as Prolog facts. Closed walkways are removed from the facts, then these goals run in the in-browser Prolog interpreter:</p>
      <div className="trace" style={{ margin: '8px 0' }}>
        <div className="call">?- shortest_path({plan.from}, {plan.to}, P).</div>
        <div className="exit">P = {fmt(out.sp)}</div>
        <div className="call" style={{ marginTop: 6 }}>?- path({plan.from}, {plan.to}, P).</div>
        <div className="exit">P = {fmt(out.dfs)}</div>
      </div>
      <p className="note">Breadth-first (shortest_path) vs depth-first (path) written as rules, {out.sp.steps} and {out.dfs.steps} inferences. Change From and To in the Navigation section above.</p>
      <div className="row tight" style={{ marginTop: 8 }}>
        <a className="btn ghost sm" href="#/prolog">Open the Prolog lab</a>
        <button className="btn ghost sm" onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'} knowledge base</button>
      </div>
      {open && <div className="code" style={{ marginTop: 8, maxHeight: 220 }}>{mallKb(sim.blocked)}</div>}
      <p className="note" style={{ marginTop: 8 }}>This is a small Prolog interpreter written for this project (no cut, no assert), not SWI-Prolog. The same facts ship as <code>prolog/mall.pl</code> for SWI-Prolog.</p>
    </>
  )
}

export default function Decision({ sim, zone, setZone, plan }) {
  return (
    <aside className="decision-panel" aria-label="AI decisions">
      <div className="dp-head"><h2>AI decisions</h2><span className="tag">live</span></div>
      <Sec title="Navigation" ps="PS 1 · 3 · 4" open><NavSection plan={plan} /></Sec>
      <Sec title="Climate control" ps="PS 6" open><ClimateSection sim={sim} zone={zone} setZone={setZone} /></Sec>
      <Sec title="Smart lighting: Mamdani vs Sugeno" ps="PS 7"><LightSection sim={sim} zone={zone} /></Sec>
      <Sec title="Crowd forecast" ps="PS 8"><CrowdSection sim={sim} /></Sec>
      <Sec title="Customers" ps="PS 9"><CustomerSection sim={sim} /></Sec>
      <Sec title="Mall assistant" ps="PS 10"><AssistantSection sim={sim} /></Sec>
      <Sec title="Prolog reasoning" ps="PS 2"><PrologSection sim={sim} plan={plan} /></Sec>
      <Sec title="Store game" ps="PS 5"><GameSection /></Sec>
    </aside>
  )
}
export { fmtClock, ARCH_COLORS }
