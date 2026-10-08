import test from 'node:test';
import assert from 'node:assert/strict';
import {instruments,families,selection,liveState,liveValues} from '../js/measurement/comparison/model.js';
import {layers,presets,questions,familyContent} from '../js/measurement/comparison/content.js';
import {routes,systemState as pressureState} from '../js/measurement/pitot-static/model.js';
import {systemState as gyroState,referenceTypes} from '../js/measurement/gyro/model.js';
import {initialState} from '../js/model.js';
import {advanceLag,initialLag} from '../js/internal/vsi/model.js';
test('All six comparison definitions have eight layers and reusable chain element IDs',()=>{
  assert.deepEqual(Object.keys(instruments),['airspeed','altimeter','vsi','attitude','heading','turn']);
  for(const m of Object.values(instruments)) {
    assert.equal(m.id,instruments[m.id].id);assert.ok(Object.isFrozen(m));
    for(const [key] of layers)assert.ok(m[key].length>5,`${m.id}/${key}`);
    assert.deepEqual(m.chain.map(stage=>stage.element),['physical-input','source-reference','transmission','sensing-element','conversion','indication']);
    assert.ok(Object.isFrozen(m.chain));assert.ok(m.badges.length);
  }
});
test('Pressure instruments infer flight quantities from their correct physical inputs and routing',()=>{
  const expected={airspeed:'differential-pressure',altimeter:'static-pressure',vsi:'static-pressure-history'};
  for(const [id,kind] of Object.entries(expected)) {
    const m=instruments[id];assert.equal(m.family,'pitot-static');assert.equal(m.physicalInputKind,kind);assert.equal(m.isInferred,true);
    assert.deepEqual(m.pressureInputs,routes[id]);assert.equal(m.referenceType,null);
    assert.notEqual(m.directlySensedQuantity,m.targetQuantity);assert.match(m.badges.join(' '),/INFERRED OUTPUT/);
  }
  assert.match(instruments.airspeed.directlySensedQuantity,/Differential pressure.*Pt.*Ps/);
  for(const id of ['altimeter','vsi']) {
    assert.deepEqual(instruments[id].pressureInputs,['static']);
    assert.doesNotMatch([instruments[id].sourceOrReference,instruments[id].transmission,instruments[id].directlySensedQuantity].join(' '),/pitot|\bPt\b/i);
  }
  assert.doesNotMatch(instruments.altimeter.directlySensedQuantity,/altitude/i);
  assert.doesNotMatch(instruments.vsi.directlySensedQuantity,/vertical (velocity|speed)/i);
});
test('Gyro instruments retain distinct references, real angular-rate measurand and explicit TC proxy',()=>{
  for(const id of families.gyroscopic) {
    const m=instruments[id];assert.equal(m.family,'gyroscopic');assert.deepEqual(m.pressureInputs,[]);
    assert.equal(m.referenceType,referenceTypes[id]);assert.doesNotMatch([m.sourceOrReference,m.transmission,m.sensingElement].join(' '),/pressure|pitot|static line/i);
  }
  assert.equal(instruments.attitude.referenceType,'vertical');assert.equal(instruments.heading.referenceType,'directional');
  assert.notEqual(instruments.attitude.physicalInputKind,instruments.heading.physicalInputKind);
  assert.match(instruments.attitude.sourceOrReference,/vertical/i);assert.doesNotMatch(instruments.attitude.sourceOrReference,/directional/i);
  assert.match(instruments.heading.sourceOrReference,/directional/i);assert.doesNotMatch(instruments.heading.sourceOrReference,/vertical/i);
  assert.equal(instruments.turn.physicalInputKind,'angular-rate');assert.equal(instruments.turn.teachingInput,'Bank proxy');
  assert.doesNotMatch(instruments.turn.directlySensedQuantity,/bank/i);assert.match(instruments.turn.teachingSimplification,/Bank.*proxy.*angular rate, not bank angle/);
  for(const id of ['attitude','heading'])assert.equal(instruments[id].measurementType,'reference-based');
  assert.equal(instruments.turn.measurementType,'rate-sensitive');
});
test('Every cross-family pairing and guided preset preserves independent classifications',()=>{
  for(const left of families['pitot-static'])for(const right of families.gyroscopic) {
    const m=selection(left,right);assert.equal(m.left,instruments[left]);assert.equal(m.right,instruments[right]);assert.deepEqual(m.gyroFocus,[right]);assert.deepEqual(m.pressureInputs,routes[left]);
  }
  assert.throws(()=>selection('heading','altimeter'),RangeError);
  assert.deepEqual(presets.map(p=>[p.left,p.right]),[['airspeed','attitude'],['altimeter','heading'],['vsi','turn']]);
  assert.match(familyContent.gyroscopic.note,/do not depend on pitot-static/);assert.equal(questions.length,6);
  assert.match(questions[0][1],/responds to static pressure; altitude is inferred/);
  assert.match(questions[3][1],/Angular rate.*Bank.*proxy.*not the real measurand/);
});
test('Live comparison state exactly reuses both families and the application VSI lag',()=>{
  for(const state of [initialState(),{airspeed:160,altitude:7500,verticalSpeed:1200,pitch:20,bank:-45,heading:359}]) {
    const before=structuredClone(state);const lag=advanceLag(initialLag(),state.verticalSpeed,.4,false),saved=structuredClone(lag);
    const m=liveState(state,lag,0);assert.deepEqual(m.pressure,pressureState(state,lag));assert.deepEqual(m.gyro,gyroState(state,0));
    assert.deepEqual(state,before);assert.deepEqual(lag,saved);
    for(const id of Object.keys(instruments))assert.ok(liveValues(id,m).every(([key,label,value])=>key&&label&&typeof value==='string'));
  }
  const a=initialState(),lag=initialLag();
  const before=liveState(a,lag);
  assert.deepEqual(liveState({...a,heading:90},lag).gyro.attitude,before.gyro.attitude);
  assert.deepEqual(liveState({...a,pitch:20,bank:45},lag).gyro.heading,before.gyro.heading);
  assert.deepEqual(liveState({...a,pitch:20,heading:90},lag).gyro.turn,before.gyro.turn);
  assert.deepEqual(liveState({...a,bank:45},lag).pressure,before.pressure);
});
