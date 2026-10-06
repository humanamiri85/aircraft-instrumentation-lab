import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, setVariable, smoothState, variables} from '../js/model.js';
import {headingDelta, wrapHeading} from '../js/math.js';
import {airspeedAngle, trainingSpeeds} from '../js/instruments/airspeed.js';
import {attitudeTransform} from '../js/instruments/attitude.js';
import {altitudeAngles} from '../js/instruments/altimeter.js';
import {headingCardAngle} from '../js/instruments/heading.js';
import {turnAngle} from '../js/instruments/turn.js';
import {vsiAngle} from '../js/instruments/vsi.js';
import {point} from '../js/instruments/svg.js';
import {instruments} from '../js/catalog.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

test('airspeed increases clockwise, including 40 and 180 kt; arcs are ordered', () => {
  near(airspeedAngle(40), 66);
  near(airspeedAngle(180), 297);
  for (let speed = 40; speed < 180; speed++) assert.ok(airspeedAngle(speed + 1) > airspeedAngle(speed));
  assert.deepEqual(Object.values(trainingSpeeds), [45, 55, 95, 130, 175]);
});

test('nose-up lowers horizon; right bank raises its right side', () => {
  assert.deepEqual(attitudeTransform(20, 45), {pitchOffset: 36, roll: -45});
  assert.deepEqual(attitudeTransform(-20, -45), {pitchOffset: -36, roll: 45});
  // SVG rotation of a point on the right-hand horizon; screen Y grows downward.
  const rightY = roll => 100 + 50 * Math.sin(roll * Math.PI / 180);
  assert.ok(rightY(attitudeTransform(0, 45).roll) < 100);
  assert.ok(rightY(attitudeTransform(0, -45).roll) > 100);
});

test('altimeter hands have continuous 100:10:1 ratios and correct endpoints', () => {
  assert.deepEqual(altitudeAngles(0), {hundreds: 0, thousands: 0, tenThousands: 0});
  assert.deepEqual(altitudeAngles(10000), {hundreds: 3600, thousands: 360, tenThousands: 36});
  const a = altitudeAngles(3450);
  near(a.hundreds, 1242); near(a.thousands, 124.2); near(a.tenThousands, 12.42);
  near(a.hundreds / a.thousands, 10); near(a.thousands / a.tenThousands, 10);
});

test('compass card counterrotates to place selected heading at the fixed index', () => {
  for (const heading of [0, 90, 180, 270, 359]) near(wrapHeading(heading + headingCardAngle(heading)), 0);
  assert.equal(headingCardAngle(359), -359);
  near(headingCardAngle(360), 0);
});

test('heading smoothing crosses north by the shortest path in both directions', () => {
  assert.equal(headingDelta(359, 0), 1);
  assert.equal(headingDelta(0, 359), -1);
  for (const [from, to] of [[359, 0], [0, 359]]) {
    const current = {...initialState(), heading: from}, target = {...current, heading: to};
    smoothState(current, target, 1 / 60);
    assert.ok(Math.abs(headingDelta(current.heading, to)) < 1);
    assert.ok(current.heading >= 0 && current.heading < 360);
    for (let i = 0; i < 120; i++) smoothState(current, target, 1 / 60);
    near(current.heading, to);
  }
});

test('VSI zero is left, climb is upper arc, descent is lower arc at all scale points', () => {
  near(vsiAngle(0), -90);
  near(vsiAngle(2000), 80); near(vsiAngle(-2000), -260);
  for (let speed = 100; speed <= 2000; speed += 100) {
    assert.ok(point(vsiAngle(speed))[1] < 100);
    assert.ok(point(vsiAngle(-speed))[1] > 100);
  }
});

test('turn airplane drops the right wing on right bank and left wing on left bank', () => {
  near(turnAngle(-45), -30); near(turnAngle(0), 0); near(turnAngle(45), 30);
  near(turnAngle(30), 20);
  assert.ok(point(90 + turnAngle(45))[1] > 100);
  assert.ok(point(-90 + turnAngle(-45))[1] > 100);
});

test('all six control bounds clamp and invalid inputs do not alter state', () => {
  for (const spec of variables) {
    const state = initialState();
    setVariable(state, spec.key, spec.min - 100); assert.equal(state[spec.key], spec.min);
    setVariable(state, spec.key, spec.max + 100); assert.equal(state[spec.key], spec.max);
    setVariable(state, spec.key, NaN); assert.equal(state[spec.key], spec.max);
  }
});

test('normal animation interpolates; reduced motion immediately reaches every target', () => {
  const current = initialState(), target = Object.fromEntries(variables.map(v => [v.key, v.max]));
  smoothState(current, target, 1 / 60);
  assert.ok(current.airspeed > 110 && current.airspeed < 180);
  assert.ok(current.pitch > 0 && current.pitch < 20);
  smoothState(current, target, 1 / 60, true);
  assert.deepEqual(current, target);
});

test('six instruments provide the three educational fields and numeric readings', () => {
  assert.equal(instruments.length, 6);
  for (const instrument of instruments) {
    assert.ok(instrument.quantity && instrument.unit && instrument.interpretation);
    assert.ok(instrument.read(initialState()));
  }
  const heading = instruments.find(i => i.id === 'heading');
  assert.equal(heading.read({...initialState(), heading: 359.8}), '000°');
});
