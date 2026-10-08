import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarios,candidates,seededScenario,startSession,experiment,plausibleCandidates,evaluate,markCandidate,evidenceRows,candidateEvidence,visibleCandidates,errorCategories} from '../js/diagnostics/model.js';
import {debrief,hints} from '../js/diagnostics/content.js';
import * as pressure from '../js/faults/pitot-static/model.js';
import * as gyro from '../js/faults/gyro/model.js';
import {instruments as metadata} from '../js/measurement/comparison/model.js';
const session=(id,mode='mixed')=>startSession(seededScenario(id,42),mode);
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('diagnostic definitions: immutable balanced cases, valid bounded inputs / real faults / stable chain attachments',()=>{
 assert.ok(errorCategories.includes('lag'));assert.equal(candidates['hi-drift'].timePattern,'time-accumulating');assert.equal(candidates['hi-drive'].timePattern,'decaying');assert.ok(scenarios.length>=12);assert.equal(new Set(scenarios.map(s=>s.id)).size,scenarios.length);
 assert.equal(scenarios.filter(s=>s.faultFamily==='pitot-static').length,7);
 for(const s of scenarios){assert.ok(Object.isFrozen(s));assert.ok(Object.isFrozen(s.initialFlightState));assert.ok(s.candidateFaults.includes(s.hiddenFaultId));assert.equal(candidates[s.hiddenFaultId].family,s.faultFamily);
 for(const id of s.candidateFaults){const c=candidates[id];assert.ok(c);if(c.family==='pitot-static')assert.ok(pressure.definitions[c.type]);else assert.ok(gyro.definitions[c.type].instruments.includes(c.instrument));assert.ok(metadata[c.instrument].chain.some(x=>x.element===c.element));}
 const p=gyro.parameters(s.faultParameters);for(const key of Object.keys(p))assert.equal(p[key],s.faultParameters[key]);assert.ok(s.faultParameters.severity>0&&s.faultParameters.severity<1);
 for(const key of ['pitch','bank','heading','airspeed','altitude','verticalSpeed'])assert.ok(Number.isFinite(s.initialFlightState[key]));
 }
});
test('seeded randomization is deterministic and preserves safe observability for 100 seeds',()=>{
 assert.deepEqual(seededScenario('speed-experiment',9),seededScenario('speed-experiment',9));assert.notDeepEqual(seededScenario('speed-experiment',9),seededScenario('speed-experiment',10));
 for(let seed=0;seed<100;seed++)for(const s of scenarios){const variant=seededScenario(s.id,seed),v=startSession(variant);assert.ok(variant.initialFlightState.airspeed>=40&&variant.initialFlightState.airspeed<=180);if(s.id!=='more-evidence')assert.deepEqual(plausibleCandidates(v),[s.hiddenFaultId]);}
 assert.throws(()=>seededScenario('unsupported'),RangeError);
});
test('all unique diagnostic cases accept the correct hypothesis and distinguish the family',()=>{
 for(const def of scenarios.filter(s=>s.id!=='more-evidence')){const s=session(def.id);assert.equal(evaluate(s,def.hiddenFaultId,def.faultFamily).status,'CORRECT');assert.equal(s.attempts,1);const d=debrief(s);assert.ok(d.fits.length>30);assert.match(d.trust,/INDICATION ≠ TRUTH/);}
 assert.equal(evaluate(session('heading-over-time'),'hi-drift','pitot-static').status,'PARTIALLY SUPPORTED');
});
test('wrong hypotheses distinguish shared static / pitot, drift / drive, bias / drive and isolated TC',()=>{
 for(const [id,wrong,key] of [['shared-path','blocked-pitot','altimeter'],['speed-experiment','blocked-static','airspeed'],['heading-over-time','hi-drive','heading'],['responsive-offset','ai-drive','pitch'],['response-strength','pitot-leak','turn']]){const s=session(id);assert.equal(candidateEvidence(s,wrong,key),'INCONSISTENT');assert.equal(evaluate(s,wrong,candidates[wrong].family).status,'INCORRECT');}
});
test('activation-only evidence is honestly ambiguous, even after rejecting an unrelated candidate',()=>{
 const s=session('more-evidence');assert.ok(plausibleCandidates(s).length>1);let r=evaluate(s,'blocked-pitot','pitot-static');assert.equal(r.status,'PARTIALLY SUPPORTED');assert.equal(r.needsEvidence,true);
 assert.equal(evaluate(s,'ai-bias','gyroscopic').needsEvidence,true);
 experiment(s,{airspeed:160});assert.deepEqual(plausibleCandidates(s),['blocked-pitot']);r=evaluate(s,'blocked-pitot','pitot-static');assert.equal(r.status,'CORRECT');assert.equal(r.needsEvidence,false);
});
test('observations are the exact Phase 5A and Phase 5B effective states, with no duplicate fault equations',()=>{
 for(const def of scenarios){const s=session(def.id),c=candidates[def.hiddenFaultId],ctx=s.contexts[def.hiddenFaultId];
 if(c.family==='pitot-static'){const expected=pressure.transform(s.state,ctx.fault,ctx.lag);assert.deepEqual(s.observation.pressure,expected);assert.equal(s.observation.values.airspeed,expected.state.airspeed);assert.equal(s.observation.values.altimeter,expected.state.altitude);}
 else{const expected=gyro.transform(s.state,c.instrument,ctx.fault);assert.deepEqual(s.observation.gyros[c.instrument],expected);}
 }
});
test('deterministic time histories: drift, drive and blocked-static VSI lag evolve independently of frame partition',()=>{
 for(const id of ['heading-over-time','heading-hold','attitude-hold','shared-path']){const a=session(id),b=session(id);experiment(a,{},10);for(let i=0;i<100;i++)experiment(b,{},.1,false);for(const row of evidenceRows(a))close(row.value,b.observation.values[row.key],1e-7);}
 const d=session('heading-over-time'),before=d.observation.gyros.heading.error;experiment(d,{},10);assert.ok(d.observation.gyros.heading.error>before);
 const v=session('shared-path'),prev=Math.abs(v.observation.values.vsi);experiment(v,{},10);assert.ok(Math.abs(v.observation.values.vsi)<prev/100);
 const g=session('heading-hold'),initial=g.observation.gyros.heading.effectiveness;experiment(g,{},10);assert.ok(g.observation.gyros.heading.effectiveness<initial);
});
test('north crossing drift and independent physical controls preserve the healthy reference and TC separate ball',()=>{
 const s=session('north-crossing');const error=s.observation.gyros.heading.error;experiment(s,{pitch:20,bank:-45});assert.equal(s.observation.gyros.heading.error,error);assert.equal(s.observation.values.heading,355);
 const t=session('response-strength');assert.equal(t.observation.gyros.turn.effectiveState.ballOffset,0);experiment(t,{bank:-45});close(t.observation.values.turn,-.4);assert.equal(t.observation.healthy.turn,-1);assert.equal(t.observation.gyros.turn.effectiveState.ballOffset,0);
});
test('Guided filters known family; Mixed and Challenge retain cross-family hypotheses and hidden state does not leak between sessions',()=>{
 const g=session('shared-path','guided');assert.deepEqual(visibleCandidates(g),['blocked-pitot','blocked-static','pitot-leak']);assert.throws(()=>evaluate(g,'hi-drift'),RangeError);
 for(const mode of ['mixed','challenge'])assert.equal(visibleCandidates(session('shared-path',mode)).length,8);
 const a=session('shared-path');a.hints=4;markCandidate(a,'blocked-pitot','unlikely');evaluate(a,'blocked-static','pitot-static');const b=session('heading-over-time');assert.equal(b.hints,0);assert.equal(b.attempts,0);assert.deepEqual(b.marks,{});assert.equal(b.observation.pressure.type,'normal');assert.equal(b.contexts['hi-drift'].fault.snapshot.instrument,'heading');assert.equal(hints.length,4);
});
test('candidate elimination is session-only reasoning, not a hidden grading shortcut',()=>{
 const s=session('responsive-offset');markCandidate(s,'ai-bias','most likely');markCandidate(s,'hi-drift','most likely');assert.equal(s.marks['ai-bias'],'possible');markCandidate(s,'ai-bias','unlikely');assert.equal(evaluate(s,'ai-bias','gyroscopic').status,'CORRECT');assert.throws(()=>markCandidate(s,'ai-bias','impossible'),RangeError);
});
