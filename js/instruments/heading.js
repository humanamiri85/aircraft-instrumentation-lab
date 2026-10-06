import {wrapHeading} from '../math.js';
import {mount, text, rotate, tick, point} from './svg.js';

export const headingCardAngle = heading => -wrapHeading(heading);

export function createHeading(element) {
  const card = Array.from({length: 36}, (_, i) => {
    const angle = i * 10, major = angle % 30 === 0;
    let marks = tick(angle, 80, major ? 11 : 6, major);
    if (major) {
      const [x, y] = point(angle, 58);
      const cardinal = {0: 'N', 90: 'E', 180: 'S', 270: 'W'}[angle];
      marks += text(x, y + 5, cardinal ?? angle / 10, cardinal ? 17 : 13, cardinal ? 'cardinal' : 'scale-number');
    }
    return marks;
  }).join('');
  const part = mount(element,
    `<g data-part="card">${card}</g>
    <path d="M100 17v13" stroke="#e8bb74" stroke-width="2"/>
    <path d="M100 31l-5 -7h10Z" fill="#e8bb74"/>
    <path d="M100 69l-4 7v18l-23 13v5l23 -6v17l-9 6v4l13 -3 13 3v-4l-9 -6v-17l23 6v-5l-23 -13V76Z" fill="#e9e9e2"/>
    ${text(100, 146, 'HEADING', 8, 'face-title')}`);
  return state => rotate(part('card'), headingCardAngle(state.heading));
}
