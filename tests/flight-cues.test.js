import test from 'node:test';
import assert from 'node:assert/strict';
import {altitudeHeight, airspeedRate, verticalCue, verticalLabel, flightLabels} from '../js/aircraft/flight-cues.js';
import {initialState, setVariable} from '../js/model.js';

test('altitude maps the teaching range into bounded scene heights', () => {
  for (const [input, expected] of [[0,0],[5000,1.5],[10000,3],[-50,0],[12000,3]]) assert.equal(altitudeHeight(input), expected);
});
test('airspeed produces increasingly fast bounded relative motion', () => {
  for (const [input, expected] of [[40,.6],[110,1.8],[180,3],[0,.6],[250,3]]) assert.ok(Math.abs(airspeedRate(input)-expected)<1e-10);
});
test('vertical cue distinguishes descent, level and climb without integration', () => {
  assert.deepEqual(verticalCue(-2000), {direction:-1,length:1.5});
  assert.deepEqual(verticalCue(0), {direction:0,length:0});
  assert.deepEqual(verticalCue(2000), {direction:1,length:1.5});
  assert.ok(verticalCue(1000).length < verticalCue(2000).length);
  assert.equal(verticalLabel(-800), 'DESCENT -800 ft/min');
  assert.equal(verticalLabel(0), 'LEVEL 0 ft/min');
  assert.equal(verticalLabel(1000), 'CLIMB +1000 ft/min');
});
test('HUD formats north wrap, bank direction, level, and signed readings', () => {
  const state={...initialState(),airspeed:150,altitude:6500,verticalSpeed:1000,pitch:8,bank:20,heading:45};
  assert.deepEqual(flightLabels(state), {airspeed:'150 kt',altitude:'6500 ft',verticalSpeed:'+1000 fpm',pitch:'+8°',bank:'R 20°',heading:'045°'});
  assert.equal(flightLabels({...state,bank:-30,heading:359.8,verticalSpeed:-1500}).bank,'L 30°');
  assert.equal(flightLabels({...state,heading:359.8}).heading,'000°');
  assert.equal(flightLabels({...state,bank:0,verticalSpeed:0}).bank,'Wings Level');
  assert.equal(flightLabels({...state,verticalSpeed:0}).verticalSpeed,'Level');
});
test('all six variables and visualization mappings remain independent', () => {
  for (const [key, value] of Object.entries({airspeed:180,altitude:10000,verticalSpeed:2000,pitch:20,bank:45,heading:90})) {
    const state=initialState(), before={...state};
    setVariable(state,key,value);
    altitudeHeight(state.altitude); airspeedRate(state.airspeed); verticalCue(state.verticalSpeed); flightLabels(state);
    assert.deepEqual(state,{...before,[key]:value});
  }
});
