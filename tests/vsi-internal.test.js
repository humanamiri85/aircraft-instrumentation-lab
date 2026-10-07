import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLag,advanceLag,mechanismState,LAG_SECONDS} from '../js/internal/vsi/model.js';
import {vsiAngle} from '../js/instruments/vsi.js';
test('positive and negative steps build symmetric bounded pressure differences',()=>{
 for(const speed of [-2000,-1000,0,1000,2000]){
  let state=initialLag(),previous=0;
  for(let i=0;i<100;i++){
   state=advanceLag(state,speed,0.1);
   assert.ok(Math.abs(state.differential)>=previous);
   assert.ok(Math.abs(state.differential)<=Math.abs(speed/2000));
   assert.equal(Math.sign(state.differential),Math.sign(speed));
   previous=Math.abs(state.differential);
  }
  const m=mechanismState(state,speed);
  assert.equal(m.angle,vsiAngle(m.indicated));
  assert.ok(Math.abs(m.displacement)<=32);
  assert.equal(m.case-m.diaphragm,m.differential);
 }
});
test('step transient matches exact first-order response and is timestep independent',()=>{
 for(const speed of [-1000,1000]){
  const full=advanceLag(initialLag(),speed,LAG_SECONDS);
  assert.ok(Math.abs(full.differential-speed/2000*(1-Math.exp(-1)))<1e-12);
  let split=initialLag();for(let i=0;i<15;i++)split=advanceLag(split,speed,0.1);
  assert.ok(Math.abs(full.differential-split.differential)<1e-12);
 }
});
test('level input recovers monotonically toward zero from climb and descent',()=>{
 for(const speed of [-1000,1000]){
  let state=advanceLag(initialLag(),speed,10);
  const start=state.differential;
  for(let i=0;i<150;i++){
   const next=advanceLag(state,0,0.1);
   assert.ok(Math.abs(next.differential)<Math.abs(state.differential));
   assert.equal(Math.sign(next.differential),Math.sign(start));state=next;
  }
  assert.ok(Math.abs(mechanismState(state,0).indicated)<0.1);
 }
});
test('reversal, invalid values and extreme timesteps stay bounded; reduced motion settles',()=>{
 let state=initialLag();
 for(let i=0;i<1000;i++){
  state=advanceLag(state,i%2?99999:-99999,0.2);
  assert.ok(Math.abs(state.differential)<=1);
 }
 assert.deepEqual(advanceLag(initialLag(),1000,-1),initialLag());
 assert.deepEqual(advanceLag({differential:NaN},NaN,NaN),initialLag());
 assert.equal(advanceLag(state,2000,1e9).differential,1);
 assert.equal(advanceLag(state,-2000,0,true).differential,-1);
 assert.equal(advanceLag(state,0,0,true).differential,0);
});
