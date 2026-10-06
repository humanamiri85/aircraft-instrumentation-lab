import {mapRange} from '../math.js';
import {mount, text, rotate, point} from './svg.js';

// Bank is a qualitative teaching input; ±30° bank aligns with the reference
// marks but does not calculate or assert an actual standard turn rate.
export const turnAngle = bank => mapRange(bank, -45, 45, -30, 30);

export function createTurn(element) {
  const references = [-110, 110].map(angle => {
    const a = point(angle, 69), b = point(angle, 58);
    return `<path d="M${a}L${b}" stroke="#eeeae1" stroke-width="3"/>`;
  }).join('');
  const part = mount(element,
    text(100, 49, 'TURN COORDINATOR', 8, 'face-title') + text(100, 65, '2 MIN', 8) +
    '<path d="M31 100h12m114 0h12" stroke="#eeeae1" stroke-width="2"/>' +
    references +
    '<g data-part="plane"><path d="M97 82Q100 76 103 82l2 15 41 5v5l-42 -3v15l11 5v4l-15 -3 -15 3v-4l11 -5v-15l-42 3v-5l41 -5Z" fill="#f1f0e8"/></g>' +
    text(39, 137, 'L', 13) + text(161, 137, 'R', 13) +
    '<path d="M61 144Q100 154 139 144v14Q100 169 61 158Z" fill="#c8d0cd" stroke="#f0f1e7"/>' +
    '<path d="M91 148v13m18 -13v13" stroke="#343b3d" stroke-width="1.5"/>' +
    '<circle data-part="ball" cx="100" cy="155" r="6" fill="#101416"/>' +
    text(100, 177, 'BALL FIXED · DEMO', 7));
  return state => rotate(part('plane'), turnAngle(state.bank));
}
