import {mechanismState as attitudeState} from '../../internal/attitude/model.js';
import {mechanismState as headingState} from '../../internal/heading/model.js';
import {mechanismState as turnState} from '../../internal/turn/model.js';

// Read-only family adapter: all physics, signs and bounded mappings remain Phase 3's.
export const referenceTypes=Object.freeze({attitude:'vertical',heading:'directional',turn:'restrained-rate'});
export function systemState(state,previousHeading) {
  return {attitude:attitudeState(state),heading:headingState(state,previousHeading),turn:turnState(state)};
}
export function focusedPaths(instrument) {return [instrument];}
