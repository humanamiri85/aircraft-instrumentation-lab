import {createAirspeed} from './instruments/airspeed.js';
import {createAttitude} from './instruments/attitude.js';
import {createAltimeter} from './instruments/altimeter.js';
import {createTurn} from './instruments/turn.js';
import {createHeading} from './instruments/heading.js';
import {createVSI} from './instruments/vsi.js';
const n = value => Math.round(value).toLocaleString('en-US');

export const instruments = [
  {
    id: 'airspeed', name: 'Airspeed Indicator', abbr: 'ASI',
    quantity: 'Indicated airspeed', unit: 'Knots (kt)',
    interpretation: 'Use airspeed to manage takeoff, climb and approach speeds.',
    note: 'Generic teaching limits: white 45–95 kt (flap range), green 55–130 kt (normal), yellow 130–175 kt (caution); red line 175 kt (never exceed). Not specifications for a certified aircraft.',
    create: createAirspeed, read: state => `${n(state.airspeed)} kt`
  },
  {
    id: 'attitude', name: 'Attitude Indicator', abbr: 'AI',
    quantity: 'Pitch and bank', unit: 'Degrees (°)',
    interpretation: 'Read the fixed aircraft against the horizon: blue below its nose means nose up; a horizon rising to the right means right bank.',
    note: 'Pitch marks are spaced at 5° / 10°; bank references are at 10°, 20°, 30°, 45° and 60° on each side.',
    create: createAttitude, read: state => `${n(state.pitch)}° pitch / ${n(state.bank)}° bank`
  },
  {
    id: 'altimeter', name: 'Altimeter', abbr: 'ALT',
    quantity: 'Indicated altitude', unit: 'Feet (ft)',
    interpretation: 'Combine the long hundreds hand, short thousands hand and gold ten-thousands marker to read altitude.',
    note: 'One revolution equals 1,000 / 10,000 / 100,000 ft respectively. Pressure setting stays fixed at 29.92 inHg; altitude is controlled directly.',
    create: createAltimeter, read: state => `${n(state.altitude)} ft`
  },
  {
    id: 'turn', name: 'Turn Coordinator', abbr: 'TC',
    quantity: 'Turn tendency (bank-linked demo)', unit: 'Qualitative left / right',
    interpretation: 'A dropped right wing indicates a right turn tendency; a dropped left wing indicates left. The ball is normally used to check coordination.',
    note: 'Standard-rate reference marks illustrate a two-minute turn. Bank input only tilts the airplane here; turn rate is not calculated. The slip/skid ball stays centered in Phase 1B.',
    create: createTurn, read: state => Math.abs(state.bank) < 0.5 ? 'Wings level' : `${state.bank < 0 ? 'Left' : 'Right'} turn tendency`
  },
  {
    id: 'heading', name: 'Heading Indicator', abbr: 'HI',
    quantity: 'Aircraft heading', unit: 'Degrees (°)',
    interpretation: 'Read the rotating compass card under the fixed gold lubber line to hold a heading.',
    note: 'N 000° · E 090° · S 180° · W 270°. Numbered marks are tens of degrees; small marks are every 10°.',
    create: createHeading, read: state => `${String(Math.round(state.heading) % 360).padStart(3, '0')}°`
  },
  {
    id: 'vsi', name: 'Vertical Speed Indicator', abbr: 'VSI',
    quantity: 'Rate of climb or descent', unit: 'Feet per minute (ft/min)',
    interpretation: 'Above the left-hand zero means climb; below means descent. Multiply the dial number by 1,000 ft/min.',
    note: 'Range ±2,000 ft/min. Vertical speed does not integrate altitude in this phase.',
    create: createVSI, read: state => `${state.verticalSpeed > 0 ? '+' : ''}${n(state.verticalSpeed)} ft/min`
  }
];
