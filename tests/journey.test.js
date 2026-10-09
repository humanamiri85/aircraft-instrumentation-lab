import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stages,stageAt,transition,focusFor,familyFor,cleansTemporaryState} from '../js/journey/model.js';
import {initialProgress,record,completion,skip,readProgress,saveProgress,storageKey} from '../js/journey/progress.js';
import {introductions,questions,comparisons,aircraftExperiments} from '../js/journey/content.js';
import {labShell,comparisonCards} from '../js/journey/adapters.js';

test('Journey order is nine unique stages with explicit progressive disclosure',()=>{
 assert.deepEqual(stages.map(s=>s.id),['information','instruments','aircraft','inside','chains','comparison','faults','diagnostics','modern']);assert.equal(new Set(stages.map(s=>s.id)).size,9);
 for(const s of stages){assert.ok(Object.isFrozen(s));assert.ok(introductions[s.id]);assert.ok(s.required.length);}
 assert.deepEqual(stages[0].modules,['information']);assert.deepEqual(stages[1].modules,['cockpit','controls']);assert.ok(!stages.slice(0,6).some(s=>s.modules.includes('faults')||s.modules.includes('diagnostics')||s.modules.includes('modern')));
});
test('Journey focus adapts the existing instrument/control mapping and keeps TC semantics',()=>{
 assert.deepEqual(focusFor('attitude').variables,['pitch','bank']);assert.deepEqual(focusFor('heading').variables,['heading']);assert.deepEqual(focusFor('turn').variables,['bank']);assert.equal(familyFor('vsi'),'pressure');assert.equal(familyFor('attitude'),'gyro');
 assert.match(comparisons[2].note,/angular rate.*Bank is only/);assert.equal(aircraftExperiments.length,6);assert.equal(questions.length,6);
});
test('Completion records only valid unique interactions and never falsely completes a skipped stage',()=>{
 let p=initialProgress();p=record(p,'unknown');assert.equal(completion(p).done,0);p=record(record(p,'airspeed'),'airspeed');assert.equal(completion(p).done,1);for(const id of stages[0].required)p=record(p,id);assert.equal(completion(p).complete,true);
 p=transition(p,7);assert.equal(completion(p).complete,false);p=skip(p);assert.deepEqual(p.skipped,['diagnostics']);assert.equal(completion(p).complete,false);assert.equal(completion(record(p,'attempt')).complete,true);
});
test('Previous, Continue anyway and secondary navigation are bounded without hard locks',()=>{
 const p=initialProgress();assert.equal(transition(p,8).index,8);assert.equal(transition(transition(p,3),2).index,2);assert.equal(p.index,0);for(const n of [-1,9,NaN,1.5])assert.throws(()=>stageAt(n),RangeError);
});
test('Every stage has independent completion and revisiting preserves only teaching interactions',()=>{
 let p=initialProgress();for(let i=0;i<stages.length;i++){p=transition(p,i);assert.equal(completion(p).complete,false);p=record(p,'not-a-stage-interaction');assert.equal(completion(p).done,0);for(const key of stages[i].required)p=record(p,key);assert.equal(completion(p).complete,true);}
 p=transition(p,0);assert.equal(completion(p).complete,true);assert.deepEqual(Object.keys(p).sort(),['index','interactions','skipped','version']);assert.equal('fault' in p,false);assert.equal('flightState' in p,false);
});
test('Session progress is sanitized, session-local and resilient to unavailable storage',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};const p=record(initialProgress(),'pitch');assert.equal(saveProgress(storage,p),true);assert.deepEqual(readProgress(storage).interactions.information,['pitch']);
 data.set(storageKey,JSON.stringify({version:1,index:99,interactions:{information:['pitch','bogus','pitch']},skipped:['unknown','inside']}));const r=readProgress(storage);assert.equal(r.index,0);assert.deepEqual(r.interactions.information,['pitch']);assert.deepEqual(r.skipped,['inside']);assert.deepEqual(readProgress(undefined),initialProgress());assert.equal(saveProgress(undefined,p),false);
});
test('Leaving fault or diagnostic stages requires cleanup; unrelated transitions preserve controls',()=>{
 for(const id of ['faults','diagnostics']){assert.equal(cleansTemporaryState(id,'modern'),true);assert.equal(cleansTemporaryState(id,id),false);}assert.equal(cleansTemporaryState('chains','comparison'),false);
});
test('Guided adapters reuse existing metadata and do not invent scientific state or duplicate pressure equations',async()=>{
 assert.match(comparisonCards('airspeed','altimeter'),/Differential pressure q = Pt − Ps/);assert.match(comparisonCards('attitude','heading'),/vertical reference/);assert.match(comparisonCards('heading','turn'),/BANK PROXY/);
 const shell=labShell();for(const id of ['controls','instruments','flight-data','faults-internal','gyro-faults-internal','diagnostics-internal','modern-internal'])assert.ok(shell.includes(`id="${id}"`));
 const view=await readFile(new URL('../js/journey/view.js',import.meta.url),'utf8');assert.match(view,/import\('\.\.\/app.js'\)/);assert.doesNotMatch(view,/requestAnimationFrame|advanceLag|initialState|activateFault|Math\.exp/);
 const html=await readFile(new URL('../guided.html',import.meta.url),'utf8');assert.match(html,/href="\.\/"/);assert.doesNotMatch(html,/iframe|http-equiv="refresh"/);
});
test('legacy-index-baseline: production HTML, styles, models, controllers and renderers are byte-for-byte unchanged',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/legacy-index-baseline.json',import.meta.url),'utf8'));
 for(const [path,expected] of Object.entries(hashes)){const data=await readFile(new URL('../'+path,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),expected,path+' changed from validated Explore Lab baseline');}
});

// Instructional orchestration is deliberately independent of scientific state.
import {instrumentOrder,instrumentTasks,experimentDetails,experimentComplete,asiWalkthrough,pressureWalkthrough,bridges,continueLabels,reasoningQuestions,faultProtocols,predictions,diagnosticSteps,nextDiagnosticStep,stepState,instrumentInteracted} from '../js/journey/instruction.js';
test('Sequential six-instrument tasks cover ordered families and meaningful controls',()=>{
 assert.deepEqual(instrumentOrder,['airspeed','altimeter','vsi','attitude','heading','turn']);
 for(const id of instrumentOrder){assert.ok(focusFor(id).variables.includes(instrumentTasks[id][2]));assert.ok(instrumentTasks[id][1]);}
 assert.match(instrumentTasks.turn[4],/Bank proxy.*Angular rate.*centered/);assert.equal(instrumentInteracted('attitude','bank',0,20),true);assert.equal(instrumentInteracted('heading','bank',0,20),false);assert.equal(instrumentInteracted('turn','bank',20,20),false);
});
test('Aircraft experiments have explicit start, action, observation, guardrails and a guided north crossing',()=>{
 assert.deepEqual(Object.keys(experimentDetails),['pitch','bank','heading','altitude','airspeed','verticalSpeed']);
 for(const [key,d] of Object.entries(experimentDetails)){assert.ok(d.action&&d.observe&&d.guard);assert.equal(experimentComplete(key,d.start,d.start,false),false);}
 assert.equal(experimentDetails.heading.start,359);assert.equal(experimentComplete('heading',359,0,true),true);assert.equal(experimentComplete('heading',359,1,true),true);assert.equal(experimentComplete('heading',270,0,false),false);
 assert.equal(experimentComplete('pitch',0,5,false),true);assert.equal(experimentComplete('verticalSpeed',0,-1000,false),true);assert.match(experimentDetails.verticalSpeed.guard,/does not integrate Altitude/);
});
test('ASI and pressure-chain walkthroughs reference existing components with bounded substeps',()=>{
 assert.equal(asiWalkthrough.length,5);assert.deepEqual(asiWalkthrough.map(s=>s[0]),['pitot','capsule','gear','linkage','pointer']);assert.equal(pressureWalkthrough.length,6);assert.ok(pressureWalkthrough.some(s=>s[0]==='static-line'));
 assert.deepEqual(stepState(99,5),{index:4,last:true});assert.equal(stepState(0,5).last,false);
});
test('Comparisons are compact by default and engineering fields are revealable',()=>{
 const html=comparisonCards('airspeed','altimeter');assert.match(html,/<details><summary>Show full engineering comparison/);assert.ok(html.indexOf('Transmission')>html.indexOf('<details>'));assert.ok(html.indexOf('Displayed quantity')<html.indexOf('<details>'));
 for(const id of ['pressure','references','rate'])assert.equal(reasoningQuestions[id].length,3);
});
test('Predictions and protocols are ungraded orchestration of actual faults',()=>{
 assert.equal(Object.keys(predictions).length,4);assert.deepEqual(predictions.static.choices,['ASI only','ASI, Altimeter and VSI','Gyro instruments only']);assert.match(predictions.pressure.observe,/Static pressure Ps.*inferred: Altitude/);
 assert.deepEqual(Object.keys(faultProtocols),['blocked-static','blocked-pitot','pitot-leak','gyro']);for(const steps of Object.values(faultProtocols))assert.ok(steps.length>=5);assert.match(faultProtocols['blocked-pitot'].join(' '),/pressure is trapped, not the pointer/);
});
test('Simplified diagnosis progresses to explanation; finale and all bridges retain full workspaces',async()=>{
 assert.deepEqual(diagnosticSteps,['Observe','Compare','Hypothesize','Experiment','Diagnose','Explain']);assert.equal(nextDiagnosticStep(5),5);assert.equal(nextDiagnosticStep(2),3);assert.equal(bridges.length,9);assert.equal(continueLabels.length,9);assert.match(continueLabels[3],/Measurement Chains/);assert.match(bridges[8],/Technology changed/);
 const source=await readFile(new URL('../js/journey/polish.js',import.meta.url),'utf8');assert.match(source,/Open Full Diagnostic Workspace/);assert.match(source,/Explore the Complete Modern System/);assert.match(source,/requestSubmit/);assert.match(source,/data-dx-evidence/);assert.doesNotMatch(source,/Math\.exp|activateFault|advanceLag|requestAnimationFrame/);
});
