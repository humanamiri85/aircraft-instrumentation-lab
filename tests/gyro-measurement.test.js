import test from 'node:test';
import assert from 'node:assert/strict';
import {systemState,referenceTypes,focusedPaths} from '../js/measurement/gyro/model.js';
import {chains,steps,components,proxyNote} from '../js/measurement/gyro/content.js';
import {mechanismState as ai} from '../js/internal/attitude/model.js';
import {mechanismState as hi} from '../js/internal/heading/model.js';
import {mechanismState as tc} from '../js/internal/turn/model.js';
const state={pitch:0,bank:0,heading:0};
test('AI chain reuses vertical reference, signed display mapping and independent heading',()=>{
  for(const pitch of [-20,0,20])for(const bank of [-45,0,45]) {
    const m=systemState({...state,pitch,bank}).attitude;
    assert.deepEqual(m,ai({...state,pitch,bank}));
    assert.equal(m.display.pitchOffset,pitch*1.8);assert.equal(m.display.roll,-bank);
    assert.equal(m.casePitch,-pitch);assert.equal(m.caseBank,bank);
    assert.deepEqual(m.reference.worldUp,[0,1,0]);
    for(const heading of [0,1,90,180,270,359])assert.deepEqual(systemState({pitch,bank,heading}).attitude,m);
  }
  assert.equal(referenceTypes.attitude,'vertical');
  assert.match(chains.attitude[1][1],/vertical/);assert.doesNotMatch(JSON.stringify(chains.attitude),/directional/);
});
test('HI chain reuses directional state and shortest wrap without pitch/bank coupling',()=>{
  let previous;
  for(const heading of [0,1,90,180,270,359,0,359]) {
    const m=systemState({...state,heading},previous).heading;
    assert.deepEqual(m,hi({...state,heading},previous));assert.deepEqual(m.reference.worldSpin,[0,0,-1]);
    if(previous!==undefined)assert.ok(Math.abs(m.caseAngle-previous)<=180);
    for(const pitch of [-20,0,20])for(const bank of [-45,0,45])assert.deepEqual(systemState({pitch,bank,heading},previous).heading,m);
    previous=m.caseAngle;
  }
  assert.equal(systemState({...state,heading:0},359).heading.caseAngle,360);
  assert.equal(systemState({...state,heading:359},0).heading.caseAngle,-1);
  assert.equal(referenceTypes.heading,'directional');assert.match(chains.heading[1][1],/directional/);assert.doesNotMatch(JSON.stringify(chains.heading),/vertical/);
});
test('TC chain preserves signed bounded proxy response and separate centered ball',()=>{
  for(const bank of [-45,-20,0,20,45]) {
    const m=systemState({...state,bank}).turn;
    assert.deepEqual(m,tc({...state,bank}));assert.equal(m.rateProxy,bank/45);
    assert.equal(Math.sign(m.gimbalAngle),Math.sign(bank));assert.ok(Math.abs(m.rateProxy)<=1);assert.equal(m.ballOffset,0);
    for(const heading of [0,90,359])for(const pitch of [-20,20])assert.deepEqual(systemState({pitch,bank,heading}).turn,m);
  }
  for(const bank of [-100,100])assert.ok(Math.abs(systemState({...state,bank}).turn.rateProxy)<=1);
  assert.match(proxyNote,/Bank.*proxy/);assert.match(proxyNote,/responds to angular rate, not bank angle/);
  assert.equal(referenceTypes.turn,'restrained-rate');assert.match(chains.turn[0][1],/angular rate/);assert.match(chains.turn[1][1],/proxy/);
});
test('Selected chain routing and five teaching steps stay distinct and explain all components',()=>{
  for(const id of ['attitude','heading','turn']) {
    assert.deepEqual(focusedPaths(id),[id]);assert.equal(steps[id].length,5);
    const ids=components(id).map(c=>c[0]);for(const [component] of steps[id])assert.ok(ids.includes(component));
  }
  const labels=new Set(['attitude','heading','turn'].flatMap(id=>components(id).map(c=>c[1])));
  for(const label of ['Aircraft body','Vertical gyro reference','Directional gyro reference','Spin axis','Outer gimbal','Inner gimbal','Relative case motion','Restrained rate gyro','Gyroscopic precession','Spring restraint','Lubber line','Compass card','Turn indication','Inclinometer ball'])assert.ok(labels.has(label),label);
});
