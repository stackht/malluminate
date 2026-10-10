# Malluminate

A React + Vite single-page app (no backend) that runs an **AI shopping-mall command centre** on a
deterministic, **simulated** mall. The landing page is one live dashboard; PS 2 to PS 10 are features
inside it and also have a full page of their own in the sidebar.

    npm install
    npm run dev        # development
    npm run build      # static site in dist/  (Cloudflare Pages: build `npm run build`, output `dist`)

Open the site with `?debug` (for example `/?debug#/`) to expose the simulation as `window.__sim` for testing.
Rename the project in `src/config.js`.

## The ten problem statements
| PS | Statement | Where |
|---|---|---|
| 1 | AI-based shopping mall navigation system | the **dashboard** (the whole system) |
| 2 | Basics of Prolog | **Prolog lab**: real in-browser interpreter, editable program, queries; also `prolog/mall.pl` |
| 3 | Mall navigation with BFS and DFS | **Mall navigator** (+ navigation panel on the dashboard) |
| 4 | Robot pathfinding with A* on a 3 × 3 grid | **Robot pathfinder** (editable grid S, G, #) |
| 5 | Minimax store selection game | **Store game** (alpha-beta, play it yourself) |
| 6 | Fuzzy air-conditioning controller | **Climate control**; runs for every section on the dashboard |
| 7 | Fuzzy lighting from ambient light and activity | **Smart lighting**; runs for every section on the dashboard |
| 8 | Neuro-fuzzy crowd prediction (low / medium / high) | **Crowd forecast** (ANFIS with 24 rules, trainable) |
| 9 | Perceptron categories + competitive-learning groups | **Customer insight** |
| 10 | Bigram µLM and trigram SLM messages | **Mall assistant** |

## Honest simulation
- The mall, customers, arrivals, weather and all training data are **synthetic**. A badge says so. No live feed, camera or building system is connected.
- Simulation time advances only while running; the wall clock is your computer's. They are shown separately.
- The Prolog interpreter is written for this project (facts, rules, lists, arithmetic, `\+`, `findall`, `between`; no cut, no assert). It is not SWI-Prolog; the same `.pl` file runs in SWI-Prolog: `swipl -s prolog/mall.pl`.
- Messages are sampled from a predefined corpus. The store game and robot grid are independent exercises that share the interface.

## Architecture
```
src/sim/engine.js    one clock + state: customers on the walkway graph, zones (temperature, AC, lights), metrics, events
src/state.jsx        React bindings; module pages read a frozen snapshot, closures/promotion/mode are live
src/dashboard/       command centre UI: floor plan, KPIs, controls, AI decision panel, charts, event feed
src/lib/             algorithms: mall graph, BFS/DFS/A*, Prolog interpreter, fuzzy, ANFIS + MLP, perceptron, competitive, n-grams, minimax
src/pages/           one page per feature
```
One loop (`requestAnimationFrame`, fixed 0.5 s physics step, speed 1x to 300x) drives everything. Reset replays a seeded 30-minute warm-up so the initial scenario is identical every time.

## How the simulation connects the features
- Visitor arrivals follow a crowd pattern by time, day and promotion; the neuro-fuzzy forecast is trained on noisy samples of that pattern, so forecast and actual crowd can be compared on the chart.
- Customers route with A*, avoiding closed walkways. Crowd slows walkers.
- Crowd and activity per section drive the fuzzy AC and lighting controllers (AI mode) versus fixed settings; energy use and comfort are measured.
- The Prolog panel rebuilds its facts from the live walkways (closed ones removed) and runs BFS and DFS written as rules.
- Customer classification and grouping use the customers currently inside; the assistant seeds its text from live conditions.

## Tests run
A Playwright browser test (Edge) covered: dashboard as default; start, pause and reset; reset determinism; visitor flow and promotion effects; AI vs fixed energy; walkway close tool and event log; Prolog panel reacting to closures; each module page; no console errors; no horizontal overflow at 390 px. Visual checks were screenshots only.
