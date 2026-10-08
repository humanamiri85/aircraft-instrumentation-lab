# Aircraft Instrumentation Lab — Phase 4B

Interactive six-pack instrument learning page for undergraduate Measurement & Instrumentation. Plain HTML, CSS, JavaScript and dynamic SVG; no runtime dependencies.

## Run

Run `npm start` (requires Python 3), then open http://localhost:8000. ES modules require an HTTP server rather than opening the HTML file directly.

Run `npm run check` for application syntax checks and `npm test` for instrument directions, pointer ratios, control limits and heading wraparound. Tests use Node's built-in runner; no package installation is needed.

Development follows the [autonomous feature-branch workflow](docs/autonomous-development.md): Codex validates and pushes a feature branch; GitHub Actions creates its PR, runs CI and requests squash auto-merge subject to repository requirements.

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

## Phase 3E — Attitude Indicator Internal Working View

Select **Attitude Indicator**, then **Inside the Instrument**. **Instrument Face**,
**Internal Cutaway** and **How It Works** use the shared ASI/Altimeter/VSI navigation.
Seven selectable steps and nine keyboard-accessible component buttons explain the
rotor, spin axis, gimbals, case, horizon, aircraft symbol, bank scale and pitch ladder.
The separate **Gyroscope Fundamentals** button retains the complete Phase 3D lesson.
Heading Indicator and Turn Coordinator internals remain later-phase placeholders.

The physical concept is rigidity in space: the aircraft-mounted case moves around
a stabilized gyro reference, and their relative orientation drives the horizon.
This lesson uses an **ideal vertical reference**. Phase 3D's north-pointing spin axis
stabilizes one axis and cannot by itself stabilize roll; it is not relabeled as a
complete attitude reference. Shared gyro helpers in `js/internal/gyro/` provide the
slow rotor cue, vertical-reference calculation and labeled SVG assembly. The existing
aviation YXZ convention is reused; model tests independently check the relative
vertical axis using Phase 3D's `bodyQuaternion`. No separate controls, animation loop,
Three.js copy or dependency is introduced. The Phase 3D scene and lesson remain intact.

The cutaway separates a **side pitch projection** (nose points right) and a **front
bank projection** (aircraft right wing is on diagram right). Positive pitch rotates
the dashed case nose-up around the fixed gold axis; positive bank lowers the case's
right wing. The outer ring moves with the case while the inner reference remains
stabilized. Both projections respond simultaneously for combined attitudes. Rotor
disks are drawn face-on so their slow spokes remain visible; the gold shaft denotes
the vertical spin axis. These are schematic projections, not a literal bearing layout.

A labeled conceptual gimbal pickoff / display linkage connects the stabilized
reference to a combined dial viewed from the moving case. The cutaway display and
Instrument Face both use the original cockpit `createAttitude` renderer and its
`attitudeTransform`: pitch offset = pitch × 1.8 drawing units; horizon roll = −bank.
Nose-up lowers the horizon, nose-down raises it, and right bank rotates it
counterclockwise beneath the fixed aircraft symbol. Pitch ladder and roll index
follow the horizon; bank marks and aircraft symbol belong to the case. The live
attitude chain reports input, stabilized reference, relative motion and indication.
Changing heading, altitude, airspeed or vertical speed does not change this attitude
indication or relative vertical reference. Reset restores pitch/bank without clearing
selection, learning mode or Teaching Focus.

**Gyro stabilization and internal geometry are simplified for teaching; real
instruments include additional erection, damping, and drive systems.** No vacuum,
electric drive, erection vanes, drift, topple limits, acceleration errors, precession
or instrument failure behavior is modeled. SVG supports the whole lesson without
WebGL. Reduced motion freezes rotor spokes and adds a spin-direction explanation;
case motion and indication still follow slider changes immediately. Only the diagram
scrolls on narrow screens. Tabs support Arrow/Home/End keys; components and steps
use standard keyboard-accessible buttons. Labels distinguish aircraft-fixed parts
from stabilized parts independently of color.

Implementation: `js/internal/attitude/{model,view,content}.js`. `npm test` checks
−20/0/+20° pitch, −45/0/+45° bank, +10°/+30° and −10°/−30° combinations, shared
cockpit calibration, normalized/stable reference, heading independence and shared
reduced-motion behavior. `npm run test:browser` retains earlier regressions and
checks ±15° pitch, ±30° bank, combined attitudes, all three views, component/step
highlighting, keyboard navigation, Teaching Focus, Reset, desktop/tablet/390px/320px
layouts, normal/reduced motion and WebGL-disabled operation. Screenshots are saved
to `/tmp/phase3e-*.png`; normal startup must have no console or network errors.


## Phase 3F — Heading Indicator Internal Working View

Select **Heading Indicator**, then **Inside the Instrument**. **Instrument Face**,
**Internal Cutaway** and **How It Works** use the shared internal navigation.
The separate **Gyroscope Fundamentals** lesson remains available. Six selectable
steps and nine component buttons connect rotor, spin axis, gimbals, case,
directional reference, card drive, compass card and fixed lubber line.

Directional rigidity supplies the physical concept: the aircraft case turns
clockwise around an ideal stabilized azimuth reference. A world-view yaw projection
shows the dashed aircraft-fixed case/nose rotating around the solid gold north
axis. A conceptual pickoff/gear transmits relative yaw to the compass card in a
separate case-fixed view. The card counter-rotates beneath the fixed gold lubber
line; N/E/S/W appear at the top for 000/090/180/270°. The live chain reports input,
stabilized reference, relative motion and displayed heading.

`js/internal/heading/{model,view,content}.js` reuses the shared gyro
reference module, `advanceSpin` and `gyroAssembly`. Its dependency-free
`directionalReference` yaw projection is cross-checked against Phase 3D's
`gyroState` and avoids making the SVG lesson depend on optional Three.js loading. The reference is initially
aligned to north; pitch/bank bearing motion is omitted from this teaching
projection. Pitch, bank and other controls never change heading indication.
Both internal faces use the existing cockpit `createHeading` renderer and
`headingCardAngle`, so compass scale and lubber geometry have one implementation.
The aircraft, cockpit and lesson consume the same application heading state.

Shared `wrapHeading` and `headingDelta` retain continuous case/gear angles across
358/359/000/001/002° in either direction. Card transforms use the cockpit's
normalized angle without CSS rotation interpolation; equivalent transforms at
north do not animate a full turn. Existing time-based heading smoothing retains
its shortest path. No separate heading slider or animation loop is introduced.
Reduced motion freezes the slow rotor cue while all heading-controlled parts
still update. SVG supports the complete lesson without WebGL. Tabs support
Arrow/Home/End keys, component/step buttons support keyboard input, and only the
diagram scrolls at narrow widths. Labels identify fixed versus stabilized parts
independently of color.

Gyro and card-drive geometry are simplified for teaching. Real heading indicators
require periodic realignment because of drift and Earth-rate effects. The rotor
disk is drawn face-on for visibility despite the horizontal axis in the yaw view;
bearings and gear are schematic, not a certified mechanism. No drift, Earth-rate
simulation, transport wander, magnetic synchronization, heading bug, slaving,
vacuum behavior, failures or Turn Coordinator internals are implemented.

`npm test` adds cardinal/359° calibration, stable gyro reference, north crossings
in both directions, shared smoothing and pitch/bank independence. The existing
`npm run test:browser` suite retains Phase 1–3E regressions and adds actual SVG
cardinal alignment, synchronized readings, wraparound, tabs, keyboard/components,
steps, Teaching Focus, Reset, desktop/tablet/390px/320px layouts, motion preferences
and WebGL-disabled operation. Screenshots go to `/tmp/phase3f-*.png`; normal startup
must have no console or network errors.

## Phase 3G — Turn Coordinator Internal Working View

Select **Turn Coordinator**, then **Inside the Instrument**. **Instrument Face**,
**Internal Cutaway** and **How It Works** reuse the shared internal navigation.
Seven selectable steps and ten component buttons explain a **restrained rate
gyro**, conceptual precession, the restoring spring and airplane-symbol output.
The Phase 3D Gyroscope Fundamentals lesson remains available separately.

A real Turn Coordinator responds to **angular rate**, with roll and yaw sensitivity
from a canted gyro, rather than measuring bank angle or holding an orientation
reference. In this teaching model, **Bank is a proxy for turn-rate input**; no new
slider, yaw-rate state or flight dynamics are added. Bank never integrates Heading,
and Heading, Pitch, Airspeed, Altitude and V/S do not drive this lesson.

`js/internal/turn/model.js` maps bounded Bank ±45° to a normalized proxy ±1,
conceptual gimbal deflection ±18° and normalized spring load 0–1. These are visual
units, not certified internal angles or physical forces. The quasi-static mapping
shows equilibrium: positive proxy deflects right, negative proxy left, and zero
restores the centered mechanism and unloaded spring. No damping time constant,
angular-momentum equations or transient rate response is claimed.

The cutaway distinguishes the dashed aircraft-fixed case, moving rotor / single
restrained gimbal and zigzag restoring spring. The spring end and output pickoff
follow the rotating gimbal attachment. Separate input, spin and permitted
out-of-diagram deflection-axis labels introduce **precession about a different
axis** conceptually; the drawing is a schematic projection, not a literal bearing
layout. Shared gyro motion and component styles provide the slow rotor cue and
reduced-motion static spin indication; the free-gyro world-stabilized transform is
not used. Detailed torque and angular-momentum dynamics are beyond this phase.

Both internal displays reuse `createTurn` and its existing `turnAngle` mapping, so
the cockpit and internal airplane symbols agree. The existing **2 MIN** and left /
right standard-rate reference marks remain. Their alignment at ±30° Bank is only
a simplified teaching mapping; Bank alone does not determine real standard rate.
A future turn-rate flight model can replace the proxy without changing the lesson
navigation or display calibration.

The **ball / inclinometer is a separate subsystem**, drawn in its own curved tube
with no connection to the gyro linkage. Gravity and lateral acceleration govern
real displacement: centered means coordinated and displaced means slip/skid.
This phase has no lateral-acceleration model, so the ball stays centered; no fake
slip/skid motion is introduced.

`npm test` adds sign, bounds, symmetry, monotonicity, neutral return, shared symbol
calibration and independence tests at −45/−20/0/+20/+45° Bank. `npm run test:browser`
retains previous lessons and adds signed gimbal/spring/symbol behavior, neutral
return, separate fixed ball, all three modes, components/steps, keyboard access,
Teaching Focus, Reset, desktop/tablet/390px/320px layouts, both motion preferences
and WebGL-disabled operation. Screenshots go to `/tmp/phase3g-*.png`.


## Phase 3H — Internal View Consolidation

Phase 3 now provides internal working views for all six classic instruments:

- **Pitot-static:** Airspeed Indicator, Altimeter and Vertical Speed Indicator.
- **Gyroscopic:** Attitude Indicator, Heading Indicator and Turn Coordinator.

Each lesson uses **Instrument Face → Internal Cutaway → How It Works**, with
shared keyboard tabs, numbered component buttons, guided steps and a live
indication chain. The visualization and chain precede the component explanations
in the reading order. Physical principles, educational models and conceptual
geometry remain distinct; instrument-specific models and calibrated cockpit
renderers are unchanged. The Turn Coordinator continues to use Bank as a proxy,
and the VSI retains its shared dynamic pressure lag and Reset behavior.

`js/internal/navigation.js` owns common markup and interactions.
`js/internal/controller.js` loads each optional lesson independently and isolates
initialization/update failures so the cockpit and other lessons remain usable.
Hidden lessons stop DOM/rotor updates and refresh from shared flight state on
selection; the shared application animation loop remains the only frame loop.
Gyroscope Fundamentals remains a separate foundation with its own three modes
and retained optional 3D scene.

`npm run test:browser` retains Phase 1–3G coverage and adds sequential visits to
all six lessons at 1440, 1024, 768, 390 and 320 px, both motion preferences,
keyboard tabs/components/steps, screen-reader relationships, Teaching Focus,
Reset and WebGL fallback. Missing-lesson and renderer-exception scenarios verify
failure isolation. Shared browser control helpers reduce repeated dispatch code
without removing instrument-specific scientific assertions. Normal startup must
have zero console errors or failed local resources; injected errors are expected
only in the deliberate failure scenarios.

Phase 4 will extend internal mechanisms toward complete measurement chains and
sensing/transmission systems. Current geometry and displacement remain teaching
visualizations, with no manufacturer geometry, certified mechanical travel,
failures, drift, noise, calibration effects or flight dynamics implied.

## Phase 4A — Pitot-Static Measurement Chain Foundation

Select Airspeed Indicator, Altimeter or Vertical Speed Indicator, open **Inside
the Instrument**, then select the fourth tab, **Measurement Chain**. The existing
Instrument Face, Internal Cutaway and How It Works lessons remain available;
gyroscopic instruments retain their three modes.

The reusable SVG system shows atmosphere / free stream → pitot tube and static
port → separate pressure transmission lines → instrument inputs → sensing and
mechanical conversion → cockpit indication. Teaching Focus emphasizes the selected
instrument's paths while retaining the other branches. Six guided steps and ten
keyboard-accessible component explanations connect the external sources to the
existing internal cutaways. Solid total-pressure and dashed static-pressure lines,
text labels and directional cues keep routing understandable without color or
animation. Narrow screens use a vertical topology with readable labels.

The ASI receives **Pt inside its diaphragm and Ps around it in the case**. The
Altimeter receives **Ps only**, surrounding a sealed aneroid stack; altitude is
inferred from static pressure, not directly sensed. The VSI receives **Ps only**;
its calibrated leak and delayed case pressure remain internal. Neither the
Altimeter nor VSI has a pitot connection.

`js/measurement/pitot-static/{model,view,content}.js` reuses the Phase 3 ASI's knot
conversion / fixed representative density / dynamic pressure, the Altimeter's
standard-atmosphere static pressure, and the VSI's existing shared lag state.
No scientific model was forked or changed. **Pt = Ps + q**, **q = ½ρV²** with fixed
ρ = 1.225 kg/m³, and altitude-dependent Ps are reference pressure values, not
certified aircraft air data. Airspeed changes q and Pt; altitude changes Ps and Pt
without changing q. Vertical speed controls the independent normalized pressure
trend / lag lesson; it never integrates altitude or changes absolute Ps. The live
system panel distinguishes vertical-speed input from the lagged cockpit indication.

Pressure paths, geometry and port locations are conceptual teaching mappings.
Pulses represent **pressure signal transmission**, not continuous bulk airflow
through plumbing. Reduced motion removes pulses and reuses the existing settled
lag behavior. Local fuselage pressure coefficients, compressibility, position
error, blockages, leaks, icing, alternate static sources, noise, calibration error,
uncertainty, failures, pressure transducers and air-data computers await later phases.

The fourth tab loads independently on first use. Missing dependencies or renderer
errors produce a status message in that tab while the cockpit, controls and Phase 3
lessons remain usable. `npm test` verifies pressure identities over 40/110/180 kt,
0/5000/10000 ft and −1000/0/+1000 ft/min, routing, trend signs, lag reuse and
independence. `npm run test:browser` retains all prior scenarios and adds sequential
visits across the three measurement chains, four-mode keyboard navigation, live
values, Teaching Focus, Reset, all five widths (1440/1024/768/390/320), both motion
preferences, WebGL fallback and independent measurement load/init/update failures.
Screenshots are written to `/tmp/phase4a-*.png`.


## Phase 4B — Gyroscopic Measurement Chain

All six instruments now share four learning modes: Instrument Face, Internal
Cutaway, How It Works and Measurement Chain. The gyro family uses one reusable
system topology with selected-instrument Teaching Focus and five guided steps:

- **AI:** pitch / bank → ideal stabilized **vertical** reference → relative case
  motion → gimbal / display linkage → horizon and aircraft-symbol indication.
- **HI:** heading / yaw → ideal **directional** reference → relative case rotation
  → compass-card drive → heading beneath a fixed lubber line. Shortest-angle
  handling preserves both north crossings; pitch and bank do not change heading.
- **TC:** real angular-rate input → restrained rate gyro → precession tendency
  → spring-restraint equilibrium → turn indication. **Bank is only the app's
  teaching proxy, not the measurand or an angular rate.** No dimensional rate is
  inferred. The inclinometer remains a separate, centered subsystem; no slip/skid
  dynamics are simulated.

`js/measurement/gyro/{model,content,view}.js` separates read-only educational
state, chain explanations and rendering. The family adapter reuses the Phase
3E–3G mechanism states, Phase 3 gyro reference / shortest-angle helpers and shared
SVG assembly, plus existing cockpit renderers; calculations are not forked.
A restrained assembly option omits the free outer gimbal, preserving the original
assembly by default. The lazy chain extension shares Phase 3H / Phase 4A navigation
and isolates import, initialization and update failures from the cockpit,
pitot-static chains and original internal lessons.

Physical principles (rigidity, angular momentum and precession), educational
models (ideal references or bounded quasi-static proxy response) and visual
mappings are identified separately. Geometry is conceptual, not
manufacturer-specific hardware. Static spin-direction cues and live orientations
carry the same information with reduced motion. Controls stay independent;
heading and attitude are never integrated from Bank or angular rates.

Validation covers both reference types, AI signs, HI 359° ↔ 0° wrap, TC bounded
signed response / centered ball, sequential chain navigation, component and step
keyboard controls, Teaching Focus, Reset, five viewport widths (1440, 1024, 768,
390, 320), both motion preferences, WebGL fallback and gyro-chain failure cases.
Run `npm run check`, `npm test`, and the full `npm run test:browser` suite using
the existing browser-tooling setup.

Phase 4C can compare the independent pitot-static and gyroscopic family adapters;
no comparison feature is implemented yet. Drift, friction, drive / electrical
failures, erection systems, Earth-rate / transport / latitude effects, magnetic
slaving, caging, precession-error dynamics, calibrated real angular rates,
coordinated-flight / slip-skid physics, noise, calibration and modern AHRS / MEMS
systems remain outside this phase and belong to later work.
