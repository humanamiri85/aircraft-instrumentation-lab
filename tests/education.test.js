import test from 'node:test';
import assert from 'node:assert/strict';
import {instrumentLinks, initialFocus, selectFocus, toggleFocus, linkedFocus, cueGroups} from '../js/education.js';
const mappings={airspeed:['airspeed'],attitude:['pitch','bank'],altimeter:['altitude'],turn:['bank'],heading:['heading'],vsi:['verticalSpeed']};
for(const [id,variables] of Object.entries(mappings)) test(`${id} links the correct controls and HUD variables`,()=>{
  const focus=selectFocus(initialFocus(),id);
  assert.deepEqual(linkedFocus(focus).variables,variables);
  assert.deepEqual(instrumentLinks[id].variables,variables);
  assert.ok(instrumentLinks[id].cues.every(cue=>cueGroups.includes(cue)));
});
test('teaching focus switches off and restores the selected links',()=>{
  const selected=selectFocus(initialFocus(),'attitude');
  const off=toggleFocus(selected,false);
  assert.deepEqual(linkedFocus(off),{variables:[],cues:[]});
  assert.equal(off.instrument,'attitude');
  assert.deepEqual(linkedFocus(toggleFocus(off,true)),{variables:['pitch','bank'],cues:['attitude']});
});
test('changing selection replaces all previous links',()=>{
  const focus=selectFocus(selectFocus(initialFocus(),'attitude'),'vsi');
  assert.deepEqual(linkedFocus(focus),{variables:['verticalSpeed'],cues:['verticalSpeed']});
  assert.throws(()=>selectFocus(focus,'unknown'),RangeError);
});
