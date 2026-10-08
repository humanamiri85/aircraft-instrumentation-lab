import test from 'node:test';
import assert from 'node:assert/strict';
import {systemState,routes,focusedRegions} from '../js/measurement/pitot-static/model.js';
import {dynamicPressure} from '../js/internal/asi/model.js';
import {staticPressure} from '../js/internal/altimeter/model.js';
import {initialLag,advanceLag,mechanismState} from '../js/internal/vsi/model.js';
import {initialState} from '../js/model.js';

test('system pressures reuse Phase 3 references over all representative inputs',()=>{
  for(const airspeed of [40,110,180])for(const altitude of [0,5000,10000])for(const verticalSpeed of [-1000,0,1000]) {
    const m=systemState({...initialState(),airspeed,altitude,verticalSpeed},initialLag());
    assert.equal(m.q,dynamicPressure(airspeed));assert.equal(m.ps,staticPressure(altitude));
    assert.ok(m.q>=0);assert.ok(m.pt>=m.ps);assert.ok(Math.abs(m.pt-m.ps-m.q)<1e-9);
    assert.equal(m.trend,verticalSpeed>0?'Decreasing':verticalSpeed<0?'Increasing':'Stable');
  }
  const pressures=[0,5000,10000].map(altitude=>systemState({...initialState(),altitude},initialLag()).ps);
  assert.ok(pressures[0]>pressures[1]&&pressures[1]>pressures[2]);
});
test('ASI receives total and static; altimeter and VSI receive static only',()=>{
  assert.deepEqual(routes,{airspeed:['pitot','static'],altimeter:['static'],vsi:['static']});
  for(const instrument of ['altimeter','vsi']) {
    assert.ok(!focusedRegions(instrument).includes('pitot-line'));
    assert.ok(!focusedRegions(instrument).includes('pitot-tube'));
  }
  assert.ok(focusedRegions('airspeed').includes('pitot-line'));
  assert.ok(focusedRegions('airspeed').includes('static-line'));
});
test('system VSI uses shared lag, including neutral recovery and reduced motion',()=>{
  for(const verticalSpeed of [-1000,1000]) {
    const lag=advanceLag(initialLag(),verticalSpeed,0.7);
    const m=systemState({...initialState(),verticalSpeed},lag),existing=mechanismState(lag,verticalSpeed);
    assert.equal(m.vsiDifferential,existing.differential);assert.equal(m.vsiIndicated,existing.indicated);
    assert.equal(Math.sign(m.vsiIndicated),Math.sign(verticalSpeed));
    const recovery=systemState(initialState(),advanceLag(lag,0,1));
    assert.equal(recovery.trend,'Stable');assert.ok(Math.abs(recovery.vsiDifferential)<Math.abs(m.vsiDifferential));
    assert.equal(systemState({...initialState(),verticalSpeed},advanceLag(lag,verticalSpeed,0,true)).vsiIndicated,verticalSpeed);
  }
});
test('independent controls do not create altitude, ASI or VSI physics coupling',()=>{
  const base=initialState(),lag=advanceLag(initialLag(),1000,1),m=systemState(base,lag);
  const altitude=systemState({...base,altitude:10000},lag);
  assert.equal(altitude.q,m.q);assert.equal(altitude.vsiDifferential,m.vsiDifferential);
  const speed=systemState({...base,airspeed:180},lag);
  assert.equal(speed.ps,m.ps);assert.equal(speed.vsiIndicated,m.vsiIndicated);
  const climb=systemState({...base,verticalSpeed:1000},lag);
  assert.equal(climb.ps,m.ps);assert.equal(climb.pt,m.pt);assert.equal(climb.altitude,m.altitude);
  assert.deepEqual(systemState({...base,pitch:20,bank:45,heading:90},lag),m);
});
