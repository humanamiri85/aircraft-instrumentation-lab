import {mount,scale,arc,text,needle,hub,rotate} from './svg.js';
export const airspeedAngle=v=>-140+(v-40)*280/140;
export function createAirspeed(el){const part=mount(el,arc(airspeedAngle(45),airspeedAngle(95),83,'#e9eae2',3)+arc(airspeedAngle(55),airspeedAngle(130),87,'#66a77d',4)+arc(airspeedAngle(130),airspeedAngle(175),87,'#d9b862',4)+arc(airspeedAngle(175),airspeedAngle(180),87,'#c65c50',4)+scale(40,180,5,airspeedAngle,4)+text(100,128,'AIRSPEED',10)+text(100,141,'KNOTS',8)+needle('pointer')+hub);return s=>rotate(part('pointer'),airspeedAngle(s.airspeed))}
