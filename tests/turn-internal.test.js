import test from 'node:test';
import assert from 'node:assert/strict';
import {mechanismState,advanceSpin} from '../js/internal/turn/model.js';
import {turnAngle} from '../js/instruments/turn.js';

test('Bank proxy signs, bounded gimbal/spring and shared symbol mapping',()=>{
  for(const bank of [-45,-20,0,20,45]) {
    const m=mechanismState({bank});
    assert.equal(Math.sign(m.rateProxy),Math.sign(bank));
    assert.equal(Math.sign(m.gimbalAngle),Math.sign(bank));
    assert.equal(m.symbolAngle,turnAngle(bank));
    assert.ok(Math.abs(m.rateProxy)<=1&&Math.abs(m.gimbalAngle)<=18);
    assert.ok(m.springLoad>=0&&m.springLoad<=1);
    assert.equal(m.ballOffset,0);
    if(bank===0)assert.deepEqual([m.rateProxy,m.gimbalAngle,m.springLoad,m.symbolAngle],[0,0,0,0]);
  }
});
test('Rate response and spring load are monotonic, symmetric and saturate safely',()=>{
  let previous=0;
  for(const bank of [0,10,20,30,45,90]) {
    const right=mechanismState({bank}),left=mechanismState({bank:-bank});
    assert.ok(right.gimbalAngle>=previous);previous=right.gimbalAngle;
    assert.equal(left.gimbalAngle+right.gimbalAngle,0);
    assert.equal(left.springLoad,right.springLoad);
    assert.equal(right.springLoad,Math.abs(right.rateProxy));
  }
  for(const bank of [NaN,Infinity,undefined])assert.equal(mechanismState({bank}).gimbalAngle,0);
});
test('Return to neutral has no residual load; other flight variables and ball are independent',()=>{
  for(const bank of [-45,-20,0,20,45]) {
    const baseline=mechanismState({bank});
    for(const heading of [0,90,359])for(const pitch of [-20,0,20])
      assert.deepEqual(mechanismState({bank,heading,pitch,airspeed:180,altitude:10000,verticalSpeed:-2000}),baseline);
  }
  mechanismState({bank:45});
  assert.equal(mechanismState({bank:0}).springLoad,0);
  assert.equal(advanceSpin(1,.1,true),0);
  assert.ok(advanceSpin(1,.1,false)>1);
});
