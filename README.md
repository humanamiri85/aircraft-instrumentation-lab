# Flight Instrument Lab — Phase 1

Interactive six-pack instrument learning page for undergraduate Measurement & Instrumentation. Plain HTML, CSS, JavaScript and dynamic SVG; no runtime dependencies.

## Run

Run `npm start` (requires Python 3), then open http://localhost:8000. ES modules require an HTTP server rather than opening the HTML file directly.

## Structure

- `index.html`, `styles.css`: responsive cockpit and learning-panel layout.
- `js/app.js`: controls, selection, reset, animation orchestration.
- `js/model.js`: flight-variable definitions, validation and time-based smoothing, including shortest-path heading changes.
- `js/catalog.js`: instrument metadata and display formatting.
- `js/instruments/`: six independent SVG instrument modules and reusable SVG drawing primitives.

Instrument renderers consume a flight-state object. Future sensor and system models can be added between control state and indications without rewriting the controls. Future errors, failures and quizzes are outside this version.

## Scope and simplifications

Controls independently set airspeed (40–180 kt), altitude (0–10,000 ft), vertical speed (±2,000 ft/min), pitch (±20°), bank (±45°), and heading (0–359°). Vertical speed does not integrate altitude; bank does not integrate heading. Bank drives the turn coordinator’s miniature airplane as a qualitative demo, not a calculated turn rate; the ball stays centered. Airspeed arcs are illustrative, pressure setting is fixed, and no sensor physics or errors are simulated. Reduced-motion preferences are respected.

Educational simulator only. Not flight-certified; not for flight or navigation.
