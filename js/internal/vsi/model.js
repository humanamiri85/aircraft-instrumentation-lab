import {clamp} from '../../math.js';
import {vsiAngle} from '../../instruments/vsi.js';

// Educational moving pressure reference: diaphragm follows ambient immediately.
// d(Pambient)/dt = -v/2000 / tau; case follows ambient with a first-order lag.
// Thus d(case - diaphragm)/dt = (v/2000 - differential)/tau.
// Common pressure drift is omitted: this never integrates aircraft altitude.
export const LAG_SECONDS = 1.5;
export const boundedSpeed = v => clamp(Number.isFinite(v) ? v : 0, -2000, 2000);
export const initialLag = () => ({differential:0});
export function advanceLag(state, speed, dt, reducedMotion=false) {
  const input=boundedSpeed(speed)/2000;
  const previous=clamp(Number.isFinite(state?.differential)?state.differential:0,-1,1);
  const seconds=Number.isFinite(dt)?Math.max(0,dt):0;
  const differential=reducedMotion?input:input+(previous-input)*Math.exp(-seconds/LAG_SECONDS);
  return {differential:clamp(differential,-1,1)};
}
export function mechanismState(state, speed) {
  const input=boundedSpeed(speed);
  const differential=clamp(Number.isFinite(state?.differential)?state.differential:0,-1,1);
  const indicated=2000*differential;
  return {input,differential,indicated,angle:vsiAngle(indicated),displacement:32*differential,
    trend:input>0?'Decreasing · climb':input<0?'Increasing · descent':'Constant · pressures equalizing',
    // Relative pressures share a moving midpoint reference, not absolute units.
    diaphragm:-differential/2,case:differential/2};
}
