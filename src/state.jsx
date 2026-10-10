import { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react'
import { engine } from './sim/engine.js'
import { fmtClock } from './sim/format.js'

const SnapCtx = createContext(null)

// Subscribe a component to every simulation update (used by the live dashboard).
export function useSim() {
  useSyncExternalStore(engine.subscribe, engine.getVersion)
  return engine
}

const staticKey = () => JSON.stringify([engine.blocked, engine.promo, engine.mode, engine.override])

// What the module pages see: the mall as it was when the page opened (stable for animations),
// with live walkway closures, promotion and control mode.
export function useMall() {
  const snap = useContext(SnapCtx)
  const key = useSyncExternalStore(engine.subscribe, snap ? staticKey : engine.getVersion)
  return useMemo(() => {
    const s = snap || { crowd: { ...engine.crowd }, zones: JSON.parse(JSON.stringify(engine.zones)), time: engine.time, metrics: { ...engine.metrics } }
    return {
      engine,
      crowd: s.crowd,
      zones: s.zones,
      time: s.time,
      metrics: s.metrics,
      hour: (s.time % 86400) / 3600,
      day: (engine.startDay + Math.floor(s.time / 86400)) % 7,
      blocked: { ...engine.blocked },
      promo: { ...engine.promo },
      mode: engine.mode,
    }
  }, [snap, key]) // eslint-disable-line react-hooks/exhaustive-deps
}

// Wraps a module page: freezes the crowd and zone readings it sees and offers a refresh.
export function PageSnapshot({ children }) {
  const take = () => ({ crowd: { ...engine.crowd }, zones: JSON.parse(JSON.stringify(engine.zones)), time: engine.time, metrics: { ...engine.metrics } })
  const [snap, setSnap] = useState(take)
  return (
    <SnapCtx.Provider value={snap}>
      <div className="snapbar">
        <span>Showing the mall as of simulation time <b className="num">{fmtClock(snap.time)}</b>. Readings are frozen while you work here; walkway closures, promotion and control mode are live.</span>
        <button className="btn ghost sm" onClick={() => setSnap(take())}>Update from live simulation</button>
      </div>
      {children}
    </SnapCtx.Provider>
  )
}
