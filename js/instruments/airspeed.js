import {mapRange} from '../math.js';
import {mount, scale, arc, text, needle, hub, rotate, point} from './svg.js';

// Generic teaching scale and limits, not certified aircraft specifications.
export const trainingSpeeds = {stallLanding: 45, stallClean: 55, flapLimit: 95, cruiseLimit: 130, neverExceed: 175};
export const airspeedAngle = value => mapRange(value, 0, 200, 0, 330);

export function createAirspeed(element) {
  const speeds = trainingSpeeds;
  const redStart = point(airspeedAngle(speeds.neverExceed), 73);
  const redEnd = point(airspeedAngle(speeds.neverExceed), 88);
  const part = mount(element,
    arc(airspeedAngle(speeds.stallLanding), airspeedAngle(speeds.flapLimit), 82, '#f2f1e9', 4) +
    arc(airspeedAngle(speeds.stallClean), airspeedAngle(speeds.cruiseLimit), 87, '#6cb985', 4) +
    arc(airspeedAngle(speeds.cruiseLimit), airspeedAngle(speeds.neverExceed), 87, '#e1c45c', 4) +
    scale(0, 200, 5, airspeedAngle, 4) +
    `<path d="M${redStart}L${redEnd}" stroke="#ef6356" stroke-width="3"/>` +
    text(100, 123, 'AIRSPEED', 10, 'face-title') + text(100, 136, 'KNOTS', 9) +
    needle('pointer', 73, 3) + hub);
  return state => rotate(part('pointer'), airspeedAngle(state.airspeed));
}
