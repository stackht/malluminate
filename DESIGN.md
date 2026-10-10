---
name: Malluminate
description: One mall. Every light on. A concept-store lookbook turned into an operating surface.
colors:
  paper: "#f1f1ef"
  plate: "#ffffff"
  ink: "#0b0b0c"
  ink-2: "#2b2b2f"
  mute: "#66666b"
  faint: "#a5a5aa"
  rule: "rgba(11, 11, 12, 0.14)"
  rule-strong: "rgba(11, 11, 12, 0.3)"
  signal-blue: "#1d3bff"
  signal-blue-deep: "#1429c9"
  signal-blue-wash: "rgba(29, 59, 255, 0.07)"
  data-low: "#16996a"
  data-medium: "#e29a06"
  data-high: "#e5392a"
typography:
  wordmark:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  display:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 6.2rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.05em"
    fontVariation: "'wdth' 122"
  headline:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.045em"
    fontVariation: "'wdth' 118"
  title:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  numeral:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2rem, 3.2vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 68"
  body:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
  mono:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "0.82rem"
    lineHeight: 1.6
rounded:
  flat: "2px"
spacing:
  gutter: "clamp(16px, 3vw, 48px)"
  stack: "32px"
  panel: "28px"
  field: "20px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.plate}"
    typography: "{typography.label}"
    rounded: "{rounded.flat}"
    padding: "0 18px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "0 18px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plate}"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plate}"
    height: "38px"
  input:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "8px 10px"
    height: "40px"
  callout-plate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plate}"
    padding: "clamp(20px, 2.4vw, 32px)"
  pill-low:
    backgroundColor: "{colors.data-low}"
    textColor: "{colors.plate}"
  pill-high:
    backgroundColor: "{colors.data-high}"
    textColor: "{colors.plate}"
---

# Design System: Malluminate

## Overview

**Creative North Star: "The Concept-Store Lookbook"**

A lookbook page that happens to be operable. The mall floor plan is the photograph; everything else is type, hairline rules and white space. A cool paper ground carries pure-white plates, near-black ink and a single cobalt signal. It was built to be read from a projector by examiners and from a laptop by someone judging a pitch, so numerals are huge, contrast is strong, and nothing decorates.

The system is flat and ruled. Structure comes from 1px ink or 14%-ink hairlines, not from boxes, cards or shadows. Panels are open sections headed by a rule, not containers. Type does the loud work: extended-width Archivo for titles and the wordmark, condensed heavy numerals for readouts. Green, amber and red exist only to encode data state.

This rejects the dark glass dashboard with a left icon sidebar, rounded cards and a gold accent (the prior look, which belonged to another project).

**Key Characteristics:**
- Cool paper ground, white plates, near-black ink, one cobalt signal.
- Hairline rules as the only structural device; no sidebar, no cards.
- Archivo Variable across its width axis: extended for titles, condensed for numbers.
- Flat 2px corners; no shadows.
- One black plate per view for the call to act.
- Status colour only on data.

## Colors

Restrained and cool: paper and ink do almost all the work, cobalt speaks for action, traffic-light hues speak for data.

### Primary
- **Signal Cobalt** (signal-blue): the single action and selection colour: primary buttons, focus ring, caret, text selection, slider thumb, route and selection washes, links on hover in the index, the "+" disclosure mark. Deep Cobalt (signal-blue-deep) is its hover state; Cobalt Wash (signal-blue-wash) is selected-row and hover tint.

### Neutral
- **Cool Paper** (paper): page ground and masthead.
- **Plate White** (plate): inputs, map plate, segmented control, drawer; the "photograph" surface.
- **Ink** (ink): text, strong 1px rules, black callout plate, selected states, code/trace blocks.
- **Graphite** (ink-2): secondary body copy and lede text.
- **Mute Grey** (mute): labels, table headers, notes, timestamps.
- **Faint Grey** (faint): disabled text only.
- **Hairline** (rule) and **Strong Hairline** (rule-strong): row dividers and control borders respectively.

### Data
- **Low Green** (data-low), **Medium Amber** (data-medium), **High Red** (data-high): crowd, alert and risk levels in pills, KPI emphasis, map and event kinds. Amber pills take ink text; the others take white.

### Named Rules
**The One Signal Rule.** Cobalt means "you can act on this or it is selected". It never decorates.
**The Data-Only Hue Rule.** Green, amber and red appear only on a datum that has that state. A button, border or heading is never green, amber or red, except the destructive button (danger variant).

## Typography

**Display, Body and Label Font:** Archivo Variable (with Helvetica Neue, Arial, sans-serif), loaded with the wdth axis.
**Mono:** system monospace (ui-monospace, Cascadia Mono, Consolas) for formulas, traces and Prolog source.

**Character:** One family, played across width and weight. Wide and heavy for names, narrow and heavy for figures, ordinary width for reading.

### Hierarchy
- **Display** (800, clamp 2.6rem to 6.2rem, 0.92, wdth 122, -0.05em): the page title in the page head.
- **Headline** (800, 1.7rem, wdth 118, -0.045em): decision panel title and drawer title; Index lede is the same family at larger scale.
- **Title** (700, 1.15rem, wdth 112, -0.02em): panel and section headings; disclosure summaries run 1.02rem at wdth 108.
- **Numeral** (700, clamp 2rem to 2.9rem, line-height 1, wdth 68 to 72, tabular figures): KPI strip and metrics. Condensed widths run from 68 (KPIs) down to 70 (callout title).
- **Body** (400, 15px, 1.5, wdth 100): reading text; ledes at 1.12rem in Graphite, capped at 62ch.
- **Label** (700, 0.64 to 0.74rem, 0.08 to 0.12em tracking, uppercase): button text, table headers, tags, field labels, segmented control. These are functional control and column labels.

### Named Rules
**The Width-Carries-Role Rule.** Wide (112 to 125) is for names, condensed (68 to 88) is for numbers, 100 is for reading.
**The Tabular Rule.** Every figure that can change uses tabular-nums so readouts do not jitter.

## Layout

A single column of full-width bands inside a 1720px maximum width, padded by a fluid gutter (16px to 48px). No sidebar. The dashboard reads top to bottom: sticky masthead (wordmark left, status and clock centre, actions right), control bar, five-numeral KPI strip divided by hairlines, then the map at about two thirds with a 410px sticky decision column at right, then a lower band of charts and the event feed. Vertical rhythm is 24 to 32px between bands and 18 to 22px between controls.

Below 1250px the decision column stacks; below 1000px the KPI strip becomes two columns; below 760px the masthead drops its centre block and the dashboard reorders into controls, map (pannable at a minimum 760px width), KPIs, controls, decisions, lower band. Feature pages use the same page head and a `layout` of stacked, auto-fitting grids (minimum 300px to 480px columns).

## Elevation & Depth

Flat. There are no drop shadows. Depth is stated by ground change (paper to white plate), by rule weight (1px hairline, 1px ink, 2px ink for the decision panel top), and by the one inverted black plate. The only blur is the translucent masthead (backdrop blur over paper). The drawer is separated by a 1px ink border and a 35% ink veil. Inset 2px/3px rings mark open and current cells in the robot grid; the slider thumb has a 1px cobalt ring.

### Named Rules
**The Flat Rule.** Surfaces never carry shadows. Hierarchy comes from ground, rule weight and type scale.

## Shapes

Hard and plain: controls, inputs, segmented groups and buttons carry a flat 2px corner. Plates, tables, traces and tags are square. The only circles are semantic: slider thumbs and the status dot in a chip. Dashed 1px border marks an empty state. Native selects are restyled with an ink chevron to match.

## Components

### Buttons
- **Shape:** flat 2px corners, 40px tall (32px small), 18px side padding.
- **Primary:** cobalt fill, white text, 700 uppercase label with 0.1em tracking. Hover to deep cobalt.
- **Ghost:** transparent with 1px ink border; hover inverts to ink fill and white text.
- **Danger:** red fill; **Disabled:** transparent, faint text, hairline border.
- Transition 0.25s on a strong ease-out (cubic-bezier 0.22, 1, 0.36, 1).

### Segmented control and toggles
Plate-white group with 1px ink border and hairline dividers; selected segment inverts to ink fill with white text; hover is the cobalt wash.

### Inputs / Fields
Plate white, 1px strong hairline, 2px corner, 40px tall. Hover darkens border to ink. Field label sits above in Mute Grey label type. Focus uses the global 2px cobalt outline with 2px offset. Range sliders are a 2px ink track with a cobalt round thumb. Checkboxes use cobalt accent.

### Tables
Open, no outer border. Header is Mute label type over a 1px ink rule; rows divide by hairline; numeric columns right-aligned; selected row takes cobalt wash.

### Panels and sections
A panel is a top rule (1px ink, 2px for the decision panel) with 18px of space and a Title heading. Disclosure sections divide by strong hairlines with a cobalt plus/minus mark.

### KPI strip
Five readouts divided by hairlines under a 1px ink bottom rule: condensed numeral, plain-sentence label beside it (Mute, not uppercase), an extra line below. A high-state figure turns red.

### Callout plate
The one inverted element: ink fill, white text, a plain-sentence lead line, a condensed title, and a white button on the plate.

### Pills, tags and chips
Pills are square, filled with a data hue (white text) or ink or cobalt. Tags are hairline-bordered labels; the "on" tag inverts to ink. Chips are plate-white with a currentColor border and a small status dot.

### Trace and code blocks
Ink ground, light grey monospace; call lines in light cobalt, exit lines green, failures coral.

### Navigation
The Index is a full-screen paper overlay: a large wide-set lede and a two-column list of hairline-ruled rows (number, wide title with muted description, arrow). Hover and current page turn the row cobalt; the arrow slides 6px. A fixed button opens the how-it-works drawer (440px, white, slides in over 0.6s).

### Motion
Entrances are 0.35 to 0.5s fades and 8px rises on the strong ease-out; ambient route dashes animate on the map. Reduced motion disables animation and collapses transitions.

## Do's and Don'ts

### Do:
- **Do** build structure from 1px ink or hairline rules and white space, not from boxes.
- **Do** reserve cobalt for action, selection and focus.
- **Do** set figures condensed, heavy and tabular; set names extended.
- **Do** keep corners at a flat 2px (or square) and surfaces shadow-free.
- **Do** label all synthetic data as simulated, using badges or chips.
- **Do** keep mono type for code, formulas and traces only.
- **Do** keep icons as the single-weight inline SVG set (round caps, 2px stroke, currentColor).

### Don't:
- **Don't** use a dark glass dashboard, left icon sidebar, rounded cards or a gold accent.
- **Don't** use green, amber or red as decoration; they are data states.
- **Don't** add drop shadows or rounded corners beyond 2px.
- **Don't** introduce a second accent hue.
- **Don't** use a dark ground for the page; the only dark surfaces are the callout plate and code blocks.
