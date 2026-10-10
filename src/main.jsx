import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { engine } from './sim/engine.js'
import '@fontsource-variable/archivo/wdth.css'
import './theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Test hook: open the site with ?debug to inspect the simulation from the console.
if (new URLSearchParams(window.location.search).has('debug')) window.__sim = engine
