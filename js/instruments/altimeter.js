import {mount,scale,text,needle,hub,rotate} from './svg.js';
export const altitudeAngles=v=>({hundreds:v/1000*360,thousands:v/10000*360,tenThousands:v/100000*360});
export function createAltimeter(el){const part=mount(el,scale(0,49,1,v=>v/50*360,5,v=>v/5)+text(100,65,'ALT',11)+text(100,143,'FEET',9)+`<rect x="127" y="91" width="34" height="19" fill="#20272a" stroke="#747c7d"/>`+text(144,104,'29.92',8)+needle('tenThousands',73,1.5)+needle('thousands',43,5)+needle('hundreds',68,3)+hub);return s=>{const a=altitudeAngles(s.altitude);for(const key of Object.keys(a))rotate(part(key),a[key])}}
