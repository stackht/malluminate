import { useMemo, useState } from 'react'
import { useMall } from '../state.jsx'
import { loadProgram } from '../lib/prolog.js'
import { mallKb } from '../lib/mallkb.js'
import { GateHead, Panel, Howto } from '../components/Ui.jsx'
import Icon from '../components/Icon.jsx'

const PRESETS = [
  { q: 'connected(entrance, X).', why: 'Which sections are directly connected to the entrance? (a fact lookup)' },
  { q: 'link(atrium, X).', why: 'Uses a rule: walkways work in both directions.' },
  { q: 'shortest_path(entrance, clothing, P).', why: 'Breadth-first search written as Prolog rules.' },
  { q: 'path(entrance, clothing, P).', why: 'Depth-first search written as Prolog rules. Compare the length.' },
  { q: 'suggest(chen, Store, Route).', why: 'Combine a preference fact with a route rule.' },
  { q: 'hops(entrance, kids, N).', why: 'Rules plus arithmetic with is/2.' },
  { q: 'crowd_level(72, Level).', why: 'Classify a crowd percentage: rules with comparisons.' },
  { q: 'discounted(80, 25, Final).', why: 'Arithmetic: a 25% discount on 80.' },
  { q: 'findall(S, section(S, store), L).', why: 'Collect every answer into a list.' },
  { q: 'reachable(parking, shoes).', why: 'Yes/no question (true or false).' },
]

export default function Prolog() {
  const { blocked } = useMall()
  const [src, setSrc] = useState(() => mallKb(blocked))
  const [query, setQuery] = useState(PRESETS[2].q)
  const [ran, setRan] = useState(null)

  const compiled = useMemo(() => {
    try {
      return { prog: loadProgram(src) }
    } catch (e) {
      return { error: e.message }
    }
  }, [src])

  const run = (q = query) => {
    if (compiled.error) { setRan({ ok: false, error: `Program error: ${compiled.error}`, solutions: [], vars: [] }); return }
    setRan({ q, ...compiled.prog.query(q, 12) })
  }
  const loadLive = () => setSrc(mallKb(blocked))
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([src], { type: 'text/plain' }))
    a.download = 'mall.pl'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page">
      <GateHead tech="Prolog" icon="rules" title="Prolog lab">
        Learn the basics of Prolog by writing and running small AI programs about the mall: facts say what is true, rules say what follows, and queries ask questions.
      </GateHead>
      <div className="layout after">
        <div className="stack">
          <Panel title="Program" tag="facts and rules · editable">
            <textarea className="code prolog-src" rows={18} spellCheck={false} value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Prolog program" />
            {compiled.error && <p style={{ color: 'var(--high)', marginTop: 8 }}>Syntax error: {compiled.error}</p>}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn ghost sm" onClick={loadLive}>Load from live mall (closed walkways removed)</button>
              <button className="btn ghost sm" onClick={() => setSrc(mallKb({}))}>Reset program</button>
              <a className="btn ghost sm" href="./mall.pl" download="mall.pl"><Icon name="download" size={14} />Download mall.pl</a>
              <button className="btn ghost sm" onClick={download}><Icon name="download" size={14} />Download this version</button>
            </div>
          </Panel>

          <Panel title="Query" tag="?-">
            <div className="row" style={{ alignItems: 'stretch' }}>
              <input type="text" className="mono" style={{ flex: 1, minWidth: 220 }} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} aria-label="Prolog query" spellCheck={false} />
              <button className="btn" onClick={() => run()}><Icon name="play" size={16} />Run</button>
            </div>
            <div className="trace" style={{ marginTop: 12, minHeight: 90 }} aria-live="polite">
              {!ran && <div className="try">Press Run, or choose an example.</div>}
              {ran && <div className="call">?- {ran.q ?? query}</div>}
              {ran && !ran.ok && <div className="fail">{ran.error}</div>}
              {ran && ran.ok && ran.output && <div className="try">{ran.output}</div>}
              {ran && ran.ok && ran.solutions.length === 0 && <div className="fail">false.</div>}
              {ran && ran.ok && ran.solutions.length > 0 && ran.vars.length === 0 && <div className="exit">true.</div>}
              {ran && ran.ok && ran.vars.length > 0 && ran.solutions.map((s, i) => (
                <div key={i} className="exit">{ran.vars.map((v) => `${v} = ${s[v]}`).join(',  ')}{i < ran.solutions.length - 1 || ran.truncated ? ' ;' : ' .'}</div>
              ))}
              {ran && ran.ok && <div className="try">{ran.steps} inferences{ran.truncated ? ', first 12 answers shown' : ''}</div>}
            </div>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Examples" tag="click to run">
            <ul className="presets">
              {PRESETS.map((p) => (
                <li key={p.q}>
                  <button onClick={() => { setQuery(p.q); run(p.q) }}>
                    <span className="mono">{p.q}</span>
                    <span className="note">{p.why}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Howto>
            <p><strong>Fact</strong>: <span className="mono">connected(entrance, atrium).</span> A statement that is true.</p>
            <p><strong>Rule</strong>: <span className="mono">link(A, B) :- connected(B, A).</span> Read it as “A is linked to B if B is connected to A”.</p>
            <p><strong>Query</strong>: <span className="mono">?- link(atrium, X).</span> Prolog searches for values of the variable X (capital letter) that make it true, and <strong>backtracks</strong> to find more.</p>
            <p>Rules can call themselves, so <span className="mono">walk/4</span> searches the mall recursively. <span className="mono">\+</span> means “not provable”.</p>
            <p>This page runs a small Prolog interpreter written for this project: facts, rules, lists, arithmetic, <span className="mono">findall/3</span>, <span className="mono">\+</span>. It has no cut (<span className="mono">!</span>) and no assert, so it is not SWI-Prolog. The same program works in SWI-Prolog: <span className="mono">swipl -s mall.pl</span>.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
