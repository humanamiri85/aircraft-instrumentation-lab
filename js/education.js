// One source of truth for controls, HUD fields, cue focus and teaching text.
export const instrumentLinks = {
  airspeed: {variables: ['airspeed'], cues: ['airspeed'], representation: 'Relative ground/reference motion', meaning: 'Higher indicated airspeed is represented by faster reference motion; the aircraft does not translate.', relationship: 'Airspeed changes the ASI pointer and the relative-motion cue.'},
  attitude: {variables: ['pitch', 'bank'], cues: ['attitude'], representation: 'Aircraft pitch and bank against the fixed world', meaning: 'Compare the nose and wings with the world reference to read attitude.', relationship: 'Pitch and bank change both the attitude indicator and the 3D aircraft orientation.'},
  altimeter: {variables: ['altitude'], cues: ['altitude'], representation: 'Compressed aircraft height, reference line and ground ring', meaning: 'The reference separation helps visualize altitude; it is not to scale.', relationship: 'Altitude changes the altimeter pointers and the aircraft’s compressed vertical position.'},
  turn: {variables: ['bank'], cues: ['attitude'], representation: 'Aircraft bank / simplified turn tendency', meaning: 'The lowered wing shows a bank-linked turn tendency, not a measured turn rate.', relationship: 'Bank drives the simplified turn tendency display. Actual turn rate is not simulated.'},
  heading: {variables: ['heading'], cues: ['heading'], representation: 'Fixed world compass and aircraft direction', meaning: 'Compare the aircraft nose with the fixed compass labels to read heading.', relationship: 'Heading rotates the compass card and the aircraft orientation relative to the fixed world reference.'},
  vsi: {variables: ['verticalSpeed'], cues: ['verticalSpeed'], representation: 'Climb/descent arrow and label', meaning: 'The arrow shows independently selected climb or descent; it does not move the aircraft vertically.', relationship: 'Vertical speed changes the VSI pointer and climb/descent cue without changing altitude.'}
};
export const cueGroups = ['attitude', 'heading', 'altitude', 'airspeed', 'verticalSpeed'];
export function initialFocus() {return {instrument: 'airspeed', enabled: true};}
export function selectFocus(state, instrument) {
  if (!Object.hasOwn(instrumentLinks, instrument)) throw new RangeError(`Unknown instrument: ${instrument}`);
  return {...state, instrument};
}
export function toggleFocus(state, enabled) {return {...state, enabled: Boolean(enabled)};}
export function linkedFocus(state) {
  const link = instrumentLinks[state.instrument];
  return {variables: state.enabled ? link.variables : [], cues: state.enabled ? link.cues : []};
}
