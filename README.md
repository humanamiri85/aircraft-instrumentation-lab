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

### Browser interaction regression checks

Core controls, instruments and their animation loop initialize before the optional
3D module is dynamically imported. Missing aircraft dependencies, WebGL startup
failures and aircraft update exceptions are reported in the aircraft panel and
console without stopping the six-pack. All resources use relative paths beneath
`/aircraft-instrumentation-lab/`; the bundled `three.module.js` also imports
`./three.core.js`, which must be deployed alongside it.

`npm run test:browser` runs Chromium interaction checks from a plain Python static
server under the repository subdirectory. It exercises all six sliders, SVG
changes, shared-state readings, Reset, HUD/3D changes when available, and continued
animation with missing aircraft/Three.js modules, initialization/update exceptions
and WebGL disabled. It reports every console error and failed module request;
errors in deliberately broken scenarios are expected, while normal startup must
have none. These browser checks supplement `npm test`.

Playwright is optional development tooling. Install it outside the checkout to
avoid changing application dependencies or generating a repository lockfile:

```sh
npm install --prefix /tmp/aircraft-browser --cache /tmp/aircraft-npm-cache --no-audit --no-fund playwright
PLAYWRIGHT_MODULE=/tmp/aircraft-browser/node_modules/playwright/index.mjs \
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Use an installed Chromium executable via `CHROMIUM_PATH` if its location differs.
The browser runner starts and stops its own static server on an ephemeral port.

## Phase 2C — Educational Synchronization

Select an instrument to link its control rows, HUD values and existing 3D cues.
The shared mapping in `js/education.js` also supplies the concise **Linked flight
variables**, 3D representation, pilot meaning and relationship text.

| Instrument | Independent controls / HUD fields | 3D focus |
| --- | --- | --- |
| Airspeed Indicator | Airspeed / IAS | Relative-reference motion |
| Attitude Indicator | Pitch and Bank / PITCH and BANK | Aircraft attitude |
| Altimeter | Altitude / ALT | Compressed height, reference line and ground ring |
| Turn Coordinator | Bank / BANK | Aircraft bank / simplified turn tendency |
| Heading Indicator | Heading / HDG | Fixed compass and world grid |
| Vertical Speed Indicator | Vertical Speed / V/S | Climb/descent arrow and label |

**Teaching focus** starts on. Selected instruments retain their selection border;
linked controls and HUD fields use borders and heavier labels. Existing 3D cue
materials receive a subtle highlight and unrelated cues are slightly dimmed.
Unrelated instruments and controls remain visible and usable. Switching focus off
restores the full cockpit and normal cue appearance while keeping selection and
explanations. Keyboard users can select instruments with Enter/Space and toggle
focus with Space. Linked sliders and HUD fields reference the relationship text.

Reset restores all six variables and indications without clearing selection or
Teaching focus. Focus also works with the textual HUD when WebGL is unavailable.
All flight variables remain independently controlled: pitch does not set vertical
speed, bank does not change heading, and vertical speed does not change altitude.
Actual turn rate is not simulated; altitude remains compressed and reference
motion does not translate the aircraft. No new physical behavior is introduced.

`npm test` includes mapping and focus-state tests. `npm run test:browser` also
checks all six selections, linked controls/HUD/cues, slider changes, Reset,
Teaching focus on/off, keyboard input, fallback scenarios and desktop/tablet/mobile
layout (including a 320px viewport). Browser screenshots are written to `/tmp`.

## Phase 3A — Airspeed Indicator Internal Working View

Select **Airspeed Indicator**, then **Inside the Instrument** to open the cutaway
inside the lab. **Instrument Face**, **Internal Cutaway** and **How It Works**
share the existing Airspeed control. The six guided steps and numbered component
buttons highlight the pressure inlet, static region, capsule, linkage, lever/gear,
shaft, pointer and dial. Other instruments show a later-phase message. Teaching
Focus still links the ASI, Airspeed control and aircraft relative-motion cue.

The pressure model uses `q = ½ρV²` and `Pt − Ps ≈ q`, with a **fixed** sea-level
reference density of **1.225 kg/m³** and conversion **1 kt = 1852/3600 m/s**.
At 40, 110 and 180 kt it yields approximately **259, 1961 and 5252 Pa**.
These are simplified educational reference pressures, not exact aircraft air-data
values. Static pressure is a fixed reference; independently controlled altitude
never changes density or the calculated pressure. No compressibility, sensor
errors, failures or other instrument internals are included.

Capsule deflection is normalized as `q / q(180 kt)`, bounded over the existing
40–180 kt range: approximately **5%, 37% and 100% visual scale**. It moves the
capsule end by up to 32 SVG units and rotates a fixed-length conceptual lever
from −18° to +18°. The connecting link stays attached to the moving capsule end
and lever tip. These are **visual teaching mappings**, not calibrated mechanical
displacements or an exact manufacturing geometry. The case is shown open and the
front dial alongside it, so the transmission path is visible.

The nonlinear conversion from capsule/lever travel to dial rotation is conceptual:
there is no claim of an exact gear ratio. Both the pinion and cutaway pointer use
the existing `airspeedAngle` calibration, and the additional face uses the original
ASI renderer. All update from the same displayed application state, including
Reset; there is no second slider, independent state, or extra animation loop.
Reduced motion retains immediate positions, arrows, numeric readings and component
outlines. On narrow phones only the diagram scrolls horizontally to retain legible
number markers; labels and data remain stacked, with no page-level overflow.

The modular implementation lives in `js/internal/asi/`: `model.js` contains the
pure pressure calculation and documented visual mapping, `view.js` renders and
updates the SVG/learning views, and `content.js` holds component and step text.
`npm test` adds conversion, reference-pressure, monotonicity, bounded deflection,
rigid-lever geometry and shared pointer calibration checks. `npm run test:browser`
now also exercises 110/40/180 kt, tabs, component/step selection, keyboard access,
Teaching Focus, Reset, altitude independence, responsive layouts and both motion
preferences, including operation without WebGL. Phase 3A screenshots go to `/tmp`.

## Phase 3B — Altimeter Internal Working View

Select **Altimeter**, then **Inside the Instrument**. **Instrument Face**,
**Internal Cutaway** and **How It Works** use the existing Altitude control;
there is no additional control or independent instrument state. Six selectable
steps and nine keyboard-accessible component buttons trace static pressure into
sealed aneroid wafers, the capsule stack, linkage, lever, conceptual gear train,
concentric pointer shafts and the front dial. Other unimplemented instruments
retain their later-phase placeholder. ASI behavior and all Phase 1/2 features
remain available. Shared navigation in `js/internal/navigation.js` handles tabs,
Arrow/Home/End keys, component emphasis and moving one diagram between views.

**Physical model — altitude to static pressure.** The dry standard troposphere
uses `P = P₀ (1 − Lh/T₀)^(g/(R L))`, with height `h = altitude_ft × 0.3048` m,
`P₀ = 101325 Pa`, `T₀ = 288.15 K`, lapse rate `L = 0.0065 K/m`,
`g = 9.80665 m/s²` and specific gas constant `R = 287.05 J/(kg·K)`.
This hydrostatic/ideal-gas teaching relationship is limited to the existing
0–10,000 ft control range. Reference static pressures are **101.3 kPa at 0 ft**,
**84.3 kPa at 5,000 ft** and **69.7 kPa at 10,000 ft**. This model does not
change the ASI's fixed-density calculation or model pressure-setting effects.

**Educational visualization — pressure to capsule expansion.** Each aneroid
wafer is sealed and nearly evacuated: static pressure acts around it, not through
an inlet into it. Lower external pressure permits expansion; higher pressure
causes contraction. Expansion is bounded as
`(P₀ − P(h)) / (P₀ − P(10000 ft))`, giving **0%, about 54%, and 100% visual
scale** at 0, 5,000 and 10,000 ft. Zero visual scale still shows finite wafer
thickness; it does not mean an actual capsule has zero thickness.
**Capsule displacement shown is conceptual.** No real aneroid material law or
measured mechanical travel is claimed.

**Conceptual mechanism and pointer synchronization.** The stack moves its attached
link and pivoted lever; both retain fixed lengths in drawing units. A schematic
gear train and three output shafts illustrate the calibrated pointer rotations.
The long hundreds hand turns once per 1,000 ft, the short thousands hand once
per 10,000 ft, and the outlined ten-thousands marker once per 100,000 ft:
continuous angular ratios **100:10:1**. `altitudeAngles` from the cockpit
altimeter supplies the cutaway pointers and gear outputs; the face view uses the
original `createAltimeter` renderer. Gear sizes, spacing and transmission paths
are schematic and do not claim literal tooth ratios or certified geometry.
**Internal geometry and capsule displacement are simplified for teaching.**

The live measurement chain shows altitude, static pressure, capsule expansion,
mechanical conversion and indicated altitude. Reset restores the shared 3,500 ft
initial state while retaining instrument selection and view. Teaching Focus
links Altitude, ALT and the existing height cue. Reduced-motion users get the same
immediate indications; no animation loop is added. Narrow screens scroll only
the diagram; component explanations and readings remain stacked and readable.
The textual mechanism also works without WebGL.

Altitude remains independent of vertical speed, pitch, airspeed, bank and heading.
There is no flight dynamics or cross-instrument density coupling. Barometric
adjustment (QNH/QFE), blockage, lag, hysteresis, temperature correction, failures,
VSI internals and gyro internals remain outside this phase.

The module lives in `js/internal/altimeter/{model,view,content}.js`. `npm test`
covers reference pressures, monotonic pressure/expansion, bounded mappings,
rigid linkage geometry and synchronized pointer ratios. `npm run test:browser`
adds 0/5,000/10,000 ft checks, all three cockpit/face/cutaway pointers and gear
outputs, independent controls and unchanged ASI pressure, tabs, steps, component
keyboard use, Teaching Focus, Reset, desktop/tablet/390px/320px layouts, and both
motion preferences with normal WebGL and WebGL disabled. Screenshots are written
to `/tmp/phase3b-*.png`; normal startup must have no console or network errors.

## Phase 3C — Vertical Speed Indicator Internal Working View

Select **Vertical Speed Indicator**, then **Inside the Instrument**. The existing
shared navigation provides **Instrument Face**, **Internal Cutaway** and **How It
Works**, with seven teaching steps and nine keyboard-accessible component buttons.
Use the existing −2,000 to +2,000 ft/min Vertical Speed control; no new slider or
animation loop is introduced. Teaching Focus links the VSI, its control and the
existing vertical-speed aircraft cue. Reset clears the lag immediately while
retaining instrument selection, view and focus.

**Physical concept.** Static pressure reaches the diaphragm quickly through a
direct connection. The surrounding case receives pressure through a calibrated
leak / restriction and responds more slowly. In climb, decreasing diaphragm
pressure leaves the case at a higher pressure; in descent the difference reverses.
Higher case pressure contracts the diaphragm in climb; lower case pressure
permits expansion in descent. This motion drives a conceptual linkage and
pointer shaft. Sustained pressure change maintains a difference. When altitude
stops changing (represented here by setting Vertical Speed to zero), pressures
equalize and the pointer returns toward zero. The model does not integrate
vertical speed into aircraft altitude.

**Educational dynamic model.** The diaphragm follows ambient pressure immediately;
the case uses a first-order lag with **τ = 1.5 seconds**, chosen for a short teaching
interaction, **not a universal or certified VSI time constant**. Let `u = V/S / 2000`
and `d` be normalized case pressure minus diaphragm pressure. A conceptual ambient
pressure ramp has `dPambient/dt = −u/τ`; the case follows
`dPcase/dt = (Pambient − Pcase)/τ`. Eliminating their common pressure drift gives
`dd/dt = (u − d)/τ`, evaluated exactly for each animation timestep as
`dnext = u + (dprevious − u) exp(−dt/τ)`. This keeps the differential bounded within
±1 across the entire control range without inventing absolute pressure units.
At zero input, `dnext = dprevious exp(−dt/τ)`: displacement and indication decay
smoothly to neutral. Positive/negative inputs build symmetric climb/descent
responses and reversing input passes continuously through neutral.

**Visualization and shared indication.** Displacement is a normalized ±32 SVG
units; linkage geometry is conceptual. The pressure bars show the chamber
pressures relative to a shared moving midpoint reference (diaphragm `−d/2`, case
`+d/2`), not absolute static pressure. The indication is `2000 × d` ft/min and uses
`vsiAngle` from the existing cockpit renderer. Cockpit VSI, internal face and
cutaway pointer share this same lagged indication; the control and 3D/HUD retain
the independently selected input. The chain distinguishes input from output.
No altitude, pitch, airspeed, bank or heading input changes this lag state.

Reduced-motion mode immediately shows the settled differential, displacement and
pointer, with text describing the omitted transient and zero recovery. Setting
zero immediately equalizes its pressure bars. Normal mode shows the time-dependent
build-up and recovery. Only the diagram scrolls on small screens; teaching text
and buttons remain within the page.

**Pressure lag and displacement are simplified for teaching; actual VSI design
and calibration vary.** No certification delay values, hysteresis, failure modes,
blocked static systems, IVSI electronics, gyro internals or flight dynamics are
introduced. Implementation lives in `js/internal/vsi/{model,view,content}.js`.
`npm test` covers signs, monotonicity, bounds, timestep independence, ±1,000 ft/min
steps, zero recovery and shared calibration. `npm run test:browser` adds signed
response, recovery, synchronized pointers, Reset, variable independence, tabs,
steps/components, keyboard access, Teaching Focus, desktop/tablet/390px/320px
layouts, and both motion preferences with and without WebGL. Phase 3C screenshots
are written to `/tmp/phase3c-*.png`.

## Phase 3D — Gyroscopic Instruments Foundation

Select **Attitude Indicator**, **Heading Indicator** or **Turn Coordinator**, then
**Gyroscope Fundamentals**. This opens one shared lesson; the instrument-specific
internal mechanisms remain later-phase placeholders. **Gyro Assembly**, **Axis
View** and **Rigidity Demo** share the existing Pitch, Bank and Heading controls,
Reset and application animation loop. No flight-state sliders or dependencies
are added. Tabs support Arrow/Home/End keys; component and five teaching-step
buttons support keyboard activation. Text descriptions accompany the 3D view.

The gold rotor and spin shaft sit inside a white inner gimbal and blue outer
gimbal. A dashed aircraft-mounted instrument frame and labeled nose, right-wing
and up axes move around them. In the ideal rigidity demonstration the spin axis
stays pointed toward world north while body motion changes the relative bearing
angles. Ring radii are separated and bearing pins mark the support paths; geometry
is conceptual, with unlimited bearing travel and no mechanical stops. Rotor spin
is deliberately slow for visibility. Reduced motion freezes the rotor and shows a
static spin-direction indicator, while all control-driven orientations still update.

Coordinate conventions reuse `js/aircraft/orientation.js`: world **+X east, +Y up,
−Z north**; aircraft **−Z longitudinal/nose, +X lateral/right wing, +Y vertical/up**.
Intrinsic **YXZ** rotation maps negative heading, positive pitch and negative bank:
heading increases clockwise from north, nose-up raises the nose, right bank lowers
the right wing. `gyro/model.js` computes the inverse body transform of the fixed
north spin vector. An outer bearing about **body +Y** and inner bearing about
**outer-local +X** solve the relative pointing angles. Their composed transform
keeps the rotor's **−Z spin axis** fixed in world space across all control ranges.
This stabilizes an axis, not all three rotor-frame axes; roll about the spin axis
is not an attitude reference. The arrangement demonstrates a generic free-gyro
concept, not the particular axes or mechanisms of each real instrument.

`js/internal/gyro/` separates coordinate/state helpers (`model.js`), educational
text (`content.js`), accessible lesson navigation (`view.js`) and Three.js scene
rendering (`scene.js`). The optional renderer and model load only when the lesson
opens; failure leaves the cockpit, earlier cutaways and textual lesson usable.
The gyro module is reusable by future AI, HI and Turn Coordinator views; a turn
coordinator's rate sensing will require additional torque/precession concepts.
Teaching Focus highlights the shared panel when invoked from a gyro instrument,
while retaining each instrument's existing control/HUD/cue relationships.

**Gyroscope behavior is shown conceptually; detailed torque and precession dynamics
are introduced later.** No rotational dynamics, erection systems, vacuum behavior,
drift, failures or instrument-specific indications are implemented.

`npm test` adds gyro normalization, aviation sign mappings, all 45 combinations of
pitch −20/0/+20°, bank −45/0/+45° and heading 0/90/180/270/359°, inverse-reference
transforms and reduced-motion spin tests. `npm run test:browser` retains all prior
ASI/Altimeter/VSI checks and adds the shared gyro lesson: actual rendered stable
spin axes, moving body frame, three modes, keyboard/component/step navigation,
Teaching Focus, Reset, desktop/tablet/390px/320px layout and both motion preferences
with normal WebGL and WebGL disabled. Screenshots go to `/tmp/phase3d-*.png`.
