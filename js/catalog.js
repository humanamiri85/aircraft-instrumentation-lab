import {createAirspeed} from './instruments/airspeed.js';
import {createAttitude} from './instruments/attitude.js';
import {createAltimeter} from './instruments/altimeter.js';
import {createTurn} from './instruments/turn.js';
import {createHeading} from './instruments/heading.js';
import {createVSI} from './instruments/vsi.js';
const n=v=>Math.round(v).toLocaleString('en-US');
export const instruments=[
 {id:'airspeed',name:'Airspeed Indicator',abbr:'ASI',quantity:'Indicated airspeed',unit:'Knots (kt)',explanation:'The pilot uses indicated airspeed to manage takeoff, climb, approach, and aircraft speed limits.',note:'Colored arcs are illustrative; actual limits depend on the aircraft.',create:createAirspeed,read:s=>`${n(s.airspeed)} kt`},
 {id:'attitude',name:'Attitude Indicator',abbr:'AI',quantity:'Pitch and bank',unit:'Degrees (°)',explanation:'The artificial horizon shows the aircraft’s orientation relative to the horizon. The pilot uses it to maintain or change pitch and bank, especially when outside visibility is limited.',create:createAttitude,read:s=>`${n(s.pitch)}° pitch / ${n(s.bank)}° bank`},
 {id:'altimeter',name:'Altimeter',abbr:'ALT',quantity:'Indicated altitude',unit:'Feet (ft)',explanation:'The pilot uses altitude to maintain assigned levels and terrain clearance. The long hand shows hundreds of feet, the short hand thousands, and the thin hand tens of thousands.',note:'Direct altitude input; pressure setting is fixed for this phase.',create:createAltimeter,read:s=>`${n(s.altitude)} ft`},
 {id:'turn',name:'Turn Coordinator',abbr:'TC',quantity:'Turn tendency',unit:'Qualitative left / right',explanation:'In an aircraft, the miniature airplane indicates turn rate, and the ball indicates slip or skid. Pilots use them to establish and coordinate turns.',note:'Here, bank drives a simplified turn indication. The ball stays centered; turn rate and coordination are not modeled.',create:createTurn,read:s=>Math.abs(s.bank)<.5?'Wings level':`${s.bank<0?'Left':'Right'} turn tendency`},
 {id:'heading',name:'Heading Indicator',abbr:'HI',quantity:'Aircraft heading',unit:'Degrees (°)',explanation:'The pilot reads the heading under the fixed top index to maintain direction or roll out of a turn on a selected heading. North is 000°, east 090°, south 180°, and west 270°.',create:createHeading,read:s=>`${String(Math.round(s.heading)%360).padStart(3,'0')}°`},
 {id:'vsi',name:'Vertical Speed Indicator',abbr:'VSI',quantity:'Rate of climb or descent',unit:'Feet per minute (ft/min)',explanation:'The pilot uses vertical speed to monitor climbs, descents, and level flight. Positive values indicate a climb; negative values indicate a descent.',create:createVSI,read:s=>`${s.verticalSpeed>0?'+':''}${n(s.verticalSpeed)} ft/min`}];
