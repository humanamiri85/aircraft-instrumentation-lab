import test from 'node:test';
import assert from 'node:assert/strict';
import {mechanismState,continuousHeading,advanceSpin} from '../js/internal/heading/model.js';
import {headingCardAngle} from '../js/instruments/heading.js';
import {initialState,smoothState} from '../js/model.js';
import {headingDelta} from '../js/math.js';
import {gyroState} from '../js/internal/gyro/model.js';

for(const heading of [0,1,90,180,270,359])test(`heading ${heading}: shared card calibration and stabilized gyro`,()=>{
  const m=mechanismState({heading});
  assert.equal(m.cardAngle,headingCardAngle(heading));
  assert.equal(m.continuousCardAngle,-heading);
  assert.equal(m.reading,`${String(heading).padStart(3,'0')}°`);
  // Cardinal/scale position at this heading is rotated to the case-fixed top.
  assert.equal(headingDelta(0,heading+m.cardAngle),0);
  const shared=gyroState({heading,pitch:0,bank:0});
  assert.deepEqual(m.reference.worldSpin,shared.worldSpin.toArray());
  m.reference.bodySpin.forEach((value,i)=>assert.ok(Math.abs(value-shared.bodySpin.toArray()[i])<1e-12));
});
test('north crossing uses shortest continuous case/card angles in both directions',()=>{
  for(const headings of [[358,359,0,1,2],[2,1,0,359,358]]) {
    let angle=headings[0];
    for(let i=1;i<headings.length;i++) {
      const m=mechanismState({heading:headings[i]},angle);
      assert.equal(m.caseAngle-angle,i>0&&headings[0]===358?1:-1);
      assert.equal(m.continuousCardAngle,-m.caseAngle);
      angle=m.caseAngle;
    }
  }
  assert.equal(continuousHeading(359,0),360);
  assert.equal(continuousHeading(0,359),-1);
});
test('shared state smoothing approaches north along the short path',()=>{
  for(const [from,to,sign] of [[359,0,1],[0,359,-1]]) {
    const current={...initialState(),heading:from},target={...current,heading:to};
    smoothState(current,target,.05);
    const m=mechanismState(current,from);
    assert.ok((m.caseAngle-from)*sign>0);
    assert.ok(Math.abs(m.caseAngle-from)<1);
  }
});
test('pitch, bank and unrelated inputs cannot alter directional indication or reference',()=>{
  const base=mechanismState({heading:135});
  for(const pitch of [-20,0,20])for(const bank of [-45,0,45]) {
    const m=mechanismState({heading:135,pitch,bank,altitude:10000,airspeed:180,verticalSpeed:-2000});
    assert.equal(m.cardAngle,base.cardAngle);assert.equal(m.reading,base.reading);
    assert.deepEqual(m.reference.bodySpin,base.reference.bodySpin);
  }
  assert.equal(mechanismState({heading:NaN}).heading,0);
  assert.equal(mechanismState({heading:360}).heading,0);
  assert.equal(advanceSpin(1,.1,true),0);
  assert.ok(advanceSpin(0,.1)>0);
});
