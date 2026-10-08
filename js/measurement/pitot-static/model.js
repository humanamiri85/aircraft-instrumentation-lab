import {mechanismState as asiState} from '../../internal/asi/model.js';
import {mechanismState as altimeterState} from '../../internal/altimeter/model.js';
import {mechanismState as vsiState} from '../../internal/vsi/model.js';

// Pressure sources are physical reference calculations; the VSI remains a
// normalized moving-reference teaching model, never an absolute pressure drift.
export const routes=Object.freeze({
  airspeed:Object.freeze(['pitot','static']),
  altimeter:Object.freeze(['static']),
  vsi:Object.freeze(['static'])
});
export function systemState(state,lag) {
  const asi=asiState(state.airspeed),altimeter=altimeterState(state.altitude),vsi=vsiState(lag,state.verticalSpeed);
  return {airspeed:asi.ias,altitude:altimeter.altitude,verticalSpeed:vsi.input,
    ps:altimeter.pressure,q:asi.pressure,pt:altimeter.pressure+asi.pressure,
    trend:vsi.input>0?'Decreasing':vsi.input<0?'Increasing':'Stable',
    vsiDifferential:vsi.differential,vsiIndicated:vsi.indicated};
}
export function focusedRegions(instrument) {
  return ['free-stream','static-port','static-pressure','static-line',`${instrument}-connection`,
    ...(routes[instrument]?.includes('pitot')?['pitot-tube','total-pressure','pitot-line']:[])];
}
