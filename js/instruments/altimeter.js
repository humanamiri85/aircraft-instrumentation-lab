import {mount, scale, text, needle, hub, rotate} from './svg.js';

// Continuous rotations: one revolution per 1,000 / 10,000 / 100,000 ft.
export const altitudeAngles = altitude => ({
  hundreds: altitude / 1000 * 360,
  thousands: altitude / 10000 * 360,
  tenThousands: altitude / 100000 * 360
});

export function createAltimeter(element) {
  const part = mount(element,
    scale(0, 980, 20, value => value / 1000 * 360, 5, value => value / 100) +
    text(100, 70, 'ALTITUDE', 9, 'face-title') + text(100, 140, 'FEET', 9) +
    '<rect x="126" y="90" width="35" height="19" rx="2" fill="#20272a" stroke="#747c7d"/>' +
    text(143.5, 103, '29.92', 8) +
    '<g data-part="tenThousands"><path d="M100 110V29M100 23l-5 10h10Z" fill="none" stroke="#e8bb74" stroke-width="2"/></g>' +
    needle('thousands', 43, 5) + needle('hundreds', 72, 2.5) + hub);
  return state => {
    const angles = altitudeAngles(state.altitude);
    for (const key of Object.keys(angles)) rotate(part(key), angles[key]);
  };
}
