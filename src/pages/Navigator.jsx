import { useEffect, useMemo, useState } from 'react'
import { useMall } from '../state.jsx'
import { NODES, NODE } from '../lib/mall.js'
import { ALGOS, search, walkMinutes } from '../lib/search.js'
import MiniMall from '../components/MiniMall.jsx'
import Icon from '../components/Icon.jsx'
import usePlayer from '../components/usePlayer.js'
import { GateHead, Panel, Howto, Seg, nodeSelect } from '../components/Ui.jsx'

export default function Navigator() {
  const { crowd, blocked, engine } = useMall()
  const [from, setFrom] = useState('entrance')
  const [to, setTo] = useState('clothing')
  const [algo, setAlgo] = useState('bfs')

  const results = useMemo(() => Object.fromEntries(Object.keys(ALGOS).map((a) => [a, search(a, from, to, crowd, blocked)])), [from, to, crowd, blocked])
  const r = results[algo]
  const player = usePlayer(r.steps.length - 1, 600)
  useEffect(() => player.finish(), [algo, from, to, blocked]) // eslint-disable-line react-hooks/exhaustive-deps
  const step = r.steps[player.idx] || r.steps[0] || { explored: [], frontier: [], current: null }
  const done = player.idx >= r.steps.length - 1
  const order = Object.fromEntries(step.explored.map((id, i) => [id, i + 1]))

  return (
    <div className="page">
      <GateHead tech="BFS and DFS" icon="route" title="Mall navigator">
        A customer enters through the Main Entrance and wants to reach the Clothing Store. Breadth-first and depth-first search find a path through the walkways. Click a walkway to close it.
      </GateHead>
      <div className="layout">
        <div className="stack">
          <Panel title="Mall walkways" tag="synthetic mall">
            <div className="row" style={{ marginBottom: 14 }}>
              <div style={{ minWidth: 200, flex: 1 }}>{nodeSelect(NODES, from, setFrom, 'Start (customer is here)')}</div>
              <div style={{ minWidth: 200, flex: 1 }}>{nodeSelect(NODES, to, setTo, 'Goal (customer wants to reach)')}</div>
            </div>
            <MiniMall crowd={crowd} blocked={blocked} explored={step.explored} frontier={step.frontier} current={step.current} pathEdges={done && r.found ? r.pathEdges : []} start={from} goal={to} order={order} onEdge={(id) => engine.toggleBlock(id)} onNode={setTo} />
            <div className="legend" style={{ marginTop: 12 }}>
              <span><i style={{ boxShadow: 'inset 0 0 0 3px #5ab2ff', background: '#0c0f16' }} />explored (number = order)</span>
              <span><i style={{ boxShadow: 'inset 0 0 0 2px #e8c46a' }} />waiting in the frontier</span>
              <span><i style={{ background: '#e8c46a' }} />chosen path</span>
              <span className="note">Click a section to set the goal.</span>
            </div>
          </Panel>
          <Panel title="Search">
            <div className="row" style={{ marginBottom: 12 }}>
              <Seg label="Algorithm" value={algo} onChange={setAlgo} options={Object.entries(ALGOS).map(([value, a]) => ({ value, label: a.label.split(' (')[0] }))} />
            </div>
            <p className="note" style={{ marginBottom: 14 }}>{ALGOS[algo].blurb}</p>
            <div className="row">
              {player.playing ? <button className="btn" onClick={player.pause}><Icon name="pause" size={16} />Pause</button> : <button className="btn" onClick={player.play}><Icon name="play" size={16} />Play</button>}
              <button className="btn ghost" onClick={player.step} disabled={done}><Icon name="step" size={16} />Step</button>
              <button className="btn ghost" onClick={player.finish}>Skip to end</button>
              <button className="btn ghost" onClick={player.reset}><Icon name="reset" size={16} />Reset</button>
              <span className="note num">Expansion {player.idx + 1} of {r.steps.length}</span>
            </div>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Result" tag={ALGOS[algo].label.split(' (')[0]}>
            {r.found ? (
              <>
                <div className="metrics" style={{ marginBottom: 12 }}>
                  <div className="metric"><b>{r.pathEdges.length}</b><span>walkways</span></div>
                  <div className="metric"><b>{walkMinutes(r.meters).toFixed(1)}</b><span>minutes on foot</span></div>
                  <div className="metric"><b>{r.expanded}</b><span>sections expanded</span></div>
                </div>
                <p className="note">{r.path.map((id) => NODE[id].name).join(' → ')}</p>
              </>
            ) : (
              <div className="empty">No open route between these sections.</div>
            )}
          </Panel>
          <Panel title="BFS vs DFS vs A*, same trip">
            <table>
              <thead><tr><th>Algorithm</th><th className="r">Walkways</th><th className="r">Minutes</th><th className="r">Expanded</th></tr></thead>
              <tbody>
                {Object.entries(results).map(([k, x]) => (
                  <tr key={k} className={k === algo ? 'sel' : ''}>
                    <td>{ALGOS[k].label.split(' (')[0]}</td>
                    <td className="r num">{x.found ? x.pathEdges.length : '-'}</td>
                    <td className="r num">{x.found ? walkMinutes(x.meters).toFixed(1) : '-'}</td>
                    <td className="r num">{x.expanded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note" style={{ marginTop: 8 }}>BFS always finds the path with the fewest walkways. DFS finds some path quickly but it can wander a long way around.</p>
          </Panel>
          <Howto>
            <p>Each section is a <strong>state</strong>, each walkway an <strong>action</strong>. Search keeps a <strong>frontier</strong> of sections still to visit.</p>
            <p><strong>BFS</strong> takes the oldest section from the frontier (a queue), so it explores the mall in rings around the start. <strong>DFS</strong> takes the newest (a stack), so it follows one branch to the end before backing up.</p>
            <p>Close a walkway on the map and rerun: both algorithms treat it as unavailable.</p>
          </Howto>
        </div>
      </div>
    </div>
  )
}
