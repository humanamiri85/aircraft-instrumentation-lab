import test from 'node:test';
import assert from 'node:assert/strict';
import {systemState,quantities,headingWindow,affectedQuantities,views,stages} from '../js/modern/model.js';
import {systemState as pressureState,routes} from '../js/measurement/pitot-static/model.js';
import {systemState as gyroState} from '../js/measurement/gyro/model.js';
import {initialState} from '../js/model.js';
import {initialLag,advanceLag} from '../js/internal/vsi/model.js';
import {transform,activateFault,initialFault} from '../js/faults/pitot-static/model.js';
import {components,airNote,ahrsNote,validityNote,roadmapNote} from '../js/modern/content.js';

test('modern metadata distinguishes pressure inputs, computed outputs and separate reference roles',()=>{
 assert.equal(views.length,3);assert.equal(Object.keys(quantities).length,6);
 for(const id of ['airspeed','altimeter','vsi']){assert.equal(quantities[id].system,'air-data');assert.deepEqual(quantities[id].inputs,routes[id]);assert.equal(quantities[id].classicalInferred,true);assert.equal(quantities[id].reference,null);}
 assert.deepEqual(quantities.altimeter.inputs,['static']);assert.deepEqual(quantities.vsi.inputs,['static']);
 assert.equal(quantities.attitude.modernOutputKind,'computed-solution');assert.equal(quantities.heading.modernOutputKind,'computed-solution');assert.equal(quantities.turn.modernOutputKind,'concept-only');assert.equal(quantities.attitude.reference,'vertical');assert.equal(quantities.heading.reference,'directional');assert.equal(quantities.turn.reference,'restrained-rate');
 for(const id of ['attitude','heading','turn']){assert.equal(quantities[id].system,'ahrs');assert.deepEqual(quantities[id].inputs,[]);}
 for(const m of Object.values(quantities)){assert.ok(Object.isFrozen(m));assert.deepEqual(m.modern.map(s=>s.element),stages);}
});
test('read-only modern values exactly reuse shared healthy pressure / gyro models over representative independent controls',()=>{
 for(const airspeed of [40,110,180])for(const altitude of [0,5000,10000])for(const verticalSpeed of [-1000,0,1000])for(const heading of [0,1,90,180,270,359]){
 const state={...initialState(),airspeed,altitude,verticalSpeed,pitch:20,bank:-45,heading},copy={...state},lag=advanceLag(initialLag(),verticalSpeed,3);
 const m=systemState(state,lag),p=pressureState(state,lag),g=gyroState(state);
 assert.deepEqual(m.air,p);assert.deepEqual(m.gyro,g);assert.deepEqual(m.pfd,{airspeed:p.airspeed,altitude:p.altitude,verticalSpeed:p.vsiIndicated,pitch:g.attitude.pitch,bank:g.attitude.bank,heading:g.heading.heading});assert.deepEqual(state,copy);
 }
});
test('no variable coupling or alternative pressure / attitude estimator is introduced',()=>{
 const s=initialState(),lag=initialLag(),a=systemState(s,lag);
 const speed=systemState({...s,airspeed:180},lag);assert.equal(speed.air.ps,a.air.ps);assert.equal(speed.pfd.altitude,a.pfd.altitude);assert.deepEqual(speed.gyro,a.gyro);
 const height=systemState({...s,altitude:10000},lag);assert.equal(height.pfd.airspeed,a.pfd.airspeed);assert.equal(height.pfd.verticalSpeed,a.pfd.verticalSpeed);
 const yaw=systemState({...s,heading:359},lag);assert.deepEqual(yaw.gyro.attitude,a.gyro.attitude);assert.deepEqual(yaw.air,a.air);
 const attitude=systemState({...s,pitch:-20,bank:45},lag);assert.equal(attitude.pfd.heading,a.pfd.heading);assert.deepEqual(attitude.air,a.air);
 assert.equal(attitude.gyro.turn.ballOffset,0);assert.deepEqual(affectedQuantities(['heading']),['heading']);assert.deepEqual(affectedQuantities(['bank']),['attitude','turn']);
});
test('PFD north window wraps without an independent heading accumulator',()=>{
 assert.deepEqual(headingWindow(359),[339,349,359,9,19]);assert.deepEqual(headingWindow(0),[340,350,0,10,20]);assert.deepEqual(headingWindow(360),headingWindow(0));
});
test('healthy VSI adapter accepts the existing lag instead of creating duplicate dynamics or reading a trapped input',()=>{
 const s={...initialState(),verticalSpeed:1000},healthy=advanceLag(initialLag(),1000,3),blocked=activateFault(initialFault(),'blocked-static',s),effective=transform(s,blocked).state;
 assert.equal(effective.verticalSpeed,0);const faultLag=advanceLag(healthy,effective.verticalSpeed,3),healthyLag=advanceLag(healthy,s.verticalSpeed,3);
 assert.ok(systemState(s,healthyLag).pfd.verticalSpeed>900);assert.ok(systemState(s,faultLag).pfd.verticalSpeed<200);
assert.equal(systemState(s,healthyLag).validity.status,'HEALTHY TEACHING REFERENCE');
});
test('content explicitly limits AHRS / digital conversion, inference, validity and Bank proxy',()=>{
 assert.match(airNote,/Altitude is inferred from static pressure/);assert.match(ahrsNote,/specific force/);assert.match(ahrsNote,/ideal supplied solution/);assert.match(ahrsNote,/not calculated from fabricated sensor streams/);assert.match(validityNote,/not independently validated/);assert.match(roadmapNote,/Phases 6–11.*separate/);
 assert.match(quantities.turn.modern[0].label,/REAL|Real measurand: angular rate/);assert.match(quantities.turn.modern[5].label,/no computed rate/);assert.deepEqual(components.map(c=>c[0]),stages);
});
