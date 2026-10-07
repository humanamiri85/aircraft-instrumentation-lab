import {mount, text, rotate, tick} from './svg.js';

// The fixed aircraft stays level on the face. Nose up lowers the horizon;
// right bank rotates the horizon counterclockwise relative to that aircraft.
export const attitudeTransform = (pitch, bank) => ({pitchOffset: pitch * 1.8, roll: -bank});
let nextClip = 0;

export function createAttitude(element) {
  const clip = `attitude-window-${nextClip++}`;
  const bankMarks = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]
    .map(angle => tick(angle, 78, angle % 30 === 0 ? 11 : 6)).join('');
  const ladder = [-20, -10, -5, 5, 10, 20].map(pitch => {
    const y = 100 - pitch * 1.8;
    const width = Math.abs(pitch) % 10 === 0 ? 20 : 10;
    return `<path d="M${100 - width} ${y}h${width * 2}" stroke="#fff9e8" stroke-width="1.5"/>` +
      (Math.abs(pitch) % 10 === 0 ? text(69, y + 3, Math.abs(pitch), 8) + text(131, y + 3, Math.abs(pitch), 8) : '');
  }).join('');
  const part = mount(element,
    `<defs>
      <clipPath id="${clip}"><circle cx="100" cy="100" r="80"/></clipPath>
      <clipPath id="${clip}-ladder"><circle cx="100" cy="100" r="60"/></clipPath>
    </defs>
    <g clip-path="url(#${clip})">
      <g data-part="bank">
        <g data-part="pitch" data-component="horizon">
          <rect x="-150" y="-200" width="500" height="300" fill="#4685aa"/>
          <rect x="-150" y="100" width="500" height="300" fill="#896347"/>
          <path d="M-150 100h500" stroke="#fff9e8" stroke-width="2"/>
        </g>
        <g clip-path="url(#${clip}-ladder)"><g data-part="pitchLadder" data-component="ladder">${ladder}</g></g>
        <path d="M100 26l-5 9h10Z" fill="#fff9e8"/>
      </g>
    </g>
    <path data-component="bankScale" d="M100 16l-4 7h8Z" fill="#e8bb74"/>
    <g data-component="bankScale">${bankMarks}</g>
    <path data-component="aircraft" d="M48 100h28l8 6m32 0l8 -6h28" fill="none" stroke="#302316" stroke-width="6"/>
    <path data-component="aircraft" d="M48 100h28l8 6m32 0l8 -6h28" fill="none" stroke="#f0c47e" stroke-width="3"/>
    <circle data-component="aircraft" cx="100" cy="100" r="4" fill="#f0c47e" stroke="#302316" stroke-width="1.5"/>`);
  return state => {
    const {pitchOffset, roll} = attitudeTransform(state.pitch, state.bank);
    rotate(part('bank'), roll);
    part('pitch').setAttribute('transform', `translate(0 ${pitchOffset})`);
    part('pitchLadder').setAttribute('transform', `translate(0 ${pitchOffset})`);
  };
}
