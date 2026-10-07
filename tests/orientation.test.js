import test from 'node:test';
import assert from 'node:assert/strict';
import {Euler, Vector3} from '../vendor/three/three.core.js';
import {aviationRotation, attitudeLabels} from '../js/aircraft/orientation.js';
import {initialState, smoothState} from '../js/model.js';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
function axes(pitch,bank,heading) {
  const r=aviationRotation({pitch,bank,heading}), e=new Euler(r.x,r.y,r.z,r.order);
  return {nose:new Vector3(0,0,-1).applyEuler(e), right:new Vector3(1,0,0).applyEuler(e)};
}
test('pitch raises/lowers nose; bank drops corresponding wing',()=>{
  for(const pitch of [-20,0,20]) near(axes(pitch,0,0).nose.y,Math.sin(pitch*Math.PI/180));
  for(const bank of [-45,0,45]) near(axes(0,bank,0).right.y,-Math.sin(bank*Math.PI/180));
});
test('heading clockwise from north through all cardinal points and 359',()=>{
  for(const h of [0,90,180,270,359]) {const {nose}=axes(0,0,h);near(nose.x,Math.sin(h*Math.PI/180));near(nose.z,-Math.cos(h*Math.PI/180));}
});
test('combined attitudes preserve local pitch and bank signs at every heading',()=>{
  for(const [pitch,bank,heading] of [[10,30,45],[-10,-30,225]]) {
    const {nose,right}=axes(pitch,bank,heading);near(nose.y,Math.sin(pitch*Math.PI/180));near(right.y,-Math.sin(bank*Math.PI/180)*Math.cos(pitch*Math.PI/180));near(nose.dot(right),0);
  }
});
test('shared heading smoothing crosses north with no orientation discontinuity',()=>{
  for(const [a,b] of [[359,0],[0,359]]) {const state={...initialState(),heading:a},target={...state,heading:b};const before=axes(0,0,a).nose;smoothState(state,target,1/60);assert.ok(before.angleTo(axes(0,0,state.heading).nose)<Math.PI/180);}
});
test('overlay wraps rounded heading and labels signed pitch and bank',()=>{
  assert.deepEqual(attitudeLabels({pitch:10,bank:30,heading:45}),{pitch:'+10°',bank:'30° Right',heading:'045°'});
  assert.deepEqual(attitudeLabels({pitch:-10,bank:-30,heading:225}),{pitch:'-10°',bank:'30° Left',heading:'225°'});
  assert.equal(attitudeLabels({pitch:0,bank:0,heading:359.8}).heading,'000°');assert.equal(attitudeLabels({pitch:0,bank:0,heading:0}).bank,'Wings Level');
});
