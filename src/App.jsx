import { useEffect, useRef, useState } from 'react'
import { PageSnapshot } from './state.jsx'
import { APP_NAME, APP_TAGLINE } from './config.js'
import { FEATURES, featureOf } from './modules.js'
import Dashboard from './dashboard/Dashboard.jsx'
import Prolog from './pages/Prolog.jsx'
import Navigator from './pages/Navigator.jsx'
import Robot from './pages/Robot.jsx'
import Game from './pages/Game.jsx'
import Climate from './pages/Climate.jsx'
import Lighting from './pages/Lighting.jsx'
import Crowd from './pages/Crowd.jsx'
import Customers from './pages/Customers.jsx'
import Assistant from './pages/Assistant.jsx'
import About from './pages/About.jsx'

const PAGES = { prolog: Prolog, navigator: Navigator, robot: Robot, game: Game, climate: Climate, lighting: Lighting, crowd: Crowd, customers: Customers, assistant: Assistant, about: About }

const INDEX = [
  { id: 'home', ps: 'PS 1', title: 'Command centre', d: 'The whole mall, live: customers, crowd, climate, lighting and every AI decision.' },
  ...FEATURES.map((f) => ({ id: f.id, ps: `PS ${f.ps.join(' · ')}`, title: f.label, d: f.does })),
  { id: 'about', ps: 'Notes', title: 'About this project', d: 'What is simulated, and how the ten problem statements map to the system.' },
]

const fromHash = () => {
  const h = window.location.hash.replace('#/', '').replace('#', '')
  return h in PAGES ? h : 'home'
}

function IndexOverlay({ page, go, close }) {
  const first = useRef(null)
  useEffect(() => {
    first.current?.focus()
    const k = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [close])
  return (
    <div className="index" role="dialog" aria-modal="true" aria-label="Index of features">
      <div className="index-in">
        <div className="index-top">
          <span className="wordmark"><b>{APP_NAME}</b></span>
          <button className="btn ghost sm" onClick={close}>Close</button>
        </div>
        <h2 className="index-lede">One mall, ten ways to understand it.</h2>
        <ol>
          {INDEX.map((it, i) => (
            <li key={it.id}>
              <button ref={i === 0 ? first : undefined} aria-current={page === it.id ? 'page' : undefined} onClick={() => { go(it.id); close() }}>
                <span className="ix-ps">{it.ps}</span>
                <span className="ix-t">{it.title}<span className="ix-d">{it.d}</span></span>
                <span className="ix-go" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState(fromHash)
  const [howto, setHowto] = useState(false)
  const [index, setIndex] = useState(false)

  useEffect(() => {
    const on = () => {
      setPage(fromHash())
      setHowto(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // "How it works" lives in a side drawer; Esc closes it.
  useEffect(() => {
    document.body.classList.toggle('howto-open', howto)
    if (!howto) return undefined
    const k = (e) => e.key === 'Escape' && setHowto(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [howto])

  const go = (id) => {
    window.location.hash = id === 'home' ? '#/' : `#/${id}`
  }

  const feature = featureOf(page)
  const name = feature?.label ?? (page === 'about' ? 'About' : 'Command centre')
  useEffect(() => {
    document.title = page === 'home' ? `${APP_NAME}: command centre` : `${name} · ${APP_NAME}`
  }, [page, name])

  const Page = PAGES[page]
  const hasHowto = page !== 'home' && page !== 'about'

  return (
    <>
      <header className="mast">
        <div className="mast-in">
          <button className="wordmark" onClick={() => go('home')} aria-label={`${APP_NAME}: command centre`}>
            <b>{APP_NAME}</b>
            <small>{APP_TAGLINE}</small>
          </button>
          <div className="mast-where" aria-live="polite">
            <b>{name}</b>
            {feature && <span>PS {feature.ps.join(' · ')}</span>}
            {page === 'home' && <span>PS 1 · the whole system</span>}
          </div>
          <div className="mast-actions">
            {page !== 'home' && <button className="btn ghost sm" onClick={() => go('home')}>Dashboard</button>}
            <button className="btn sm" onClick={() => setIndex(true)}>Index</button>
          </div>
        </div>
      </header>

      <main key={page}>
        {page === 'home' ? <Dashboard /> : page === 'about' ? <About /> : <PageSnapshot><Page /></PageSnapshot>}
      </main>

      {hasHowto && (
        <>
          <button className="howto-toggle btn ghost" style={{ background: '#fff' }} onClick={() => setHowto((h) => !h)} aria-expanded={howto}>
            {howto ? 'Close' : 'How it works'}
          </button>
          <div className="howto-veil" onClick={() => setHowto(false)} />
        </>
      )}
      {index && <IndexOverlay page={page} go={go} close={() => setIndex(false)} />}
    </>
  )
}
