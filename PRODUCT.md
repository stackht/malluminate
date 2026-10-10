# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
React + Vite, client-side only, no backend (existing). Deploys as a static site on Cloudflare Pages.

## Users
Examiners and classmates in an AI / Soft Computing course who watch a demo and viva on a laptop or projector, and, secondarily, people judging it as if it were a product pitched to mall operators. Both audiences must understand it in seconds. (Confirmed with the user; the scene detail is inferred.)

## Product Purpose
Malluminate is an AI command centre for a shopping mall, running on a deterministic simulated mall. One live dashboard guides customers (BFS, DFS, A*), controls air conditioning and lighting (fuzzy logic), predicts crowds (neuro-fuzzy), classifies and groups customers (perceptron, competitive learning), writes messages (bigram and trigram models), plays a store-promotion game (minimax) and reasons in Prolog. Success: a viewer opens one page, starts the simulation, watches customers move and sections change, and sees each AI technique respond.

## Positioning
Not ten separate exercises: one mall whose crowd, closures, temperature and promotions feed every technique. The dashboard is the whole system; the other nine problem statements are features with their own pages.

## Operating Context
Used while presenting: Start, Pause, Reset, speed, closing a walkway, starting a promotion, switching between fixed and AI building control, opening a feature page to explain an algorithm step by step.

## Capabilities and Constraints
- Everything runs in the browser; all data is synthetic and must be labelled so. No live feed, cameras or sensors.
- Simulation time, wall-clock time and real data stay separate and visible.
- Prolog is an in-browser interpreter written for the project, not SWI-Prolog; `prolog/mall.pl` also ships.
- The project name Malluminate may change later and lives in `src/config.js`.
- Ten source problem statements must stay findable: PS 1 is the dashboard, PS 2 to 10 are feature pages.

## Brand Commitments
Name: Malluminate. Tagline: "One mall. Every light on." The previous look (dark navy, gold accent, italic serif headings, left icon sidebar) belonged to the unrelated SmartCity Traffic Brain project and is an anti-reference; Malluminate must have its own identity.

## Evidence on Hand
No logos or photography. Real, working simulation and algorithms. Synthetic data only; no testimonials, customers or measurements may be invented.

## Product Principles
1. The mall alive is the hero: the floor plan and moving customers lead.
2. Every AI claim is visible and honest: show the inputs, the rule or algorithm, and label synthetic data.
3. Premium means restraint and finish, not decoration.
4. One shared mall; features are views onto it.

## Accessibility & Inclusion
Readable on a projector (strong contrast, large key numbers), keyboard operable controls, respects reduced motion, works on phone widths.
