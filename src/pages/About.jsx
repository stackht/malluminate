import { APP_NAME } from '../config.js'
import { SOURCE_PS } from '../modules.js'
import { Panel } from '../components/Ui.jsx'

export default function About() {
  return (
    <div className="page">
      <header className="gatehead fadein" style={{ display: 'block' }}>
        <h1>About {APP_NAME}</h1>
        <p style={{ maxWidth: '72ch' }}>One system, many features. The dashboard simulates a shopping mall; each AI technique works on the same mall, so the output of one becomes the input of the next.</p>
      </header>
      <div className="stack">
        <Panel title="The problem">
          <p className="alertline" style={{ maxWidth: '60ch' }}>Build an AI-based shopping mall system: guide customers through the mall, control air conditioning and lighting, predict crowds, understand customer groups, pick which store to promote, and answer questions in plain words.</p>
        </Panel>
        <Panel title="How the ten source statements map to the system" tag="for examiners">
          <table>
            <thead><tr><th>#</th><th>Source problem statement</th><th>Where</th></tr></thead>
            <tbody>
              {SOURCE_PS.map((p) => (
                <tr key={p.n}>
                  <td className="num">{p.n}</td>
                  <td>{p.text}</td>
                  <td><a href={p.where === 'home' ? '#/' : `#/${p.where}`} style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.label}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="How the features feed each other">
          <ol style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 8, maxWidth: '72ch' }}>
            <li>The <b>crowd forecast</b> uses time, day and promotions. The simulated world follows the same pattern, so you can compare forecast and actual crowd on the dashboard.</li>
            <li><b>Customers</b> walk the walkways. Search algorithms plan their routes, skipping closed walkways.</li>
            <li>Crowd and customer activity feed <b>climate</b> and <b>lighting</b> controllers, which set AC power and brightness per section.</li>
            <li>The <b>customer insight</b> models classify and group the customers currently inside.</li>
            <li>The <b>assistant</b> writes messages seeded from live conditions. The <b>store game</b> and <b>robot pathfinder</b> are independent exercises that share the interface.</li>
          </ol>
        </Panel>
        <Panel title="What is simulated">
          <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 6, maxWidth: '72ch' }}>
            <li>The mall, customers, arrivals, weather and every training dataset are synthetic. No live cameras, sensors or building systems are connected.</li>
            <li>Simulation time advances only while the simulation runs. The wall clock is your computer's.</li>
            <li>The Prolog is a small interpreter written for this project (no cut, no assert). The same program ships as <code>prolog/mall.pl</code> for SWI-Prolog.</li>
            <li>The language models sample from a predefined corpus.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}
