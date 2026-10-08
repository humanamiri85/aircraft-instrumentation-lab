import {initialState,variables,setVariable} from '../model.js';
import * as pressure from '../faults/pitot-static/model.js';
import * as gyro from '../faults/gyro/model.js';
import {initialLag,advanceLag,mechanismState as vsiState} from '../internal/vsi/model.js';
import {systemState as gyroState} from '../measurement/gyro/model.js';
import {headingDelta} from '../math.js';

const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const candidates=freeze({
 'blocked-pitot':{family:'pitot-static',type:'blocked-pitot',instrument:'airspeed',name:'Blocked Pitot — trapped Pt',element:'transmission',component:'pitot-line',category:'stuck/trapped',timePattern:'trapped signal'},
 'blocked-static':{family:'pitot-static',type:'blocked-static',instrument:'altimeter',name:'Blocked Static — trapped Ps',element:'transmission',component:'static-line',category:'stuck/trapped',timePattern:'trapped signal'},
 'pitot-leak':{family:'pitot-static',type:'pitot-leak',instrument:'airspeed',name:'Pitot Leak — toward static pressure',element:'transmission',component:'pitot-line',category:'sensitivity loss',timePattern:'severity-dependent'},
 'hi-drift':{family:'gyroscopic',type:'drift',instrument:'heading',name:'HI Directional Drift',element:'source-reference',component:'gc-directional',category:'drift',timePattern:'time-accumulating'},
 'ai-bias':{family:'gyroscopic',type:'bias',instrument:'attitude',name:'AI Vertical Reference Bias',element:'source-reference',component:'gc-vertical',category:'bias-like',timePattern:'static / bias-like'},
 'tc-effectiveness':{family:'gyroscopic',type:'effectiveness',instrument:'turn',name:'TC Reduced Gyro Effectiveness',element:'sensing-element',component:'gc-rate',category:'sensitivity loss',timePattern:'severity-dependent'},
 'hi-drive':{family:'gyroscopic',type:'drive',instrument:'heading',name:'HI Drive Loss / Spin-Down',element:'source-reference',component:'gc-directional',category:'reference degradation',timePattern:'decaying'},
 'ai-drive':{family:'gyroscopic',type:'drive',instrument:'attitude',name:'AI Drive Loss / Spin-Down',element:'source-reference',component:'gc-vertical',category:'reference degradation',timePattern:'decaying'}
});
export const modes=Object.freeze(['guided','mixed','challenge']);
export const errorCategories=Object.freeze(['bias-like','drift','lag','stuck/trapped','sensitivity loss','reference degradation']);
const definition=(id,title,fault,state,actions=[],p={},difficulty='FOUNDATION')=>({id,title,faultFamily:candidates[fault].family,hiddenFaultId:fault,initialFlightState:{...initialState(),...state},faultParameters:{severity:.5,...gyro.initialParameters(),...p},studentActionsAllowed:variables.map(v=>v.key),evidenceItems:['airspeed','altimeter','vsi','attitude','heading','turn'],candidateFaults:Object.keys(candidates),diagnosticClues:['Compare affected and unaffected instruments.','Compare response to independent control changes.'],commonCauseClues:['Pressure instruments share Ps; AI and HI have distinct references.'],eliminationRules:'Compare real-model histories, including control response and elapsed time.',difficulty,actions,debrief:'Trace the symptom back to the shared signal or individual reference, rather than assuming the display mechanism failed.'});
// Generic titles protect the answer even in the scenario selector. Order begins
// with a cross-family session; immutable definitions contain no rendered symptoms.
export const scenarios=freeze([
 definition('shared-path','Shared-path investigation','blocked-static',{altitude:3000,verticalSpeed:1000},[{state:{altitude:7000},seconds:3}]),
 definition('heading-over-time','A changing heading discrepancy','hi-drift',{heading:270},[{seconds:60}],{},'ADVANCED'),
 definition('response-strength','Response-strength investigation','tc-effectiveness',{bank:30},[],{effectiveness:.4}),
 definition('speed-experiment','Airspeed-response experiment','blocked-pitot',{airspeed:110},[{state:{airspeed:160}}],{},'INTERMEDIATE'),
 definition('height-experiment','Altitude-response experiment','blocked-pitot',{airspeed:110,altitude:3000},[{state:{altitude:5000}}],{},'INTERMEDIATE'),
 definition('descending-path','Descending-path investigation','blocked-static',{altitude:7000,verticalSpeed:-1000},[{state:{altitude:3000},seconds:3}]),
 definition('moderate-discrepancy','A moderate pressure discrepancy','pitot-leak',{airspeed:140},[],{severity:.45}),
 definition('large-discrepancy','A larger pressure discrepancy','pitot-leak',{airspeed:140},[],{severity:.85}),
 definition('north-crossing','A discrepancy across north','hi-drift',{heading:1},[{seconds:60},{state:{heading:359}}],{driftRate:-4},'ADVANCED'),
 definition('responsive-offset','Responsive but offset','ai-bias',{pitch:10,bank:20},[],{pitchBias:3,bankBias:5}),
 definition('heading-hold','Changing reference hold','hi-drive',{heading:270},[{state:{heading:300},seconds:20}],{},'ADVANCED'),
 definition('attitude-hold','Changing attitude hold','ai-drive',{pitch:0,bank:0},[{state:{pitch:15,bank:30},seconds:20}],{},'ADVANCED'),
 definition('more-evidence','An initially plausible indication','blocked-pitot',{airspeed:110,altitude:3500},[],{},'INTERMEDIATE')
]);
export function seededScenario(id,seed=1){
 const base=scenarios.find(s=>s.id===id);if(!base)throw new RangeError('Unknown diagnostic scenario');
 let n=Number(seed)>>>0;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 // A common bounded speed offset preserves experiment direction and observability.
 const offset=Math.round(random()*10)-5;
 const initialFlightState={...base.initialFlightState,airspeed:base.initialFlightState.airspeed+offset};
 const actions=base.actions.map(a=>({...a,state:a.state?{...a.state,...('airspeed' in a.state?{airspeed:a.state.airspeed+offset}:{})}:undefined}));
 return freeze({...base,seed:Number(seed)>>>0,initialFlightState,actions});
}
function context(scenario,id){
 const c=candidates[id],state={...scenario.initialFlightState};
 const fault=c.family==='pitot-static'?pressure.activateFault(pressure.setSeverity(pressure.initialFault(),scenario.faultParameters.severity),c.type,state):gyro.activate(gyro.initialFault(),c.instrument,c.type,state,scenario.faultParameters);
 // Independent scenario lag instances use the existing model exactly once per
 // time step. This cannot double-update the application's live VSI state.
 return {fault,lag:advanceLag(initialLag(),state.verticalSpeed,30),healthyLag:advanceLag(initialLag(),state.verticalSpeed,30)};
}
function observe(state,id,ctx){
 const c=candidates[id],p=pressure.transform(state,c.family==='pitot-static'?ctx.fault:pressure.initialFault(),ctx.lag);
 const g=Object.fromEntries(['attitude','heading','turn'].map(i=>[i,gyro.transform(state,i,c.family==='gyroscopic'?ctx.fault:gyro.initialFault())]));
 return {display:{airspeed:p.state.airspeed,altitude:p.state.altitude,verticalSpeed:vsiState(ctx.lag,p.state.verticalSpeed).indicated,...g.attitude.displayState,...g.heading.displayState,turnBank:g.turn.displayState.bank},pressure:p,gyros:g,
  values:{airspeed:p.state.airspeed,altimeter:p.state.altitude,vsi:vsiState(ctx.lag,p.state.verticalSpeed).indicated,pitch:g.attitude.effectiveState.pitch,bank:g.attitude.effectiveState.bank,heading:g.heading.effectiveState.heading,turn:g.turn.effectiveState.rateProxy},
  healthy:{...state,verticalSpeed:vsiState(ctx.healthyLag,state.verticalSpeed).indicated,turn:gyroState(state).turn.rateProxy}};
}
export function startSession(scenario,mode='guided'){
 if(!modes.includes(mode))throw new RangeError('Unknown diagnostic mode');
 const contexts=Object.fromEntries(scenario.candidateFaults.map(id=>[id,context(scenario,id)]));
 const session={scenario,mode,state:{...scenario.initialFlightState},contexts,history:[],elapsed:0,hints:0,experiments:0,attempts:0,marks:{},matrix:{},result:null,healthyVisible:false};
 record(session);scenario.actions.forEach(a=>experiment(session,a.state||{},a.seconds||0,false));return session;
}
function record(session){
 const outputs=Object.fromEntries(Object.entries(session.contexts).map(([id,ctx])=>[id,observe(session.state,id,ctx)]));
 session.observation=outputs[session.scenario.hiddenFaultId];
 session.history.push({time:session.elapsed,state:{...session.state},outputs});
 if(session.history.length>1000)session.history.splice(2,1);
}
export function experiment(session,changes={},seconds=0,count=true){
 Object.entries(changes).forEach(([key,value])=>{if(session.scenario.studentActionsAllowed.includes(key))setVariable(session.state,key,value);});
 const dt=Number.isFinite(seconds)?Math.max(0,seconds):0;
 for(const [id,ctx] of Object.entries(session.contexts)){
  const c=candidates[id];
  if(c.family==='gyroscopic')ctx.fault=gyro.advance(ctx.fault,dt,session.state);
  const input=pressure.transform(session.state,c.family==='pitot-static'?ctx.fault:pressure.initialFault(),ctx.lag).state.verticalSpeed;
  ctx.lag=advanceLag(ctx.lag,input,dt);ctx.healthyLag=advanceLag(ctx.healthyLag,session.state.verticalSpeed,dt);
 }
 session.elapsed+=dt;if(count)session.experiments++;record(session);return session.observation;
}
// Tolerances are no finer than the evidence panel's displayed resolution.
const tolerances={airspeed:.1,altimeter:.1,vsi:.1,pitch:.1,bank:.1,heading:.1,turn:.0005};
function difference(key,a,b){return Math.abs(key==='heading'?headingDelta(a,b):a-b);}
export function candidateEvidence(session,id,key){
 if(!session.contexts[id]||!(key in tolerances))throw new RangeError('Unknown evidence / candidate');
 const samples=session.history;
 const mismatches=samples.some(h=>difference(key,h.outputs[id].values[key],h.outputs[session.scenario.hiddenFaultId].values[key])>tolerances[key]);
 if(mismatches)return 'INCONSISTENT';
 // Matching evidence is neutral when every candidate predicts the same result.
 const discriminating=samples.some(h=>Object.values(h.outputs).some(o=>difference(key,o.values[key],h.outputs[id].values[key])>tolerances[key]));
 return discriminating?'CONSISTENT':'NEUTRAL';
}
export function plausibleCandidates(session){return session.scenario.candidateFaults.filter(id=>Object.keys(tolerances).every(k=>candidateEvidence(session,id,k)!=='INCONSISTENT'));}
export function visibleCandidates(session){return session.scenario.candidateFaults.filter(id=>session.mode!=='guided'||candidates[id].family===session.scenario.faultFamily);}
export function evaluate(session,id,family='uncertain'){
 if(!visibleCandidates(session).includes(id))throw new RangeError('Choose a valid candidate');
 const plausible=plausibleCandidates(session).filter(c=>visibleCandidates(session).includes(c));
 const supported=plausible.includes(id),unique=plausible.length===1;
 const familyFits=session.mode==='guided'||family===candidates[id].family;
 const status=supported&&unique&&familyFits?'CORRECT':supported?'PARTIALLY SUPPORTED':'INCORRECT';
 session.attempts++;session.result={id,family,status,plausible,unique,needsEvidence:!unique};session.healthyVisible=false;
 return session.result;
}
export function markCandidate(session,id,value){if(!visibleCandidates(session).includes(id)||!['possible','unlikely','most likely'].includes(value))throw new RangeError('Invalid candidate mark');if(value==='most likely')Object.keys(session.marks).forEach(k=>{if(session.marks[k]==='most likely')session.marks[k]='possible';});session.marks[id]=value;}
export function evidenceRows(session){
 const v=session.observation.values,h=session.observation.healthy;
 return [
  ['airspeed','ASI',v.airspeed,h.airspeed,'kt'],['altimeter','Altimeter',v.altimeter,h.altitude,'ft'],['vsi','VSI',v.vsi,h.verticalSpeed,'ft/min'],
  ['pitch','AI pitch',v.pitch,h.pitch,'°'],['bank','AI bank',v.bank,h.bank,'°'],['heading','HI',v.heading,h.heading,'°'],['turn','TC normalized response',v.turn,h.turn,'']
 ].map(([key,name,value,healthy,unit])=>({key,name,value,healthy,unit,changed:difference(key,value,healthy)>tolerances[key]}));
}
