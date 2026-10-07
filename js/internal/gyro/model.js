import {Euler, Quaternion, Vector3} from '../../../vendor/three/three.core.js';
import {aviationRotation} from '../../aircraft/orientation.js';

// Same aviation mapping as the aircraft view; all sign conversions live there.
export const BODY_AXES = Object.freeze({longitudinal:[0,0,-1], lateral:[1,0,0], vertical:[0,1,0]});
export const GYRO_REFERENCE = Object.freeze([0,0,-1]);
export function normalizedAxis(axis) {
  const vector = new Vector3(...axis);
  if (!axis.every(Number.isFinite) || vector.lengthSq() === 0) throw new RangeError('Axis must be finite and nonzero');
  return vector.normalize();
}
export function bodyQuaternion(state) {
  const r = aviationRotation(state);
  return new Quaternion().setFromEuler(new Euler(r.x,r.y,r.z,r.order));
}
export function gyroState(state) {
  const body = bodyQuaternion(state);
  const worldSpin = normalizedAxis(GYRO_REFERENCE);
  const bodySpin = worldSpin.clone().applyQuaternion(body.clone().invert());
  // Outer bearing turns about body +Y, inner bearing about outer-local +X.
  // This two-angle pointing solution keeps the spin axis fixed, not rotor roll.
  const outer = Math.atan2(-bodySpin.x, -bodySpin.z);
  const inner = Math.asin(Math.max(-1, Math.min(1, bodySpin.y)));
  const outerRotation = new Quaternion().setFromAxisAngle(new Vector3(0,1,0), outer);
  const innerRotation = new Quaternion().setFromAxisAngle(new Vector3(1,0,0), inner);
  const rotor = body.clone().multiply(outerRotation).multiply(innerRotation);
  const axes = Object.fromEntries(Object.entries(BODY_AXES).map(([key,axis])=>[key,normalizedAxis(axis).applyQuaternion(body)]));
  return {body, rotor, outer, inner, axes, worldSpin, bodySpin,
    outerAxis:new Vector3(0,1,0).applyQuaternion(body),
    innerAxis:new Vector3(1,0,0).applyQuaternion(body.clone().multiply(outerRotation))};
}
export function advanceSpin(phase, dt, reduced=false) {
  // Deliberately slow visual cue, not an instrument rotor's physical RPM.
  return reduced ? 0 : (phase + Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1))*1.2) % (2*Math.PI);
}
