import {wrapHeading,headingDelta} from '../../math.js';
import {headingCardAngle} from '../../instruments/heading.js';
import {directionalReference} from '../gyro/reference.js';
export {advanceSpin} from '../gyro/motion.js';

// Unwrapped angles keep successive SVG orientations continuous across north.
export function continuousHeading(previous,heading) {
  const normalized=wrapHeading(Number.isFinite(heading)?heading:0);
  return Number.isFinite(previous)?previous+headingDelta(previous,normalized):normalized;
}
export function mechanismState(state,previous) {
  const heading=wrapHeading(Number.isFinite(state.heading)?state.heading:0);
  const caseAngle=continuousHeading(previous,heading);
  // A yaw-only projection of the shared directional gyro: pitch/bank are not inputs.
  const reference=directionalReference({heading});
  return {heading,caseAngle,cardAngle:headingCardAngle(heading),continuousCardAngle:-caseAngle,
    reference,reading:`${String(Math.round(heading)%360).padStart(3,'0')}°`};
}
