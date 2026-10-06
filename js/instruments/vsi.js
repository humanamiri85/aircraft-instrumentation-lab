import {mapRange} from '../math.js';
import {mount, scale, text, needle, hub, rotate} from './svg.js';

// Zero points left; climb moves up the upper semicircle, descent down the lower.
export const vsiAngle = value => mapRange(value, -2000, 2000, -260, 80);

export function createVSI(element) {
  const part = mount(element,
    scale(-2000, 2000, 100, vsiAngle, 5, value => Math.abs(value / 1000)) +
    text(120, 82, 'VERTICAL', 8, 'face-title') + text(120, 94, 'SPEED', 8, 'face-title') +
    text(112, 119, '1000 FT/MIN', 7) +
    text(75, 77, 'UP', 8) + text(75, 129, 'DOWN', 8) +
    needle('pointer', 73, 2.5) + hub);
  return state => rotate(part('pointer'), vsiAngle(state.verticalSpeed));
}
