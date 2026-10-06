import {mount,scale,text,needle,hub,rotate} from './svg.js';
export const vsiAngle=v=>-90+v/2000*165;
export function createVSI(el){const part=mount(el,scale(-2000,2000,100,vsiAngle,5,v=>Math.abs(v/1000))+text(111,80,'VERTICAL SPEED',8)+text(113,94,'1000 FT / MIN',7)+text(100,64,'UP',8)+text(100,138,'DOWN',8)+needle('pointer',66,3)+hub);return s=>rotate(part('pointer'),vsiAngle(s.verticalSpeed))}
