import {systemState} from '../../measurement/pitot-static/model.js';
import {dynamicPressure} from '../../internal/asi/model.js';
import {staticPressure} from '../../internal/altimeter/model.js';

export const definitions=Object.freeze({
  normal:{title:'Normal',signal:null,elements:[],affected:[]},
  'blocked-pitot':{title:'Blocked Pitot — trapped total pressure',signal:'Pt',elements:['pitot-tube','pitot-line','total-pressure'],affected:['airspeed']},
  'blocked-static':{title:'Blocked Static — trapped static pressure',signal:'Ps',elements:['static-port','static-line','static-pressure'],affected:['airspeed','altimeter','vsi']},
  'pitot-leak':{title:'Pitot Leak — to static / ambient pressure',signal:'Pt',elements:['pitot-line','total-pressure'],affected:['airspeed']}
});
// Shared chain IDs come from the Phase 4C measurement metadata, while source
// component IDs are the existing Phase 4A topology. Later fault families can
// attach at the same transmission/source-reference layers.
export const chainAttachments=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id,definition])=>[id,Object.freeze(definition.affected.map(instrument=>Object.freeze({instrument,element:'transmission',signal:definition.signal,components:Object.freeze([...definition.elements])})))])));
export const initialFault=()=>({type:'normal',active:false,severity:0.5,snapshot:null,event:0});
export function activateFault(fault,type,state) {
  if(!definitions[type])throw new RangeError('Unknown pitot-static fault');
  if(type==='normal')return {...initialFault(),event:fault.event};
  const physical=systemState(state,{differential:0});
  return {...fault,type,active:true,event:fault.event+1,snapshot:Object.freeze({event:fault.event+1,airspeed:physical.airspeed,altitude:physical.altitude,ps:physical.ps,pt:physical.pt})};
}
export function clearFault(fault) {return {...initialFault(),event:fault.event};}
export function setSeverity(fault,value) {return {...fault,severity:Math.max(0,Math.min(1,Number.isFinite(value)?value:0.5))};}
// Invert the existing bounded atmospheric calibration, rather than fork its physics.
export function altitudeFromPressure(pressure) {
  let low=0,high=10000;
  for(let i=0;i<48;i++){const mid=(low+high)/2;if(staticPressure(mid)>pressure)low=mid;else high=mid;}
  return (low+high)/2;
}
export function transform(state,fault=initialFault(),lag={differential:0}) {
  const physical=systemState(state,lag);
  const type=fault.active?fault.type:'normal';
  let pt=physical.pt,ps=physical.ps;
  if(type==='blocked-pitot')pt=fault.snapshot.pt;
  if(type==='blocked-static')ps=fault.snapshot.ps;
  if(type==='pitot-leak')pt=physical.ps+(1-fault.severity)*physical.q;
  const q=pt-ps;
  // The existing fixed-density pressure calibration is quadratic. Its inverse
  // feeds the existing cockpit renderer, including its 0–200 kt dial.
  const airspeed=type==='normal'?state.airspeed:Math.sqrt(Math.max(0,q)/dynamicPressure(1));
  const altitude=type==='blocked-static'?altitudeFromPressure(ps):state.altitude;
  const verticalSpeed=type==='blocked-static'?0:state.verticalSpeed;
  return {physical,effective:{asiPt:pt,asiPs:ps,altimeterPs:ps,vsiPs:ps,q},
    state:{...state,airspeed:type==='normal'?state.airspeed:Math.min(200,airspeed),altitude,verticalSpeed},
    inferredAirspeed:airspeed,scaleNote:q<0?'Negative differential: no positive airspeed inference; pointer held at zero.':airspeed>200?'Above the 200 kt teaching dial; pointer held at scale limit.':'',type};
}
export function status(type,instrument) {
  if(!definitions[type].affected.includes(instrument))return ['HEALTHY','Live pressure input remains connected.'];
  if(type==='pitot-leak')return ['DEGRADED','Delivered total pressure moves toward current static pressure.'];
  if(type==='blocked-pitot')return ['AFFECTED','Trapped Pt against live Ps; not a frozen pointer.'];
  return ['FROZEN INPUT',instrument==='airspeed'?'Live Pt against trapped Ps; indication is not necessarily frozen.':instrument==='altimeter'?'Static input is trapped; indication stays near activation altitude.':'No continuing ambient static-pressure change reaches the VSI; existing lag settles toward zero.'];
}
