// Pure state and indication smoothing; no DOM dependencies. Future sensor models
// can provide indications through this boundary without changing the controls.
export const variables=[
 {key:'airspeed',label:'Airspeed',min:40,max:180,step:1,unit:'kt',initial:110},
 {key:'altitude',label:'Altitude',min:0,max:10000,step:50,unit:'ft',initial:3500},
 {key:'verticalSpeed',label:'Vertical speed',min:-2000,max:2000,step:50,unit:'ft/min',initial:0},
 {key:'pitch',label:'Pitch',min:-20,max:20,step:1,unit:'°',initial:0},
 {key:'bank',label:'Bank angle',min:-45,max:45,step:1,unit:'°',initial:0},
 {key:'heading',label:'Heading',min:0,max:359,step:1,unit:'°',initial:270}];
export const initialState=()=>Object.fromEntries(variables.map(v=>[v.key,v.initial]));
export function setVariable(state,key,value){const spec=variables.find(v=>v.key===key);if(!spec||!Number.isFinite(value))return;state[key]=Math.max(spec.min,Math.min(spec.max,value))}
export function smoothState(current,target,dt,reducedMotion=false){const alpha=reducedMotion?1:1-Math.exp(-Math.min(dt,.1)*12);for(const key of Object.keys(target)){let delta=target[key]-current[key];if(key==='heading')delta=((delta+540)%360)-180;current[key]+=delta*alpha;if(Math.abs(delta)<.01)current[key]=target[key];if(key==='heading')current[key]=(current[key]+360)%360}return current}
