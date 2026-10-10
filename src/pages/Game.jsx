import { useMemo, useState } from 'react'
import { STORES, COUNTERS, solveGame, rivalReply, rivalRound2, lineScore, counterIndex } from '../lib/game.js'
import { GateHead, Panel, Howto } from '../components/Ui.jsx'

const BASE = (s) => s.base * s.margin

export default function Game() {
  const g = useMemo(() => solveGame(), [])
  const [pick1, setPick1] = useState(null)
  const [reply1, setReply1] = useState(null)
  const [pick2, setPick2] = useState(null)

  const play1 = (i) => { setPick1(i); setReply1(rivalReply(i).line[0].text); setPick2(null) }
  const reset = () => { setPick1(null); setReply1(null); setPick2(null) }
  const c1 = reply1 ? counterIndex(reply1) : null
  const r2 = pick2 != null ? rivalRound2(pick1, c1, pick2) : null
  const total = r2 ? lineScore(pick1, c1, pick2, r2.i) : null
  const maxV = Math.max(...g.options.map((o) => o.value))

  return (
    <div className="page">
      <GateHead tech="Minimax" icon="store" title="Store selection game">
        The mall manager features one store at a time on the central banner. A rival shopping centre answers each move with the counter-offer that hurts most. Minimax finds the best opening.
      </GateHead>
      <div className="layout after">
        <div className="stack">
          <Panel title="Best opening move" tag="2 rounds, alpha-beta pruning">
            <table>
              <thead><tr><th>Feature first</th><th style={{ width: '40%' }}>Guaranteed payoff (minimax)</th><th>Expected line of play</th></tr></thead>
              <tbody>
                {g.options.map((o, i) => (
                  <tr key={o.store.id} className={i === 0 ? 'sel' : ''}>
                    <td><b>{o.store.name}</b>{i === 0 && <span className="pill blue" style={{ marginLeft: 8 }}>best</span>}</td>
                    <td>
                      <div className="row tight">
                        <div className="bar" style={{ flex: 1 }}><i style={{ width: `${(o.value / maxV) * 100}%` }} /></div>
                        <span className="num" style={{ minWidth: '4ch', textAlign: 'right', fontWeight: 800 }}>{o.value.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="note">{o.line.slice(1).map((l) => (l.who === 'MIN' ? 'rival: ' : 'you: ') + l.text).join(' → ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="metrics" style={{ marginTop: 14 }}>
              <div className="metric"><b>{g.fullNodes}</b><span>states without pruning</span></div>
              <div className="metric"><b>{g.prunedNodes}</b><span>states with alpha-beta</span></div>
              <div className="metric"><b>{Math.round((1 - g.prunedNodes / g.fullNodes) * 100)}%</b><span>search saved</span></div>
            </div>
          </Panel>

          <Panel title="Play a round yourself" tag="you are MAX">
            {pick1 == null ? (
              <>
                <p className="note" style={{ marginBottom: 10 }}>Round 1: which store do you feature?</p>
                <div className="row tight">{STORES.map((s, i) => <button key={s.id} className="btn ghost sm" onClick={() => play1(i)}>{s.name}</button>)}</div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: 8 }}>You featured <b>{STORES[pick1].name}</b>. The rival answered: <b>{reply1}</b>.</p>
                {pick2 == null ? (
                  <>
                    <p className="note" style={{ marginBottom: 10 }}>Round 2: feature another store (the same store earns half the second time).</p>
                    <div className="row tight">{STORES.map((s, i) => <button key={s.id} className="btn ghost sm" onClick={() => setPick2(i)}>{s.name}</button>)}</div>
                  </>
                ) : (
                  <p style={{ marginBottom: 8 }}>Round 2: you featured <b>{STORES[pick2].name}</b>. The rival's best answer is <b>{r2.name}</b>. Your total payoff is <b className="num">{total.toFixed(1)}</b>; the minimax line guarantees <b className="num">{g.best.value.toFixed(1)}</b>.</p>
                )}
                <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={reset}>Play again</button>
              </>
            )}
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Stores" tag="synthetic numbers">
            <table>
              <thead><tr><th>Store</th><th className="r">Footfall</th><th className="r">Margin</th><th className="r">Value</th></tr></thead>
              <tbody>{STORES.map((s) => <tr key={s.id}><td>{s.name}</td><td className="r num">{s.base}</td><td className="r num">{s.margin}</td><td className="r num">{BASE(s).toFixed(1)}</td></tr>)}</tbody>
            </table>
          </Panel>
          <Panel title="Rival counter-offers">
            <table>
              <thead><tr><th>Offer</th><th className="r">Biggest hit</th></tr></thead>
              <tbody>
                {COUNTERS.map((c) => {
                  const top = Object.entries(c.hit).sort((a, b) => b[1] - a[1])[0]
                  return <tr key={c.id}><td>{c.name}</td><td className="r num">{STORES.find((s) => s.id === top[0]).name.split(' ')[0]} −{Math.round(top[1] * 100)}%</td></tr>
                })}
              </tbody>
            </table>
          </Panel>
          <Howto>
            <p>Two players take turns. <strong>MAX</strong> (the mall) wants the highest payoff; <strong>MIN</strong> (the rival) wants the lowest. Minimax assumes the rival always replies as well as it can, and picks the move that holds up best.</p>
            <p>The tree is 5 stores × 4 counter-offers per round, over 2 rounds. A counter-offer also keeps working at half strength in round 2, so the order matters.</p>
            <p><strong>Alpha-beta pruning</strong> skips branches that cannot change the answer. The result is the same with fewer states.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
