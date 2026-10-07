import test from 'node:test';
import assert from 'node:assert/strict';
import {knotsToMetresPerSecond, dynamicPressure, mechanismState, REFERENCE_DENSITY} from '../js/internal/asi/model.js';
import {airspeedAngle} from '../js/instruments/airspeed.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('knots convert to SI speed at 40, 110 and 180 kt',()=>{
  for(const [knots,metres] of [[40,20.57777777777778],[110,56.58888888888889],[180,92.6]])close(knotsToMetresPerSecond(knots),metres);
});
test('fixed-density reference dynamic pressure has correct units and quadratic scaling',()=>{
  assert.equal(REFERENCE_DENSITY,1.225);
  close(dynamicPressure(0),0);
  close(dynamicPressure(110),1961.410186728395);
  close(dynamicPressure(180),5252.0405);
  close(dynamicPressure(80),4*dynamicPressure(40));
  assert.ok(dynamicPressure(180)>dynamicPressure(110));
  assert.ok(dynamicPressure(110)>dynamicPressure(40));
});
test('pressure drives bounded normalized deflection and connected lever geometry',()=>{
  const states=[40,110,180].map(mechanismState);
  close(states[0].deflection,(40/180)**2);
  close(states[1].deflection,(110/180)**2);
  close(states[2].deflection,1);
  for(let ias=40;ias<=180;ias++){
    const m=mechanismState(ias);
    assert.ok(m.deflection>0&&m.deflection<=1);
    assert.ok(m.capsuleEnd>=190&&m.capsuleEnd<=222);
    assert.ok(m.leverAngle>=-18&&m.leverAngle<=18);
    // A rigid lever must retain its length while the connecting link moves.
    close(Math.hypot(m.leverTip.x-290,m.leverTip.y-260),Math.hypot(56,28));
    close(m.pointerAngle,airspeedAngle(ias));
    if(ias>40)assert.ok(m.deflection>mechanismState(ias-1).deflection);
  }
  assert.notDeepEqual(states[0].leverTip,states[2].leverTip);
});
test('visual mapping clamps safely and uses initial IAS for non-finite inputs',()=>{
  assert.deepEqual(mechanismState(-1),mechanismState(40));
  assert.deepEqual(mechanismState(999),mechanismState(180));
  for(const invalid of [NaN,Infinity,-Infinity,undefined])assert.deepEqual(mechanismState(invalid),mechanismState(110));
});
