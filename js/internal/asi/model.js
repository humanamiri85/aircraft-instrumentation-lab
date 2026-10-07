import {clamp} from '../../math.js';
import {airspeedAngle} from '../../instruments/airspeed.js';

export const KNOT_TO_MPS = 1852 / 3600;
export const REFERENCE_DENSITY = 1.225; // kg/m³; fixed sea-level teaching reference.
export const IAS_BOUNDS = {min: 40, max: 180};
export const knotsToMetresPerSecond = knots => knots * KNOT_TO_MPS;
export function dynamicPressure(knots) {
  const speed = knotsToMetresPerSecond(knots);
  return 0.5 * REFERENCE_DENSITY * speed ** 2;
}

// Visual travel is deliberately NOT a calibrated mechanical displacement.
// q/q(180) gives a small nonzero deflection at 40 kt and full travel at 180 kt.
// Non-finite inputs use the initial IAS; out-of-range inputs clamp to control limits.
export function mechanismState(airspeed) {
  const ias = clamp(Number.isFinite(airspeed) ? airspeed : 110, IAS_BOUNDS.min, IAS_BOUNDS.max);
  const pressure = dynamicPressure(ias);
  const deflection = clamp(pressure / dynamicPressure(IAS_BOUNDS.max), 0, 1);
  const leverAngle = -18 + 36 * deflection;
  const radians = leverAngle * Math.PI / 180;
  // Connecting link meets a lever whose pivot is fixed at (290, 260).
  const leverTip = {x: 290 - 56 * Math.cos(radians) - 28 * Math.sin(radians),
    y: 260 - 56 * Math.sin(radians) + 28 * Math.cos(radians)};
  return {ias, pressure, deflection, capsuleEnd: 190 + 32 * deflection,
    leverAngle, leverTip, pointerAngle: airspeedAngle(ias)};
}
