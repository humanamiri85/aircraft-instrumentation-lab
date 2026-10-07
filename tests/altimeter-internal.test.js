import test from 'node:test';
import assert from 'node:assert/strict';
import {staticPressure,capsuleExpansion,mechanismState,ATMOSPHERE} from '../js/internal/altimeter/model.js';
import {altitudeAngles} from '../js/instruments/altimeter.js';
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);

test('standard troposphere pressure at 0, 5000 and 10000 ft has SI reference values',()=>{
  close(staticPressure(0),101325);
  // Independent published standard-atmosphere reference values, rounded to Pa.
  close(staticPressure(5000),84307,2);
  close(staticPressure(10000),69682,2);
  assert.equal(ATMOSPHERE.t0,288.15);
});
test('pressure falls and visual capsule expansion grows throughout the altitude range',()=>{
  let previous=mechanismState(0);
  close(previous.expansion,0);
  for(let feet=50;feet<=10000;feet+=50){
    const m=mechanismState(feet);
    assert.ok(m.pressure<previous.pressure);
    assert.ok(m.expansion>previous.expansion&&m.expansion<=1);
    assert.ok(m.capsuleEnd>previous.capsuleEnd);
    previous=m;
  }
  close(previous.expansion,1);
  close(capsuleExpansion(200000),0);
  close(capsuleExpansion(0),1);
  assert.ok(mechanismState(5000).expansion>0&&mechanismState(5000).expansion<1);
});
test('stack attachment meets last wafer and link/lever lengths stay fixed',()=>{
  for(const feet of [0,5000,10000]){
    const m=mechanismState(feet);
    close(m.capsuleEnd,140+2*(m.waferWidth+4)+m.waferWidth);
    close(Math.hypot(m.leverTip.x-335,m.leverTip.y-250),65);
    close(Math.hypot(m.leverTip.x-m.capsuleEnd,m.leverTip.y-250),80);
    assert.ok(m.leverAngle>0&&m.leverAngle<90);
  }
});
test('three pointer outputs share cockpit calibration and continuous 100:10:1 ratios',()=>{
  const expected=[[0,0,0,0],[5000,1800,180,18],[10000,3600,360,36]];
  for(const [feet,hundreds,thousands,tenThousands] of expected){
    assert.deepEqual(mechanismState(feet).angles,{hundreds,thousands,tenThousands});
  }
  for(const feet of [50,950,1000,1050,3500,9950]){
    const m=mechanismState(feet);
    assert.deepEqual(m.angles,altitudeAngles(feet));
    close(m.angles.hundreds,10*m.angles.thousands);
    close(m.angles.thousands,10*m.angles.tenThousands);
  }
});
test('out-of-range altitude and pressure are bounded; invalid inputs use default altitude',()=>{
  assert.deepEqual(mechanismState(-1000),mechanismState(0));
  assert.deepEqual(mechanismState(20000),mechanismState(10000));
  for(const value of [NaN,Infinity,-Infinity,undefined]){
    assert.deepEqual(mechanismState(value),mechanismState(3500));
    close(staticPressure(value),staticPressure(3500));
    close(capsuleExpansion(value),mechanismState(3500).expansion);
  }
});
