import { useEffect, useState } from 'react'
import { PageSnapshot } from './state.jsx'
import { APP_NAME } from './config.js'
import { FEATURES, featureOf } from './modules.js'
import Icon from './components/Icon.jsx'
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

const fromHash = () => {
  const h = window.location.hash.replace('#/', '').replace('#', '')
  return h in PAGES ? h : 'home'
}

export default function App() {
  const [page, setPage] = useState(fromHash)
  const [howto, setHowto] = useState(false)

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

  useEffect(() => {
    const name = featureOf(page)?.label ?? (page === 'about' ? 'About' : null)
    document.title = name ? `${name} · ${APP_NAME}` : `${APP_NAME}: command centre`
  }, [page])

  const Page = PAGES[page]
  const hasHowto = page !== 'home' && page !== 'about'

  return (
    <>
      <nav className="rail" aria-label="Mall control centre">
        <button className="rail-brand" onClick={() => go('home')} aria-label={`${APP_NAME}: command centre`} aria-current={page === 'home' ? 'page' : undefined}>
          <Icon name="store" size={22} />
          <span className="rail-title"><b>{APP_NAME}</b><small>Command centre · PS 1</small></span>
          <span className="tip">Command centre</span>
        </button>
        <div className="rail-section">AI modules</div>
        <div className="rail-route">
          {FEATURES.map((f) => (
            <button key={f.id} className="rail-btn" onClick={() => go(f.id)} aria-current={page === f.id ? 'page' : undefined} aria-label={f.label}>
              <Icon name={f.icon} size={20} />
              <span className="rail-label">{f.label}<small>PS {f.ps.join('·')}</small></span>
              <span className="tip">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <button className="rail-btn about" onClick={() => go('about')} aria-current={page === 'about' ? 'page' : undefined} aria-label="About this project">
            <Icon name="info" size={20} />
            <span className="rail-label">About</span>
            <span className="tip">About</span>
          </button>
        </div>
      </nav>

      <main key={page}>
        {page === 'home' ? <Dashboard /> : page === 'about' ? <About /> : <PageSnapshot><Page /></PageSnapshot>}
      </main>

      {hasHowto && (
        <>
          <button className="howto-toggle btn" onClick={() => setHowto((h) => !h)} aria-expanded={howto}>
            {howto ? 'Close' : 'How it works'}
          </button>
          <div className="howto-veil" onClick={() => setHowto(false)} />
        </>
      )}
    </>
  )
}
