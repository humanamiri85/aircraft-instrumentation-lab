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
