import {systemState,referenceTypes} from '../../measurement/gyro/model.js';
import {continuousHeading} from '../../internal/heading/model.js';
import {clamp,wrapHeading} from '../../math.js';
export const definitions=Object.freeze({
 normal:{id:'normal',title:'Normal',instruments:['attitude','heading','turn'],affectedChainElement:null,faultCategory:'healthy',symptomPattern:'Healthy reference / response',diagnosticClues:'Normal reference-based or rate-proxy mapping.'},
 drive:{id:'drive',title:'Drive Loss / Educational Spin-Down',instruments:['attitude','heading','turn'],affectedChainElement:'source-reference',faultCategory:'drive-loss',symptomPattern:'Progressive loss of reference hold or gyro response',diagnosticClues:'Effectiveness falls after drive loss; no particular aircraft supply architecture is assumed.'},
 drift:{id:'drift',title:'Directional Gyro Drift',instruments:['heading'],affectedChainElement:'source-reference',faultCategory:'reference-drift',symptomPattern:'Smooth heading response with growing error',diagnosticClues:'A plausible-looking indication can still be wrong.'},
 bias:{id:'bias',title:'Vertical Reference Degradation',instruments:['attitude'],affectedChainElement:'source-reference',faultCategory:'reference-bias',symptomPattern:'Responsive attitude indication with persistent offset',diagnosticClues:'Systematic reference error differs from complete drive loss.'},
 effectiveness:{id:'effectiveness',title:'Reduced Gyro Effectiveness',instruments:['turn'],affectedChainElement:'sensing-element',faultCategory:'reduced-response',symptomPattern:'Smaller turn indication; separate ball unchanged',diagnosticClues:'Rate-gyro response is degraded; Bank is only the app proxy.'}
});
export const initialParameters=()=>({decaySeconds:15,driftRate:3,pitchBias:3,bankBias:5,effectiveness:.5});
export const initialFault=()=>({type:'normal',elapsed:0,lossExponent:0,error:0,effectiveness:1,snapshot:null,parameters:initialParameters(),event:0,unwrappedHeading:0});
export function parameters(values={}) {
 const defaults=initialParameters(),limits={decaySeconds:[2,60],driftRate:[-12,12],pitchBias:[-5,5],bankBias:[-10,10],effectiveness:[0,1]};
 return Object.fromEntries(Object.entries(limits).map(([key,[min,max]])=>[key,clamp(Number.isFinite(values[key])?values[key]:defaults[key],min,max)]));
}
export function activate(fault,instrument,type,state,values=fault.parameters) {
 if(!definitions[type]?.instruments.includes(instrument))throw new RangeError('Invalid gyro fault / instrument combination');
 if(type==='normal')return clear(fault);
 const p=parameters(values),healthy=systemState(state),event=fault.event+1;
 return {...initialFault(),type,parameters:p,event,unwrappedHeading:healthy.heading.heading,snapshot:Object.freeze({event,instrument,pitch:state.pitch,bank:state.bank,heading:healthy.heading.heading,healthyState:healthy[instrument],parameters:Object.freeze({...p})})};
}
export function clear(fault){return {...initialFault(),event:fault.event};}
export function advance(fault,dt,state) {
 if(fault.type==='normal')return fault;
 const seconds=Number.isFinite(dt)?Math.max(0,dt):0,elapsed=fault.elapsed+seconds;
 const lossExponent=fault.lossExponent+seconds/fault.parameters.decaySeconds;
 const effectiveness=fault.type==='drive'?(lossExponent>=8?0:Math.exp(-lossExponent)):fault.type==='effectiveness'?fault.parameters.effectiveness:1;
 return {...fault,elapsed,lossExponent,effectiveness,error:fault.type==='drift'?fault.error+fault.parameters.driftRate*seconds/60:0,unwrappedHeading:continuousHeading(fault.unwrappedHeading,state.heading)};
}
export function transform(state,instrument,fault=initialFault()) {
 if(!referenceTypes[instrument])throw new RangeError('Unknown gyro instrument');
 // An injection is instrument-specific, including drive loss. No shared supply is implied.
 if(fault.type!=='normal'&&fault.snapshot?.instrument!==instrument)fault=initialFault();
 const healthy=systemState(state)[instrument],p=fault.parameters,e=fault.effectiveness;
 let displayState=instrument==='attitude'?{pitch:state.pitch,bank:state.bank}:instrument==='heading'?{heading:state.heading}:{bank:state.bank};
 if(fault.type==='bias')displayState={pitch:clamp(state.pitch-p.pitchBias,-20,20),bank:clamp(state.bank-p.bankBias,-45,45)};
 if(fault.type==='drift')displayState={heading:wrapHeading(state.heading+fault.error)};
 if(fault.type==='drive'){
 const captured=fault.snapshot;
 if(instrument==='attitude')displayState={pitch:e*state.pitch+(1-e)*captured.pitch,bank:e*state.bank+(1-e)*captured.bank};
 if(instrument==='heading')displayState={heading:wrapHeading(captured.heading+e*(fault.unwrappedHeading-captured.heading))};
 if(instrument==='turn')displayState={bank:healthy.bank*e};
 }
 if(fault.type==='effectiveness')displayState={bank:healthy.bank*p.effectiveness};
 const effective=systemState({...state,...displayState})[instrument];
 const status=fault.type==='normal'||fault.type==='effectiveness'&&p.effectiveness===1?'HEALTHY':fault.type==='drift'?'DRIFTING':fault.type==='drive'?(e<=.05?(instrument==='turn'&&e===0?'NO GYRO RESPONSE':'UNRELIABLE'):'SPINNING DOWN'):instrument==='turn'&&p.effectiveness===0?'NO GYRO RESPONSE':'DEGRADED';
 return {instrument,type:fault.type,referenceType:referenceTypes[instrument],healthyState:healthy,effectiveState:effective,displayState,status,effectiveness:fault.type==='effectiveness'?p.effectiveness:e,error:fault.error,elapsed:fault.elapsed,observedSymptom:fault.type==='effectiveness'&&p.effectiveness===1?'100% effectiveness: healthy response; no reduction.':definitions[fault.type].symptomPattern,definition:definitions[fault.type]};
}
