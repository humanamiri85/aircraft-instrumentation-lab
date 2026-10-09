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
