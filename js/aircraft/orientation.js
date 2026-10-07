import {wrapHeading} from '../math.js';
export const radians = degrees => degrees * Math.PI / 180;
// World: +X east, +Y up, -Z north. Aircraft: -Z nose, +X right wing.
// Intrinsic YXZ: heading about world up, pitch about heading-local right,
// then bank about aircraft forward. Positive pitch raises nose, positive
// bank lowers right wing; heading increases clockwise from north.
export function aviationRotation({pitch, bank, heading}) {
  return {x: radians(pitch), y: -radians(wrapHeading(heading)), z: -radians(bank), order: 'YXZ'};
}
export function attitudeLabels({pitch, bank, heading}) {
  const p = Math.round(pitch), b = Math.round(bank);
  return {pitch: `${p > 0 ? '+' : ''}${p}°`, bank: b === 0 ? 'Wings Level' : `${Math.abs(b)}° ${b > 0 ? 'Right' : 'Left'}`, heading: `${String(Math.round(wrapHeading(heading)) % 360).padStart(3, '0')}°`};
}
