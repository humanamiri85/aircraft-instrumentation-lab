import {stages,stageAt,transition,familyFor,cleansTemporaryState} from './model.js';
import {readProgress,saveProgress,record,completion,skip,initialProgress} from './progress.js';
import {introductions,questions,aircraftExperiments,comparisons,faultExercises} from './content.js';
import {labShell,createLabAdapter,comparisonCards,syncComparison} from './adapters.js';
import {instruments} from '../catalog.js';
import {variables} from '../model.js';

export async function startJourney(){
 const root=document.querySelector('#journey-root');
 root.innerHTML=`<div class="journey-heading"><p class="eyebrow">GUIDED LEARNING JOURNEY · PARALLEL PREVIEW</p><p id="journey-position"></p><h1 id="journey-title" tabindex="-1"></h1><p id="journey-question"></p><p id="journey-objective"></p></div>
 <ol id="journey-progress" aria-label="Journey progress"></ol><details class="journey-overview"><summary>Journey Overview</summary><nav aria-label="Jump to a Journey stage">${stages.map((s,i)=>`<button type="button" data-journey-stage="${i}">${i+1}. ${s.title}</button>`).join('')}</nav><button type="button" id="restart-journey">Restart Journey progress</button></details>
 <section id="journey-interaction" aria-label="Current learning interaction"></section><p id="journey-detail"></p>
 ${labShell()}
 <section class="journey-reflection"><h2>Observe & reflect</h2><p id="journey-observation"></p><p id="journey-synthesis"></p><p id="journey-completion" role="status" aria-live="polite"></p></section>
 <nav class="journey-navigation" aria-label="Journey navigation"><button id="journey-previous" type="button">← Previous</button><button id="journey-continue" type="button">Continue →</button><button id="journey-anyway" type="button">Continue anyway →</button></nav><p class="journey-announcement" role="status" id="journey-announcement"></p><footer><span>Session-local learning progress · Educational, not for flight or navigation</span><a href="./">Explore Full Lab</a></footer>`;
 // The same app initializes on a separate compatible DOM; index.html is never
 // fetched, embedded, redirected or modified. It owns the only flight-state loop.
 await import('../app.js');
 const adapter=createLabAdapter(),q=s=>root.querySelector(s);
 let storage;try{storage=window.sessionStorage;}catch{/* In-memory progress still works. */}
 let progress=readProgress(storage),selected='airspeed',experimentKey='pitch',northSeen=false,renderVersion=0;
 const setSelect=(selector,value)=>{const el=q(selector);if(el){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}};
 function updateProgress(){
  const c=completion(progress);saveProgress(storage,progress);
  q('#journey-position').textContent=`${String(progress.index+1).padStart(2,'0')} / 09`;
  q('#journey-progress').innerHTML=stages.map((s,i)=>`<li ${i===progress.index?'aria-current="step"':''} aria-label="${i+1}. ${s.title}. ${completion(progress,i).complete?'Complete':progress.skipped.includes(s.id)?'Skipped':i===progress.index?'Current':'Not completed'}" title="${s.title}"><span>${i+1}</span><span class="journey-progress-state">${completion(progress,i).complete?'Complete':progress.skipped.includes(s.id)?'Skipped':i===progress.index?'Current':'Not completed'}</span><span class="journey-progress-symbol" aria-hidden="true">${completion(progress,i).complete?'✓':progress.skipped.includes(s.id)?'↷':i===progress.index?'→':'○'}</span></li>`).join('');
  q('#journey-completion').textContent=c.complete?'Suggested interactions complete. Continue when ready.':`${c.done} / ${c.total} suggested interactions inspected. You can continue anyway; nothing is graded.`;
  q('#journey-continue').disabled=!c.complete;
  q('#journey-continue').textContent=progress.index===8?'Finish Journey →':progress.index===0?'Meet the Instruments →':'Continue →';
  q('#journey-anyway').hidden=c.complete;
  q('#journey-synthesis').hidden=stageAt(progress.index).id==='instruments'&&!c.complete;
 }
 function mark(key){progress=record(progress,key);updateProgress();}
 function pair(left,right,note){q('#journey-pair').innerHTML=comparisonCards(left,right);q('#journey-observation').textContent=note;syncComparison();adapter.focus(left,true);}
 async function renderStage(announce=false){
  const token=++renderVersion,s=stageAt(progress.index),[question,objective,synthesis]=introductions[s.id];selected=s.focus;northSeen=false;
  document.body.dataset.stage=s.id;root.dataset.stage=s.id;
  q('#journey-title').textContent=s.title;q('#journey-question').textContent=question;q('#journey-objective').textContent=objective;q('#journey-synthesis').textContent=synthesis;q('#journey-observation').textContent=objective;q('#journey-detail').textContent='';q('#journey-previous').disabled=progress.index===0;
  adapter.closePanels();
  root.querySelectorAll('[data-journey-module]').forEach(el=>el.hidden=!s.modules.includes(el.dataset.journeyModule));
  const interaction=q('#journey-interaction');
  if(s.id==='information'){
   interaction.innerHTML=`<div class="journey-flight-intro"><svg viewBox="0 0 500 170" role="img" aria-label="An aircraft viewed from above, with a nose direction, wings and surrounding flight-information questions"><path d="M245 10 Q260 15 260 65 L455 105 455 120 260 95 260 135 310 150 310 160 250 150 190 160 190 150 240 135 240 95 45 120 45 105 240 65 240 25Z" fill="#e8bb74"/><path d="M250 5V0 M20 85H90 M410 85H480" stroke="#9ca9ae" stroke-width="2"/></svg><p>Before instruments: ask what information is needed.</p></div><div class="journey-question-grid">${questions.map(([key,text,label])=>`<button type="button" data-quantity="${key}" aria-pressed="false">${text}<span>${label}</span></button>`).join('')}</div><p id="journey-answer" role="status">Select a question to inspect the flight quantity.</p>`;
  }else if(s.id==='aircraft'){
   interaction.innerHTML=`<div class="journey-substeps" role="group" aria-label="Aircraft experiments">${aircraftExperiments.map(([key,,title])=>`<button type="button" data-aircraft-experiment="${key}" aria-pressed="${key==='pitch'}">${title}</button>`).join('')}</div>`;experimentKey='pitch';adapter.choose('attitude');q('#journey-observation').textContent=aircraftExperiments[0][3];
  }else if(s.id==='comparison'){
   interaction.innerHTML=`<div class="journey-substeps" role="group" aria-label="Guided comparisons">${comparisons.map(p=>`<button type="button" data-journey-pair="${p.id}" aria-pressed="false">${p.title}</button>`).join('')}</div><div id="journey-pair" class="journey-pair"></div><details><summary>Choose your own comparison</summary><div class="journey-selectors">${['left','right'].map((side,i)=>`<label for="journey-${side}">${i?'Second':'First'} instrument<select id="journey-${side}">${instruments.map(n=>`<option value="${n.id}">${n.name}</option>`).join('')}</select></label>`).join('')}</div><button type="button" id="journey-cross-family">Open the full cross-family workspace</button></details>`;adapter.choose('airspeed',true);pair('airspeed','altimeter',comparisons[0].note);setSelect('#journey-right','altimeter');
  }else if(s.id==='faults'){
   interaction.innerHTML=`<div class="journey-substeps" role="group" aria-label="Fault propagation exercises">${faultExercises.map(([id,title])=>`<button type="button" data-journey-fault="${id}" aria-pressed="${id==='blocked-static'}">${title}</button>`).join('')}</div>`;adapter.clearTemporary();await adapter.fault('blocked-static');q('#journey-observation').textContent=faultExercises[0][2];
  }else if(s.id==='diagnostics'){
   interaction.innerHTML='<div class="journey-substeps" role="group" aria-label="Troubleshooting progression"><button type="button" data-journey-diagnostic="guided">1 · Guided</button><button type="button" data-journey-diagnostic="mixed">2 · Mixed</button><button type="button" data-journey-diagnostic="challenge">3 · Challenge</button></div><p>Observe → Compare → Experiment → Diagnose → Explain. Use the case controls below; at least one attempt is suggested, not a grade.</p>';adapter.clearTemporary();adapter.focus('airspeed',true);await adapter.diagnostics();if(token===renderVersion)setSelect('#dx-mode','guided');
  }else if(s.id==='modern'){
   interaction.innerHTML='<button type="button" id="journey-modern-inspect">Inspect shared Classical / Modern values</button>';await adapter.modern();
  }else{
   interaction.innerHTML=s.id==='inside'?'<p>Pressure-based: ASI / ALT / VSI · Gyroscopic: AI / HI / TC. Select a dial below to inspect its internal lesson.</p><button type="button" id="journey-fundamentals">Explore Gyroscope Fundamentals</button>':s.id==='chains'?'<p>Pitot-static: atmosphere/airflow → Pt/Ps → transmission → sensing → indication. Gyroscopic: motion/reference → gyro behavior → mechanism → indication.</p>':'<p>Select an instrument and move its relevant control. TC uses Bank only as an educational proxy; angular rate is the real measurand.</p>';
   if(['inside','chains'].includes(s.id))await adapter.internal('airspeed',s.id==='chains');else adapter.choose(s.focus);
  }
  if(token!==renderVersion)return;updateProgress();if(announce){q('#journey-title').focus({preventScroll:true});q('#journey-title').scrollIntoView({block:'start',behavior:'auto'});q('#journey-announcement').textContent=`Stage ${progress.index+1} of 9: ${s.title}.`;}
 }
 async function go(index,anyway=false){const old=stageAt(progress.index);if(cleansTemporaryState(old.id,stageAt(index).id))adapter.clearTemporary();if(anyway)progress=skip(progress);progress=transition(progress,index);await renderStage(true);}
 function finish(){q('#journey-announcement').textContent='Journey finished. Technology changed. The measurement problem did not. Continue exploring this stage or open the full lab.';q('#journey-announcement').scrollIntoView({block:'center'});}
 root.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;const s=stageAt(progress.index);
  if(button.id==='journey-previous')await go(progress.index-1);
  if(['journey-continue','journey-anyway'].includes(button.id)){if(progress.index<8)await go(progress.index+1,button.id==='journey-anyway');else{if(button.id==='journey-anyway')progress=skip(progress);updateProgress();finish();}}
  if(button.dataset.journeyStage!==undefined)await go(Number(button.dataset.journeyStage));
  if(button.id==='restart-journey'){adapter.clearTemporary();progress=initialProgress();await renderStage(true);}
  if(button.dataset.quantity){const item=questions.find(x=>x[0]===button.dataset.quantity);q('#journey-answer').textContent=`${item[2]}: ${item[3]}`;interactionPressed('[data-quantity]',button);mark(item[0]);}
  if(button.dataset.instrument&&event.isTrusted){selected=button.dataset.instrument;adapter.focus(selected,['faults','diagnostics'].includes(s.id));if(s.id==='instruments')mark(selected);if(['inside','chains'].includes(s.id))await adapter.internal(selected,s.id==='chains');}
  if(button.dataset.aircraftExperiment){experimentKey=button.dataset.aircraftExperiment;const item=aircraftExperiments.find(x=>x[0]===experimentKey);selected=item[1];adapter.choose(selected);interactionPressed('[data-aircraft-experiment]',button);q('#journey-observation').textContent=item[3];q(`#${experimentKey}`).focus({preventScroll:true});}
  if(button.dataset.journeyPair){const p=comparisons.find(x=>x.id===button.dataset.journeyPair);setSelect('#journey-left',p.left);setSelect('#journey-right',p.right);pair(p.left,p.right,p.note);interactionPressed('[data-journey-pair]',button);mark(p.id);}
  if(button.id==='journey-cross-family')adapter.openSystem('comparison-internal','measurement-comparison');
  if(button.dataset.journeyFault){await adapter.fault(button.dataset.journeyFault);q('#journey-observation').textContent=faultExercises.find(x=>x[0]===button.dataset.journeyFault)[2];interactionPressed('[data-journey-fault]',button);}
  if(button.dataset.journeyDiagnostic){setSelect('#dx-mode',button.dataset.journeyDiagnostic);interactionPressed('[data-journey-diagnostic]',button);}
  if(button.id==='journey-fundamentals')await adapter.fundamentals();
  if(event.isTrusted&&s.id==='inside'&&(button.getAttribute('role')==='tab'||button.hasAttribute('data-select-component')))mark(familyFor(selected));
  if(event.isTrusted&&s.id==='chains'&&button.hasAttribute('data-step'))mark(familyFor(selected));
  if(s.id==='faults'&&button.hasAttribute('data-activate')&&q('#faults-internal').dataset.faultType!=='normal')mark('pressure');
  if(s.id==='faults'&&button.hasAttribute('data-gf-activate')&&q('#gyro-faults-internal').dataset.faultType!=='normal')mark('gyro');
  if(button.id==='journey-modern-inspect')mark('comparison');
 });
 function interactionPressed(selector,active){root.querySelectorAll(selector).forEach(el=>el.setAttribute('aria-pressed',String(el===active)));}
 root.addEventListener('input',event=>{if(stageAt(progress.index).id!=='aircraft'||event.target.id!==experimentKey)return;const key=event.target.id,value=Number(event.target.value),spec=variables.find(v=>v.key===key);if(key==='heading'){if(value===359)northSeen=true;if(value===0&&northSeen)mark(key);}else if(key==='verticalSpeed'?value!==0:value>spec.initial)mark(key);});
 root.addEventListener('change',event=>{if(['journey-left','journey-right'].includes(event.target.id))pair(q('#journey-left').value,q('#journey-right').value,'What is shared? What differs? What is sensed, inferred, or reference-based?');if(stageAt(progress.index).id==='modern'&&event.target.id==='modern-presentation')mark('comparison');});
 root.addEventListener('submit',event=>{if(stageAt(progress.index).id==='diagnostics'&&event.target.matches('[data-dx-form]')&&q('#dx-diagnosis').value)mark('attempt');});
 // Observe the existing cockpit's values, rather than advancing another model.
 const readings=new MutationObserver(()=>syncComparison());readings.observe(q('#instruments'),{childList:true,subtree:true,characterData:true});
 window.addEventListener('pagehide',event=>{if(!event.persisted){readings.disconnect();adapter.dispose();}});
 await renderStage();
}
