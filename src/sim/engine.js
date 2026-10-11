// One authoritative mall simulation: a single clock and a single state object.
// Customers walk the walkway graph, dwell in sections, and drive crowd, temperature,
// lighting and energy. Everything is synthetic and deterministic (seeded).
import { NODES, NODE, EDGES, EDGE, edgeKey } from '../lib/mall.js'
import { search } from '../lib/search.js'
import { makeRng } from '../lib/rng.js'
import { truth, crowdLevel } from '../lib/crowd.js'
import { infer } from '../lib/fuzzy.js'
import { AC_SYSTEM } from '../lib/systems.js'
import { lightingBrightness } from '../lib/lighting.js'
import { ARCHETYPES, makeRecord } from '../lib/customers.js'

export const STEP = 0.5
export const SCENARIOS = {
  weekday: { label: 'Wednesday morning · 09:30', day: 2, start: 9.5 * 3600, scale: 1, promo: false },
  saturday: { label: 'Saturday lunch · 12:00', day: 5, start: 12 * 3600, scale: 1, promo: false },
  sale: { label: 'Friday sale evening · 17:00', day: 4, start: 17 * 3600, scale: 1, promo: true },
}
export const OPEN = 9
export const CLOSE = 22
const MAX_AGENTS = 420
const WALK = 1.3 / 0.16 // map units per second
const INSIDE_FULL = 165 // visitors that count as a 100% crowd index

export const daylight = (hour) => Math.pow(Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12)), 0.7)
export const outdoorTemp = (hour) => 24 + 9 * Math.max(0, Math.sin((Math.PI * (hour - 8)) / 14))

export class MallEngine {
  constructor() {
    this.listeners = new Set()
    this.version = 0
    this.running = false
    this.speed = 10
    this.mode = 'ai' // 'fixed' | 'ai' building control
    this.lightModel = 'mamdani' // 'mamdani' | 'sugeno': which FIS sets the lighting in AI mode
    this.scenario = 'weekday'
    this.config = { updateMs: 50 }
    this.subscribe = this.subscribe.bind(this)
    this.getVersion = () => this.version
    this.frame = this.frame.bind(this)
    this.wallNow = Date.now()
    this.reset()
    if (typeof window !== 'undefined') setInterval(() => { if (!this.running) this.emit() }, 1000)
  }

  subscribe(cb) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }
  emit() {
    this.version++
    this.wallNow = Date.now()
    this.listeners.forEach((l) => l())
  }

  // ---------- lifecycle ----------
  reset() {
    this.pause(false)
    const sc = SCENARIOS[this.scenario]
    this.rng = makeRng(77)
    this.startDay = sc.day
    this.time = sc.start - 1800 // warm-up begins 30 simulated minutes before the scenario start
    this.t0 = sc.start
    this.tick = 0
    this.agents = []
    this.nextId = 1
    this.blocked = {}
    this.scale = sc.scale
    this.promo = { on: sc.promo, store: 'clothing' }
    this.override = {}
    this.events = []
    this.history = []
    this.acc = 0
    this.sec = 0
    this.lastSample = this.time
    this.crowd = Object.fromEntries(EDGES.map((e) => [e.id, 0]))
    this.zones = Object.fromEntries(NODES.map((n) => [n.id, { occ: 0, pct: 0, temp: 24, ac: 50, light: 70, ambient: 0, lastCtl: -999 }]))
    this.stats = { spawned: 0, left: 0, rejected: 0 }
    this.metrics = { inside: 0, crowd: 0, level: 'low', temp: 24, power: 0, saved: 0, alerts: 0, comfort: 0 }
    this.lastOpen = null
    this.quiet = true
    for (let i = 0; i < 3600; i++) this.step(STEP)
    this.quiet = false
    this.events = []
    this.history = []
    this.stats = { spawned: 0, left: 0, rejected: 0 }
    this.lastSample = this.time
    this.measure()
    this.sample()
    this.log('system', `Simulation reset: ${sc.label}. Simulated mall and customers, no live feed.`)
    this.emit()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.lastEmit = 0
    this.log('system', 'Simulation started')
    this.emit()
    this.raf = requestAnimationFrame(this.frame)
  }
  pause(announce = true) {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.raf)
    if (announce) {
      this.log('system', 'Simulation paused')
      this.emit()
    }
  }
  frame(now) {
    if (!this.running) return
    const dt = Math.min(0.25, (now - this.last) / 1000)
    this.last = now
    this.clockAcc = (this.clockAcc || 0) + dt * this.speed
    let n = 0
    while (this.clockAcc >= STEP && n < 100) {
      this.step(STEP)
      this.clockAcc -= STEP
      n++
    }
    if (n >= 100) this.clockAcc = 0
    if (now - this.lastEmit >= this.config.updateMs) {
      this.lastEmit = now
      this.emit()
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  log(type, text) {
    if (this.quiet) return
    this.events.unshift({ id: this.events.length ? this.events[0].id + 1 : 1, t: this.time, type, text })
    if (this.events.length > 120) this.events.length = 120
  }

  // ---------- time helpers ----------
  hour() {
    return (this.time % 86400) / 3600
  }
  day() {
    return (this.startDay + Math.floor(this.time / 86400)) % 7
  }
  isOpen() {
    const h = this.hour()
    return h >= OPEN && h < CLOSE
  }
  // The crowd index the world is "trying" to reach right now (before the user's visitor scale).
  targetCrowd() {
    return truth(Math.min(CLOSE, Math.max(OPEN, this.hour())), this.day(), this.promo.on ? 1 : 0)
  }

  // ---------- physics step ----------
  step(dt) {
    this.tick++
    this.time += dt
    const open = this.isOpen()
    if (this.lastOpen !== null && open !== this.lastOpen) {
      this.log('system', open ? 'The mall opens' : 'The mall closes: customers are heading to the exits')
      if (!open) for (const a of this.agents) a.goals = a.goals.slice(0, a.gi)
    }
    this.lastOpen = open
    if (open) this.spawn(dt)
    this.moveAgents(dt)
    this.updateEnvironment(dt)
    this.sec += dt
    if (this.sec >= 1) {
      this.sec -= 1
      this.measure()
    }
    if (this.time - this.lastSample >= 60) {
      this.lastSample = this.time
      this.sample()
    }
  }

  // ---------- customers ----------
  spawn(dt) {
    const rate = (0.25 + 0.058 * this.targetCrowd()) * this.scale // arrivals per minute
    this.acc += (rate / 60) * dt
    while (this.acc >= 1) {
      this.acc -= 1
      this.spawnOne()
    }
  }

  spawnOne() {
    if (this.agents.length >= MAX_AGENTS) {
      this.stats.rejected++
      return null
    }
    const arch = Math.floor(this.rng() * 4)
    const rec = makeRecord(this.rng, arch)
    const A = ARCHETYPES[arch]
    const goals = []
    const pool = [...A.goals]
    const n = 1 + Math.floor(this.rng() * 3)
    for (let i = 0; i < n && pool.length; i++) goals.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0])
    if (this.promo.on && !goals.includes(this.promo.store) && this.rng() < 0.55) goals.unshift(this.promo.store)
    const origin = this.rng() < 0.88 ? 'entrance' : 'parking'
    const a = { id: this.nextId++, arch, rec, goals, gi: 0, state: 'walk', at: origin, route: [origin], ri: 0, pos: 0, dwellLeft: 0, resume: false, born: this.time, walked: 0, exiting: false }
    if (!this.planTo(a, goals[0])) return null
    this.agents.push(a)
    this.stats.spawned++
    return a
  }

  planTo(a, goal) {
    const from = a.route[a.ri]
    if (from === goal) { a.route = [from]; a.ri = 0; return true }
    const r = search('astar', from, goal, this.crowd, this.blocked)
    if (!r.found) return false
    a.route = r.path
    a.ri = 0
    a.pos = 0
    a.state = 'walk'
    return true
  }

  exitFor(a) {
    const here = a.route[a.ri]
    const best = ['entrance', 'parking'].map((x) => ({ x, d: Math.hypot(NODE[x].x - NODE[here].x, NODE[x].y - NODE[here].y) })).sort((p, q) => p.d - q.d)
    return best[0].x
  }

  moveAgents(dt) {
    const gone = []
    for (const a of this.agents) {
      if (a.state === 'dwell') {
        a.dwellLeft -= dt
        if (a.dwellLeft <= 0) {
          if (a.resume) {
            a.state = 'walk'
            a.resume = false
          } else this.nextGoal(a, gone)
        }
        continue
      }
      // walking along route[ri] -> route[ri+1]
      const from = a.route[a.ri]
      const to = a.route[a.ri + 1]
      if (to === undefined) { this.nextGoal(a, gone); continue }
      const key = edgeKey(from, to)
      if (this.blocked[key]) {
        // the walkway ahead was closed: plan a new way
        const goal = a.route[a.route.length - 1]
        if (!this.planTo(a, goal)) { a.state = 'dwell'; a.dwellLeft = 20; a.resume = false; a.route = [from]; a.ri = 0 }
        continue
      }
      const E = EDGE[key]
      const dens = Math.min(1, (this.crowd[key] || 0) / 100)
      a.pos += WALK * (1 - 0.65 * dens) * dt
      if (a.pos >= E.length) {
        a.ri++
        a.pos = 0
        a.at = a.route[a.ri]
        if (a.ri >= a.route.length - 1) {
          this.arrive(a, gone)
        } else if (this.rng() < 0.12) {
          a.state = 'dwell'
          a.resume = true
          a.dwellLeft = 10 + this.rng() * 35
        }
      }
    }
    if (gone.length) {
      const set = new Set(gone)
      this.agents = this.agents.filter((a) => !set.has(a.id))
      this.stats.left += gone.length
    }
  }

  arrive(a, gone) {
    if (a.exiting) { gone.push(a.id); return }
    const A = ARCHETYPES[a.arch]
    a.state = 'dwell'
    a.resume = false
    a.dwellLeft = 60 * (A.dwellMin[0] + this.rng() * (A.dwellMin[1] - A.dwellMin[0]))
  }

  nextGoal(a, gone) {
    a.gi++
    const here = a.route[a.ri] ?? a.at
    a.route = [here]
    a.ri = 0
    if (a.gi < a.goals.length && this.isOpen()) {
      if (this.planTo(a, a.goals[a.gi])) return
    }
    a.exiting = true
    const ex = this.exitFor(a)
    if (here === ex) { gone.push(a.id); return }
    if (!this.planTo(a, ex)) gone.push(a.id)
  }

  // ---------- environment: temperature, AC, lights ----------
  updateEnvironment(dt) {
    const hour = this.hour()
    const tout = outdoorTemp(hour)
    const day = daylight(hour)
    for (const n of NODES) {
      const z = this.zones[n.id]
      const ov = this.override[n.id] || {}
      // controllers re-decide every 20 simulated seconds
      if (this.time - z.lastCtl >= 20) {
        z.lastCtl = this.time
        z.ambient = Math.round(100 * n.sky * day)
        const targetAc = ov.ac != null ? ov.ac : this.mode === 'ai' ? infer(AC_SYSTEM, { temperature: z.temp, crowd: z.pct }).crisp : 50
        const targetLight = ov.light != null ? ov.light : this.mode === 'ai' ? lightingBrightness(this.lightModel, z.ambient, Math.min(100, z.pct * 1.2)) : 100
        z.ac += (targetAc - z.ac) * 0.6
        z.light += (targetLight - z.light) * 0.6
      }
      const heat = 0.00012 * z.occ + 0.0000015 * (z.light / 100) * n.cap
      z.temp += dt * (0.0008 * (tout - z.temp) + heat - 0.001 * (z.ac / 100) * (z.temp - 16))
    }
  }

  // ---------- metrics ----------
  measure() {
    const walkers = {}
    const dwellers = {}
    let inside = 0
    for (const a of this.agents) {
      inside++
      if (a.state === 'dwell') dwellers[a.route[a.ri] ?? a.at] = (dwellers[a.route[a.ri] ?? a.at] || 0) + 1
      else if (a.route[a.ri + 1] !== undefined) {
        const k = edgeKey(a.route[a.ri], a.route[a.ri + 1])
        walkers[k] = (walkers[k] || 0) + 1
      }
    }
    for (const e of EDGES) this.crowd[e.id] = Math.min(100, Math.round(this.crowd[e.id] * 0.5 + 0.5 * (100 * (walkers[e.id] || 0)) / e.cap))
    let overcrowded = 0
    let tSum = 0
    let wSum = 0
    let power = 0
    let base = 0
    for (const n of NODES) {
      const z = this.zones[n.id]
      let near = 0
      for (const e of EDGES) if (e.a === n.id || e.b === n.id) near += walkers[e.id] || 0
      z.occ = (dwellers[n.id] || 0) + 0.3 * near
      z.pct = Math.min(100, (100 * z.occ) / n.cap)
      if (z.pct >= 90) overcrowded++
      const w = z.occ + 1
      tSum += z.temp * w
      wSum += w
      const lightKw = 0.6 + n.cap * 0.01
      const acKw = 2 + n.cap * 0.04
      power += lightKw * (z.light / 100) + acKw * (z.ac / 100)
      base += lightKw * 1 + acKw * 0.5
    }
    const crowd = Math.min(100, Math.round((100 * inside) / INSIDE_FULL))
    const temp = tSum / wSum
    this.metrics = { inside, crowd, level: crowdLevel(crowd), temp, power, saved: Math.round(100 * (1 - power / base)), alerts: Object.keys(this.blocked).length + overcrowded + (this.promo.on ? 1 : 0), comfort: Math.abs(temp - 24) }
    // log newly overcrowded zones once
    for (const n of NODES) {
      const z = this.zones[n.id]
      const hot = z.pct >= 90
      if (hot && !z.flagged) this.log('crowd', `${n.name} is overcrowded (${Math.round(z.pct)}% full)`)
      z.flagged = hot
    }
  }

  sample() {
    const m = this.metrics
    this.history.push({ t: this.time, inside: m.inside, crowd: m.crowd, temp: m.temp, power: m.power, saved: m.saved, target: this.isOpen() ? this.targetCrowd() : 0 })
    if (this.history.length > 300) this.history.shift()
  }

  // ---------- user actions ----------
  setSpeed(s) { this.speed = s; this.emit() }
  setMode(mode) {
    this.mode = mode
    this.log('system', mode === 'ai' ? 'Building control: AI (fuzzy air conditioning and lighting)' : 'Building control: fixed (AC 50%, lights 100%)')
    this.emit()
  }
  setLightModel(model) {
    this.lightModel = model
    this.log('system', `Lighting controller: ${model === 'sugeno' ? 'Sugeno FIS (weighted average)' : 'Mamdani FIS (centroid)'}`)
    this.emit()
  }
  setScenario(sc) { this.scenario = sc; this.reset() }
  setScale(s) { this.scale = s; this.emit() }
  setDay(d) {
    this.startDay = (d - Math.floor(this.time / 86400) + 7 * 100) % 7
    this.log('system', `Day set to ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]}`)
    this.emit()
  }
  setPromo(on, store = this.promo.store) {
    this.promo = { on, store }
    this.log('promo', on ? `Promotion started at ${NODE[store].name}` : 'Promotion ended')
    this.emit()
  }
  addVisitors(n) {
    let added = 0
    for (let i = 0; i < n * 3 && added < n; i++) if (this.spawnOne()) added++
    this.log('system', `Added ${added} visitor${added === 1 ? '' : 's'}`)
    this.measure()
    this.emit()
  }
  removeVisitors(n) {
    const removed = Math.min(n, this.agents.length)
    this.agents.splice(this.agents.length - removed, removed)
    this.log('system', `Removed ${removed} visitor${removed === 1 ? '' : 's'}`)
    this.measure()
    this.emit()
  }
  setBlocked(edgeId, on) {
    if (on === !!this.blocked[edgeId]) return
    if (on) this.blocked[edgeId] = true
    else delete this.blocked[edgeId]
    const E = EDGE[edgeId]
    this.log(on ? 'incident' : 'system', `Walkway ${NODE[E.a].short}-${NODE[E.b].short} ${on ? 'closed' : 'reopened'}`)
    this.measure()
    this.emit()
  }
  toggleBlock(id) { this.setBlocked(id, !this.blocked[id]) }
  setBlockedMap(m) {
    for (const id of Object.keys(this.blocked)) if (!m[id]) this.setBlocked(id, false)
    for (const id of Object.keys(m)) if (m[id]) this.setBlocked(id, true)
  }
  setOverride(zone, patch) {
    this.override[zone] = { ...(this.override[zone] || {}), ...patch }
    const o = this.override[zone]
    if (o.ac == null && o.light == null) delete this.override[zone]
    this.log('system', `Manual override at ${NODE[zone].name}`)
    this.emit()
  }
  clearOverride(zone) {
    delete this.override[zone]
    this.emit()
  }
}

export const engine = new MallEngine()
