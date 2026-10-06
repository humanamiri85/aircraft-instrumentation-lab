import {clamp, lerp, wrapHeading, headingDelta} from './math.js';

// Pure flight state and time-based indication smoothing, independent of the DOM.
export const variables = [
  {key: 'airspeed', label: 'Airspeed', min: 40, max: 180, step: 1, unit: 'kt', initial: 110},
  {key: 'altitude', label: 'Altitude', min: 0, max: 10000, step: 50, unit: 'ft', initial: 3500},
  {key: 'verticalSpeed', label: 'Vertical speed', min: -2000, max: 2000, step: 50, unit: 'ft/min', initial: 0},
  {key: 'pitch', label: 'Pitch', min: -20, max: 20, step: 1, unit: '°', initial: 0},
  {key: 'bank', label: 'Bank angle', min: -45, max: 45, step: 1, unit: '°', initial: 0},
  {key: 'heading', label: 'Heading', min: 0, max: 359, step: 1, unit: '°', initial: 270}
];
export const initialState = () => Object.fromEntries(variables.map(v => [v.key, v.initial]));

export function setVariable(state, key, value) {
  const spec = variables.find(v => v.key === key);
  if (!spec || !Number.isFinite(value)) return;
  state[key] = clamp(value, spec.min, spec.max);
}

export function smoothState(current, target, dt, reducedMotion = false) {
  const alpha = reducedMotion ? 1 : 1 - Math.exp(-clamp(dt, 0, 0.1) * 12);
  for (const key of Object.keys(target)) {
    const delta = key === 'heading' ? headingDelta(current[key], target[key]) : target[key] - current[key];
    current[key] = lerp(current[key], current[key] + delta, alpha);
    if (Math.abs(delta) < 0.01) current[key] = target[key];
    if (key === 'heading') current[key] = wrapHeading(current[key]);
  }
  return current;
}
