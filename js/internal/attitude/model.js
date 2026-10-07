import {attitudeTransform} from '../../instruments/attitude.js';
import {verticalReference} from '../gyro/reference.js';
export {advanceSpin} from '../gyro/motion.js';

export function mechanismState(state) {
  const pitch=Math.max(-20,Math.min(20,Number.isFinite(state.pitch)?state.pitch:0));
  const bank=Math.max(-45,Math.min(45,Number.isFinite(state.bank)?state.bank:0));
  return {pitch,bank,reference:verticalReference({pitch,bank}),
    display:attitudeTransform(pitch,bank),casePitch:-pitch,caseBank:bank};
}
