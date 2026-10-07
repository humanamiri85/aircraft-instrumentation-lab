import {clamp} from '../math.js';
import {attitudeLabels} from './orientation.js';

export const GROUND_Y = -2.3;
// Compressed teaching scale: 0–10,000 ft becomes 0–3 scene units above
// a 2.3-unit ground clearance. This clearance keeps banked wings off the plane.
// Neither this mapping nor environmental motion represents physical distance.
export const altitudeHeight = altitude => 3 * clamp(altitude, 0, 10000) / 10000;
// Relative reference-line motion: 40/110/180 kt -> 0.6/1.8/3 units/sec.
export const airspeedRate = airspeed => 0.6 + 2.4 * (clamp(airspeed, 40, 180) - 40) / 140;
export function verticalCue(verticalSpeed) {
  const speed = clamp(verticalSpeed, -2000, 2000);
  return {direction: Math.sign(speed), length: speed === 0 ? 0 : 0.45 + 1.05 * Math.abs(speed) / 2000};
}
export function verticalLabel(verticalSpeed) {
  const speed = Math.round(verticalSpeed);
  return speed === 0 ? 'LEVEL 0 ft/min' : `${speed > 0 ? 'CLIMB +' : 'DESCENT '}${speed} ft/min`;
}
export function flightLabels(state) {
  const attitude = attitudeLabels(state);
  const bank = Math.round(state.bank), vs = Math.round(state.verticalSpeed);
  return {...attitude,
    bank: bank === 0 ? 'Wings Level' : `${bank > 0 ? 'R' : 'L'} ${Math.abs(bank)}°`,
    airspeed: `${Math.round(state.airspeed)} kt`,
    altitude: `${Math.round(state.altitude)} ft`,
    verticalSpeed: vs === 0 ? 'Level' : `${vs > 0 ? '+' : ''}${vs} fpm`
  };
}
