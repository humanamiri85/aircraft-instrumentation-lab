import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '../vendor/three/three.core.js';
import {BODY_AXES,normalizedAxis,bodyQuaternion,gyroState,advanceSpin} from '../js/internal/gyro/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const vectorNear=(a,b)=>a.toArray().forEach((v,i)=>near(v,b.toArray()[i]));
const state=(pitch=0,bank=0,heading=0)=>({pitch,bank,heading});
test('gyro aircraft coordinates define forward, right and up; normalization rejects invalid axes',()=>{
  assert.deepEqual(BODY_AXES,{longitudinal:[0,0,-1],lateral:[1,0,0],vertical:[0,1,0]});
  vectorNear(normalizedAxis([0,0,-5]),new Vector3(0,0,-1));
  near(normalizedAxis([3,4,0]).length(),1);
  assert.throws(()=>normalizedAxis([0,0,0]),RangeError);
  assert.throws(()=>normalizedAxis([NaN,0,1]),RangeError);
});
test('gyro pitch mapping raises the nose for positive pitch',()=>{
  for(const pitch of [-20,0,20])near(gyroState(state(pitch)).axes.longitudinal.y,Math.sin(pitch*Math.PI/180));
});
test('gyro bank mapping lowers right wing for positive bank',()=>{
  for(const bank of [-45,0,45])near(gyroState(state(0,bank)).axes.lateral.y,-Math.sin(bank*Math.PI/180));
});
test('gyro heading mapping rotates nose clockwise through cardinals and north wrap',()=>{
  for(const heading of [0,90,180,270,359]) {
    const nose=gyroState(state(0,0,heading)).axes.longitudinal;
    near(nose.x,Math.sin(heading*Math.PI/180));near(nose.z,-Math.cos(heading*Math.PI/180));
  }
  near(bodyQuaternion(state(0,0,360)).angleTo(bodyQuaternion(state())),0);
});
test('all 45 combined orientations preserve normalized orthogonal axes and stable rotor reference',()=>{
  const north=new Vector3(0,0,-1);
  for(const pitch of [-20,0,20])for(const bank of [-45,0,45])for(const heading of [0,90,180,270,359]) {
    const m=gyroState(state(pitch,bank,heading));
    vectorNear(new Vector3(0,0,-1).applyQuaternion(m.rotor),north);
    vectorNear(m.bodySpin.clone().applyQuaternion(m.body),north);
    vectorNear(m.worldSpin,north);
    for(const axis of [...Object.values(m.axes),m.innerAxis,m.outerAxis])near(axis.length(),1);
    near(m.axes.longitudinal.dot(m.axes.lateral),0);near(m.axes.vertical.dot(m.axes.lateral),0);
    near(m.innerAxis.dot(m.worldSpin),0);
    if(pitch||bank||heading)assert.ok(m.body.angleTo(bodyQuaternion(state()))>0);
  }
});
test('gyro reference is independent of unrelated flight variables',()=>{
  const input=state(20,45,359),a=gyroState(input),b=gyroState({...input,altitude:10000,airspeed:180,verticalSpeed:2000});
  vectorNear(a.bodySpin,b.bodySpin);assert.deepEqual(a.rotor.toArray(),b.rotor.toArray());
});
test('spin cue advances slowly, wraps and stays static with reduced motion',()=>{
  near(advanceSpin(0,.05),.06);near(advanceSpin(2,.05,true),0);
  assert.ok(advanceSpin(2*Math.PI-.01,.05)<.1);
  near(advanceSpin(0,100),.12);near(advanceSpin(0,-1),0);near(advanceSpin(0,NaN),0);
});
