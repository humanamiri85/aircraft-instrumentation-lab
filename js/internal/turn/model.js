import {clamp} from '../../math.js';
import {turnAngle} from '../../instruments/turn.js';
export {advanceSpin} from '../gyro/motion.js';

// Quasi-static conceptual equilibrium, not angular momentum or flight dynamics.
// Bank is ONLY a proxy; these angles and spring loads are visual units.
export function mechanismState(state) {
  const bank=clamp(Number.isFinite(state.bank)?state.bank:0,-45,45);
  const rateProxy=bank/45;
  return {bank,rateProxy,gimbalAngle:rateProxy*18,springLoad:Math.abs(rateProxy),
    symbolAngle:turnAngle(bank),ballOffset:0,
    direction:rateProxy>0?'Right':rateProxy<0?'Left':'Neutral'};
}
