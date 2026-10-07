import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '../vendor/three/three.core.js';
import {bodyQuaternion,advanceSpin as sharedSpin} from '../js/internal/gyro/model.js';
import {mechanismState,advanceSpin} from '../js/internal/attitude/model.js';
import {attitudeTransform} from '../js/instruments/attitude.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} differs from ${b}`);
for(const [pitch,bank] of [[-20,0],[0,0],[20,0],[0,-45],[0,45],[10,30],[-10,-30]]) {
  test(`attitude ${pitch} pitch / ${bank} bank: relative reference and cockpit calibration`,()=>{
    const m=mechanismState({pitch,bank,heading:0});
    assert.deepEqual(m.display,attitudeTransform(pitch,bank));
    near(m.display.pitchOffset,pitch*1.8);near(m.display.roll,-bank);
    near(m.casePitch,-pitch);near(m.caseBank,bank);
    assert.deepEqual(m.reference.worldUp,[0,1,0]);
    near(new Vector3(...m.reference.bodyUp).length(),1);
    // Independent shared quaternion reconstructs world up from relative axis.
    for(const heading of [0,90,180,270,359]) {
      const state={pitch,bank,heading};
      assert.deepEqual(mechanismState(state),m,'heading does not change indication or bearings');
      const world=new Vector3(...m.reference.bodyUp).applyQuaternion(bodyQuaternion(state));
      world.toArray().forEach((v,i)=>near(v,[0,1,0][i]));
    }
  });
}
test('attitude bounds and independent variables; shared reduced-motion rotor cue',()=>{
  assert.equal(advanceSpin,sharedSpin);
  assert.equal(advanceSpin(1,.05,true),0);
  assert.ok(advanceSpin(1,.05)>1);
  const m=mechanismState({pitch:10,bank:30});
  assert.deepEqual(mechanismState({pitch:10,bank:30,airspeed:180,altitude:10000,verticalSpeed:-2000}),m);
  const bounded=mechanismState({pitch:100,bank:-100});
  assert.equal(bounded.pitch,20);assert.equal(bounded.bank,-45);
  assert.equal(mechanismState({pitch:NaN,bank:Infinity}).pitch,0);
});
