import {clamp} from '../../math.js';
import {altitudeAngles} from '../../instruments/altimeter.js';

// Dry standard troposphere: hydrostatic balance + ideal gas, constant lapse rate.
export const ATMOSPHERE = Object.freeze({p0:101325, t0:288.15, lapse:0.0065, gravity:9.80665, gasConstant:287.05});
export const FEET_TO_METRES = 0.3048;
export const ALTITUDE_BOUNDS = Object.freeze({min:0, max:10000});
const boundedAltitude = altitude => clamp(Number.isFinite(altitude) ? altitude : 3500, 0, 10000);
export function staticPressure(altitude) {
  const {p0,t0,lapse,gravity,gasConstant}=ATMOSPHERE;
  const height=boundedAltitude(altitude)*FEET_TO_METRES;
  return p0*(1-lapse*height/t0)**(gravity/(gasConstant*lapse));
}

// Pressure deficit is normalized over the control range. This is visual travel,
// not an aneroid constitutive law, calibrated displacement or certified geometry.
export function capsuleExpansion(pressure) {
  const p=Number.isFinite(pressure) ? pressure : staticPressure(3500);
  return clamp((ATMOSPHERE.p0-p)/(ATMOSPHERE.p0-staticPressure(10000)),0,1);
}
export function mechanismState(altitude) {
  const feet=boundedAltitude(altitude);
  const pressure=staticPressure(feet);
  const expansion=capsuleExpansion(pressure);
  const waferWidth=18+10*expansion;
  const capsuleEnd=140+3*waferWidth+8;
  // Slider/lever geometry keeps both the 65-unit lever and 80-unit link rigid.
  // Distances are teaching drawing units, not actual instrument dimensions.
  const distance=335-capsuleEnd;
  const offset=(distance**2+65**2-80**2)/(2*distance);
  const leverAngle=Math.acos(offset/65)*180/Math.PI;
  const leverTip={x:335-offset, y:250+Math.sqrt(65**2-offset**2)};
  return {altitude:feet,pressure,expansion,waferWidth,capsuleEnd,leverAngle,leverTip,angles:altitudeAngles(feet)};
}
