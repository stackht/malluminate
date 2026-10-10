import { useMemo, useState } from 'react'
import { useSim } from '../state.jsx'
import { search } from '../lib/search.js'
import { TopBar, Kpis, Controls, Charts, EventFeed } from './parts.jsx'
import MallMap from './MallMap.jsx'
import Decision from './Decision.jsx'

export default function Dashboard() {
  const sim = useSim()
  const [tool, setTool] = useState('select')
  const [layers, setLayers] = useState({ crowd: true, climate: false, lights: false, routes: true, labels: true })
  const [zone, setZone] = useState('atrium')
  const [edge, setEdge] = useState(null)
  const [from, setFrom] = useState('entrance')
  const [to, setTo] = useState('clothing')
  const [algo, setAlgo] = useState('bfs')

  // All three algorithms on the live crowd and closures, refreshed about once a simulated minute.
  const results = useMemo(
    () => Object.fromEntries(['bfs', 'dfs', 'astar'].map((a) => [a, search(a, from, to, sim.crowd, sim.blocked)])),
    [from, to, Math.floor(sim.time / 30), Object.keys(sim.blocked).join()] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const r = results[algo]

  const onEdge = (id) => {
    setEdge(id)
    if (tool === 'block') sim.toggleBlock(id)
  }

  return (
    <div className="dash">
      <TopBar sim={sim} />
      <Kpis sim={sim} />
      <div className="dash-main">
        <div className="dash-center">
          <MallMap engine={sim} tool={tool} layers={layers} selectedZone={zone} selectedEdge={edge} route={r.found ? r.path : null} onZone={setZone} onEdge={onEdge} />
          <Controls sim={sim} tool={tool} setTool={setTool} layers={layers} setLayers={setLayers} selectedEdge={edge} />
        </div>
        <div className="dash-right">
          <Decision sim={sim} zone={zone} setZone={setZone} plan={{ from, to, algo, setFrom, setTo, setAlgo, results }} />
        </div>
      </div>
      <div className="dash-lower">
        <Charts sim={sim} />
        <EventFeed sim={sim} />
      </div>
    </div>
  )
}
