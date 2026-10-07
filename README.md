# Flight Instrument Lab — Phase 1B

Interactive six-pack instrument learning page for undergraduate Measurement & Instrumentation. Plain HTML, CSS, JavaScript and dynamic SVG; no runtime dependencies.

## Run

Run `npm start` (requires Python 3), then open http://localhost:8000. ES modules require an HTTP server rather than opening the HTML file directly.

Run `npm run check` for application syntax checks and `npm test` for instrument directions, pointer ratios, control limits and heading wraparound. Tests use Node's built-in runner; no package installation is needed.

## Structure

- `index.html`, `styles.css`: responsive cockpit and learning-panel layout.
- `js/app.js`: controls, selection, reset, animation orchestration.
- `js/model.js`: flight-variable definitions, validation and time-based smoothing, including shortest-path heading changes.
- `js/math.js`: shared clamping, interpolation, angle mapping and heading wrap helpers.
- `js/catalog.js`: instrument metadata and display formatting.
- `js/instruments/`: six independent SVG instrument modules and reusable SVG drawing primitives.

Instrument renderers consume a flight-state object. Future sensor and system models can be added between control state and indications without rewriting the controls. Future errors, failures and quizzes are outside this version.

## Phase 1B instrument conventions

- Airspeed increases clockwise on a 0–200 kt face; controls remain 40–180 kt. Generic teaching arcs: white 45–95 kt, green 55–130 kt, yellow 130–175 kt, red radial line at 175 kt. These are not certified aircraft limits.
- Attitude uses a fixed gold aircraft reference, a moving pitch ladder and a rotating sky/ground horizon. Nose-up lowers the horizon; right bank raises its right side. Bank marks are fixed and the white roll index moves with the horizon.
- Altimeter: the long white hand turns once per 1,000 ft, short white hand once per 10,000 ft, and gold outlined marker once per 100,000 ft. The digital reading below the face helps distinguish overlapping hands.
- Turn coordinator: the miniature airplane drops the wing on the side of the turn. Two-minute standard-rate reference marks are illustrative; ±30° bank aligns with them without calculating a turn rate. The ball stays centered and is labeled as simplified.
- Heading: the card counterrotates under a fixed gold lubber line, with cardinal points, 10° ticks and numbers every 30°. The state takes the shortest path through north.
- VSI: zero is at nine o'clock, climb occupies the upper arc and descent the lower arc. Dial numbers are thousands of ft/min; the reading below shows signed ft/min.

Selecting an instrument highlights its face and shows its indicated quantity, displayed unit and short pilot interpretation. The existing controls, Reset and reduced-motion support remain available.

## Scope and simplifications

Controls independently set airspeed (40–180 kt), altitude (0–10,000 ft), vertical speed (±2,000 ft/min), pitch (±20°), bank (±45°), and heading (0–359°). Vertical speed does not integrate altitude; bank does not integrate heading. Bank drives the turn coordinator’s miniature airplane as a qualitative demo, not a calculated turn rate; the ball stays centered. Airspeed arcs are illustrative, pressure setting is fixed, and no sensor physics or errors are simulated. Reduced-motion preferences are respected.

Educational simulator only. Not flight-certified; not for flight or navigation.

## Phase 2A — Linked 3D Aircraft View

The low-poly aircraft helps connect cockpit indications with attitude in a fixed world reference. Pitch, bank and heading consume the same smoothed state as the six instruments. Gold marks the nose and tail; compass labels and a ground grid make heading observable from the fixed elevated camera. Reset immediately restores the shared default state. Reduced motion immediately applies slider targets.

This is an orientation visualization, **not a flight-dynamics simulator**. Airspeed, altitude and vertical speed do not move the aircraft. No forces, automatic turns, terrain or external model assets are simulated. If WebGL is unavailable, the panel explains the limitation while the cockpit and controls keep working.

World coordinates are +X east, +Y up and −Z north. The aircraft nose points along local −Z and its right wing along local +X. Intrinsic YXZ Euler rotation applies negative heading, positive pitch and negative bank: headings increase clockwise from north, positive pitch raises the nose, and positive bank lowers the right wing. Conversion lives in `js/aircraft/orientation.js`.

Three.js **0.180.0** (MIT) is bundled in `vendor/three/` with its license. Both upstream ES modules are kept together and loaded with relative paths, so GitHub Pages needs no build, CDN, npm installation or import map. To refresh, obtain that pinned npm package with integrity verification and copy `build/three.module.js`, `build/three.core.js` and `LICENSE`; do not edit vendored code. `npm test` includes pure orientation tests using the same Three.js math as the renderer. Development browser tooling is optional and is not an application dependency.

## Phase 2B — Flight-State Visualization

The existing scene now shows all six independently controlled variables. A compact
**Show flight data** HUD reports IAS, ALT, V/S, pitch, bank and heading. Slider
input immediately updates the shared displayed state, cockpit and 3D cues; Reset
immediately restores every variable and indication. The model still supports
shortest-path heading smoothing for time-based state updates.

Altitude uses a compressed teaching scale: 0–10,000 ft maps to aircraft heights
of 0–3 scene units, with the reference ground at −2.3. This minimum clearance
keeps banked wings above the plane; the gold line and ground ring show the
reference separation. The fixed camera accommodates the entire altitude range.
**Altitude visualization is not to scale.**

Airspeed is a **relative-motion cue**: eight short reference lines move beneath
the aircraft, with 40, 110 and 180 kt mapped to 0.6, 1.8 and 3 scene units/second.
Their heading follows the aircraft; they do not translate the aircraft or claim
physical distance accuracy. Reduced-motion users see stationary streaks whose
length indicates relative speed.

Vertical speed is a static up/down arrow and a CLIMB/DESCENT/LEVEL label. Its
length grows from 0.45 toward 1.5 scene units with magnitude up to 2,000 ft/min;
at zero it is hidden and the label reads LEVEL 0 ft/min. It never integrates
altitude. Pitch does not change vertical speed, bank does not change heading,
and airspeed does not change attitude. **Flight variables are independently
controlled in this training mode. This is not a flight-dynamics simulation.**

The scene is retained across changes, and only cue transforms are updated in
the existing animation loop. HUD and textual cues remain active in the WebGL
fallback. No additional application dependencies, build steps or external
assets are needed. `npm test` covers the cue mappings, formatting and independent
state as well as the Phase 1/2A instrument and orientation tests.
