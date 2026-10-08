import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from './js/model.js';
import {systemState,referenceTypes} from './js/measurement/gyro/model.js';
import {initialFault,activate,clear,advance,transform,definitions,parameters} from './js/faults/gyro/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('Normal gyro outputs exactly reuse Phase 3/4B for representative independent inputs',()=>{
 for(const pitch of [-20,0,20])for(const bank of [-45,0,45])for(const heading of [0,1,90,180,270,359]){
 const s={...initialState(),pitch,bank,heading};for(const id of ['attitude','heading','turn']){const m=transform(s,id);assert.deepEqual(m.effectiveState,systemState(s)[id]);assert.deepEqual(m.healthyState,m.effectiveState);assert.equal(m.referenceType,referenceTypes[id]);assert.equal(m.status,'HEALTHY');}
 }});
test('Signed HI drift accumulates deterministically across north and ignores pitch/bank',()=>{
 for(const heading of [0,1,359])for(const driftRate of [-12,12]){const s={...initialState(),heading};let f=activate(initialFault(),'heading','drift',s,{driftRate});assert.equal(f.error,0);f=advance(f,10,{...s,pitch:20,bank:45});near(f.error,driftRate/6);const m=transform(s,'heading',f);near(m.effectiveState.heading,((heading+f.error)%360+360)%360);assert.deepEqual(m.healthyState,systemState(s).heading);assert.equal(clear(f).error,0);assert.deepEqual(transform(s,'heading',clear(f)).effectiveState,m.healthyState);}
});
test('AI biased vertical reference subtracts controlled offsets, bounded and heading-independent',()=>{
 for(const pitch of [-20,0,20])for(const bank of [-45,0,45])for(const pitchBias of [-3,3])for(const bankBias of [-5,5]){
 const s={...initialState(),pitch,bank};const f=activate(initialFault(),'attitude','bias',s,{pitchBias,bankBias});const m=transform(s,'attitude',f);near(m.effectiveState.pitch,Math.max(-20,Math.min(20,pitch-pitchBias)));near(m.effectiveState.bank,Math.max(-45,Math.min(45,bank-bankBias)));assert.deepEqual(m.healthyState,systemState(s).attitude);assert.deepEqual(transform({...s,heading:1},'attitude',f).effectiveState,m.effectiveState);}
});
test('Drive loss is bounded, monotonic, frame-rate independent and instrument-specific',()=>{
 for(const id of ['attitude','heading','turn']){
 const s=initialState(),next={...s,pitch:20,bank:45,heading:359};let f=activate(initialFault(),id,'drive',s,{decaySeconds:2});let previous=1;
 for(let i=0;i<40;i++){f=advance(f,.5,next);assert.ok(f.effectiveness>=0&&f.effectiveness<=previous);previous=f.effectiveness;const m=transform(next,id,f);assert.ok(Object.values(m.displayState).every(Number.isFinite));}
 assert.equal(f.effectiveness,0);const final=transform(next,id,f);if(id==='attitude'){near(final.effectiveState.pitch,s.pitch);near(final.effectiveState.bank,s.bank);}if(id==='heading')near(final.effectiveState.heading,s.heading);if(id==='turn'){near(final.effectiveState.rateProxy,0);assert.equal(final.effectiveState.ballOffset,0);}
 assert.deepEqual(transform(next,id,clear(f)).effectiveState,systemState(next)[id]);
 let a=activate(initialFault(),id,'drive',s,{decaySeconds:15}),b=a;a=advance(a,6,next);for(let i=0;i<60;i++)b=advance(b,.1,next);near(a.effectiveness,b.effectiveness);
 }
});
test('Drive decay remains monotonic when educational decay parameter changes; heading input unwraps',()=>{
 const s={...initialState(),heading:359};let f=activate(initialFault(),'heading','drive',s,{decaySeconds:2});f=advance(f,1,{...s,heading:0});assert.equal(f.unwrappedHeading,360);const previous=f.effectiveness;f={...f,parameters:parameters({decaySeconds:60})};f=advance(f,1,{...s,heading:1});assert.ok(f.effectiveness<previous);
});
test('TC effectiveness scales existing normalized response only and retains separate centered ball',()=>{
 for(const bank of [-45,-20,0,20,45])for(const effectiveness of [0,.25,.5,.75,1]){const s={...initialState(),bank},f=activate(initialFault(),'turn','effectiveness',s,{effectiveness}),m=transform(s,'turn',f);near(m.effectiveState.rateProxy,m.healthyState.rateProxy*effectiveness);near(m.effectiveState.symbolAngle,m.healthyState.symbolAngle*effectiveness);assert.equal(m.effectiveState.ballOffset,0);assert.equal(m.status,effectiveness===1?'HEALTHY':effectiveness===0?'NO GYRO RESPONSE':'DEGRADED');}
});
test('Only valid combinations activate; snapshots and clear/reset retain physical truth',async()=>{
 const {instruments}=await import('./js/measurement/comparison/model.js');const s=Object.freeze(initialState());
 for(const [type,d] of Object.entries(definitions))for(const id of ['attitude','heading','turn']){
 if(!d.instruments.includes(id)){assert.throws(()=>activate(initialFault(),id,type,s),RangeError);continue;}
 const f=activate(initialFault(),id,type,s);if(type==='normal')continue;for(const other of ['attitude','heading','turn'].filter(other=>other!==id)){assert.deepEqual(transform(s,other,f).effectiveState,systemState(s)[other]);assert.equal(transform(s,other,f).status,'HEALTHY');}assert.deepEqual(transform({...s,airspeed:180,altitude:10000,verticalSpeed:2000},id,f).effectiveState,transform(s,id,f).effectiveState);assert.equal(f.snapshot.instrument,id);assert.deepEqual(f.snapshot.healthyState,systemState(s)[id]);assert.ok(instruments[id].chain.some(link=>link.element===d.affectedChainElement));const cleared=clear(f);assert.equal(cleared.snapshot,null);assert.equal(cleared.effectiveness,1);assert.equal(cleared.error,0);assert.equal(activate(cleared,id,type,s).event,2);
 }
});
