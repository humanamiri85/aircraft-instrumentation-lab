import {instrumentOrder,instrumentTasks,experimentDetails,experimentComplete,asiWalkthrough,pressureWalkthrough,reasoningQuestions,faultProtocols,predictions,diagnosticSteps,nextDiagnosticStep,stepState,instrumentInteracted} from './instruction.js';
import {instruments} from '../catalog.js';
import {focusFor} from './model.js';
import {steps as gyroSteps} from '../measurement/gyro/content.js';
import {quantities} from '../modern/model.js';
import {changed,unchanged} from '../modern/content.js';

// Reuses the existing rendered lessons/case controls. UI counters and prediction
// choices are the only state here; the app remains the sole model/state owner.
export function createInstruction(root,adapter,mark){
 const q=s=>root.querySelector(s);
 let stage,position=0,walk=0,chain='pressure',gyroInstrument='attitude',instrumentStarts={},experimentKey='pitch',start=0,northSeen=false,fault='blocked-static',diagnosticStep=0,revision=0,observer;
 const predictionChoices=new Map(),observed=new Set();
 const selected=id=>instruments.find(i=>i.id===id);
 const focusTask=selector=>{const heading=q(selector+' h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}};
 const chooseValue=(id,value,type='input')=>{const el=q('#'+id);if(!el)return;el.value=value;el.dispatchEvent(new Event(type,{bubbles:true}));};
 const prediction=id=>`<fieldset class="journey-prediction"><legend>${predictions[id].question}</legend>${predictions[id].choices.map((c,i)=>`<label><input type="radio" name="prediction-${id}" value="${i}" ${predictionChoices.get(id)===String(i)?'checked':''}> ${c}</label>`).join('')}<p data-prediction-observation="${id}" ${observed.has(id)?'':'hidden'}>${predictions[id].observe}</p></fieldset>`;
 const revealPrediction=id=>{observed.add(id);const el=q(`[data-prediction-observation="${id}"]`);if(el)el.hidden=false;};
 function instrument(){const id=instrumentOrder[position],task=instrumentTasks[id];adapter.choose(id);instrumentStarts=Object.fromEntries(focusFor(id).variables.map(key=>[key,Number(q('#'+key).value)]));q('#journey-interaction').innerHTML=`<p class="eyebrow">Instrument ${position+1} of 6</p><h2>${selected(id).name}</h2><p>${task[0]}</p><p><strong>Try:</strong> ${task[1]}</p><p><strong>Observe:</strong> ${task[4]}</p><div class="journey-substeps"><button type="button" data-instrument-previous ${position===0?'disabled':''}>← Previous Instrument</button><button type="button" data-instrument-next ${position===5?'disabled':''}>Next Instrument →</button></div>`;}
 function experiment(key){experimentKey=key;const d=experimentDetails[key];start=Number(q('#'+key).value);northSeen=false;q('#journey-experiment').innerHTML=`<h2>${d.action}</h2><p><strong>Start:</strong> ${d.start}${key==='altitude'?' ft':key==='airspeed'?' kt':key==='verticalSpeed'?' ft/min':'°'}.</p><p><strong>Observe:</strong> ${d.observe}</p><p class="internal-note">${d.guard}</p><div class="journey-substeps"><button type="button" data-experiment-start>Set Start</button><button type="button" data-experiment-example>Apply Example</button><button type="button" data-experiment-reset>Reset Experiment</button></div>${key==='heading'?prediction('heading'):''}`;}
 async function highlight(selector,id){q(selector)?.querySelector(`[data-select-component="${id}"]`)?.click();q(selector)?.querySelector(`[data-component="${id}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
 async function inside(){const token=revision;if(q('#asi-internal').hidden)await adapter.internal('airspeed');if(token!==revision)return;q('#journey-walk').innerHTML=`<p class="eyebrow">ASI walkthrough · Step ${walk+1} of 5</p><h2>${asiWalkthrough[walk][1]}</h2><p>${asiWalkthrough[walk][2]}</p><button type="button" data-walk-next>${walk===4?'Finish ASI walkthrough':'Next Step →'}</button>${walk===4?'<p>Then inspect one gyro instrument: choose AI or HI below. Free exploration remains available.</p>':''}`;await highlight('#asi-internal',asiWalkthrough[walk][0]);}
 async function chainWalk(){
  const id=chain==='pressure'?'altimeter':gyroInstrument,token=revision;if(q('#'+id+'-internal').hidden)await adapter.internal(id,true);if(token!==revision)return;
  if(chain==='pressure'){q('#journey-walk').innerHTML=`<p class="eyebrow">Altimeter chain · Step ${walk+1} of 6</p><h2>${pressureWalkthrough[walk][1]}</h2>${prediction('pressure')}<button type="button" data-chain-next>${walk===5?'Finish pressure chain':'Next Step →'}</button>${walk===5?'<p>Then trace the AI vertical-reference chain.</p>':''}`;await highlight('#altimeter-panel-chain',pressureWalkthrough[walk][0]);}
  else{const steps=gyroSteps[gyroInstrument].map(x=>x[1]);q('#journey-walk').innerHTML=`<p class="eyebrow">${selected(gyroInstrument).abbr} chain · Step ${walk+1} of 5</p><h2>${steps[walk]}</h2><p>Vertical reference for AI; directional reference for HI. These are distinct.</p><button type="button" data-chain-next>${walk===4?'Finish gyro chain':'Next Step →'}</button>`;q('#'+gyroInstrument+'-panel-chain [data-step="'+walk+'"]')?.click();}
 }
 function protocol(id){fault=id;predictionChoices.delete('static');observed.delete('static');q('#journey-protocol').innerHTML=`<h2>Experiment protocol</h2><ol>${faultProtocols[id].map(t=>`<li>${t}</li>`).join('')}</ol>${id==='blocked-static'?prediction('static'):''}<button type="button" data-fault-start>Set protocol start values</button><p>Use the real Activate / Clear Fault controls below. After observing, explain the affected shared path or reference.</p>`;}
 function syncDiagnostic(){
  const summary=q('#journey-case-evidence');if(!summary)return;
  const source=q('[data-dx-evidence]');if(!q('#diagnostics-internal').dataset.scenarioId){summary.innerHTML='<p role="status">Case cleared. Choose Reset Guided Case to begin again.</p>';q('#journey-case-result')?.replaceChildren();return;}if(source){const value=[...source.children].slice(0,7).map(el=>el.outerHTML).join('');if(summary.innerHTML!==value)summary.innerHTML=value;}
  const suggestion=q('[data-dx-suggestion]');if(suggestion&&q('#journey-case-experiment'))q('#journey-case-experiment').textContent=suggestion.textContent;
  const result=q('[data-dx-result]');const dest=q('#journey-case-result');if(dest&&result&&!result.hidden){const summary=[...result.children].filter(el=>el.matches('h3,h4,p,dl')).map(el=>el.outerHTML).join('');if(dest.innerHTML!==summary)dest.innerHTML=summary;}
 }
 function diagnostic(){
  q('[data-journey-module=controls]').hidden=diagnosticStep<3&&q('#diagnostics-internal').dataset.journeyCompact==='true';
  q('#journey-simple-diagnostic').innerHTML=`<p class="eyebrow">${diagnosticStep+1} of 6 · ${diagnosticSteps[diagnosticStep]}</p><h2>${['What do the indications show?','Which instruments disagree with the same-state reference?','Which family best explains the pattern?','Gather confirming evidence.','Commit to the most likely fault.','Explain your reasoning.'][diagnosticStep]}</h2>
  <div id="journey-case-evidence" class="journey-case-evidence"></div>
  ${diagnosticStep>=1?'<p>Compare affected and unaffected instruments. Do the affected instruments share a pressure path or a gyro reference?</p>':''}
  ${diagnosticStep>=2?'<label for="journey-case-family">Your hypothesis: fault family<select id="journey-case-family"><option value="uncertain">Uncertain</option><option value="pitot-static">Pitot-static</option><option value="gyroscopic">Gyroscopic</option></select></label>':''}
  ${diagnosticStep>=3?`${prediction('diagnostic')}<p id="journey-case-experiment"></p><button type="button" data-case-experiment>Run confirming experiment</button>`:''}
  ${diagnosticStep>=4?'<label for="journey-case-diagnosis">Most likely fault<select id="journey-case-diagnosis"></select></label><button type="button" data-case-submit>Submit diagnosis</button>':''}
  ${diagnosticStep===5?'<div id="journey-case-result" aria-live="polite"></div><p>Indication ≠ truth. Explain the shared element, altered signal/reference, and why alternatives fit less well.</p>':''}
  ${diagnosticStep<4?'<button type="button" data-case-next>Next reasoning step →</button>':''}`;
  const choices=q('#dx-diagnosis');if(q('#journey-case-diagnosis')&&choices)q('#journey-case-diagnosis').innerHTML=choices.innerHTML;
  if(q('#journey-case-family'))q('#journey-case-family').value=q('#dx-family').value;
  syncDiagnostic();
 }
 function finale(){const cards=['airspeed','attitude'].map(id=>{const m=quantities[id];return `<article><h3>${id==='airspeed'?'Airspeed':'Attitude'}</h3><p><strong>Classical:</strong> ${m.classical.filter(x=>['source-reference','sensing-element','conversion','indication'].includes(x.element)).map(x=>x.label).join(' → ')}</p><p><strong>Modern:</strong> ${m.modern.filter(x=>['world','sensor','computer','display'].includes(x.element)).map(x=>x.label).join(' → ')}</p></article>`;}).join('');return `<div class="journey-pair">${cards}</div><div class="journey-pair"><article><h3>What changed?</h3><ul>${changed.map(x=>`<li>${x}</li>`).join('')}</ul></article><article><h3>What did not change?</h3><ul>${unchanged.map(x=>`<li>${x}</li>`).join('')}</ul></article></div><p>Pressure inputs remain distinct from computed air-data outputs. AI needs a vertical reference; HI needs a directional reference. AHRS is conceptual here, not simulated sensor integration.</p><button type="button" data-finale-inspect>Reflect on the same measurement problem</button><button type="button" data-modern-full aria-expanded="false">Explore the Complete Modern System</button>`;}
 async function render(id){
  revision++;observer?.disconnect();stage=id;predictionChoices.clear();observed.clear();position=0;walk=0;chain='pressure';gyroInstrument='attitude';diagnosticStep=0;
  q('#diagnostics-internal').removeAttribute('data-journey-compact');q('#modern-internal').removeAttribute('data-journey-compact');
  if(id==='instruments')instrument();
  if(id==='aircraft'){q('#journey-interaction').insertAdjacentHTML('beforeend','<section id="journey-experiment"></section>');experiment('pitch');}
  if(id==='inside'){q('#journey-interaction').insertAdjacentHTML('afterbegin','<section id="journey-walk" class="journey-task"></section>');await inside();}
  if(id==='chains'){q('#journey-interaction').insertAdjacentHTML('afterbegin','<section id="journey-walk" class="journey-task"></section>');await chainWalk();}
  if(id==='comparison'){q('#journey-interaction').insertAdjacentHTML('beforeend','<section id="journey-reasoning"></section>');reasoning('pressure');}
  if(id==='faults'){q('#journey-interaction').insertAdjacentHTML('beforeend','<section id="journey-protocol" class="journey-task"></section>');protocol('blocked-static');}
  if(id==='diagnostics'){
   if(!q('#dx-family')){q('#journey-interaction').innerHTML='<p role="status">The optional diagnostic workspace is unavailable. Continue anyway or Explore Full Lab.</p>';return;}
   q('#journey-interaction').innerHTML='<section id="journey-simple-diagnostic" class="journey-task"></section><div class="journey-substeps"><button type="button" data-case-reset>Reset Guided Case</button><button type="button" data-diagnostic-full aria-expanded="false">Open Full Diagnostic Workspace</button></div>';
   q('#diagnostics-internal').dataset.journeyCompact='true';diagnostic();observer=new MutationObserver(syncDiagnostic);observer.observe(q('#diagnostics-internal'),{subtree:true,childList:true,characterData:true});
  }
  if(id==='modern'){q('[data-journey-module=controls]').hidden=true;q('#modern-internal').dataset.journeyCompact='true';q('#journey-interaction').innerHTML=finale();}
 }
 function comparisonFocus(){const ids=[q('#journey-left').value,q('#journey-right').value];const keys=new Set(ids.flatMap(id=>focusFor(id).variables));q('#controls').querySelectorAll('[data-variable]').forEach(el=>el.hidden=!keys.has(el.dataset.variable));}
 function reasoning(id){comparisonFocus();q('#journey-reasoning').innerHTML=`<h3>Think about it</h3><ul>${reasoningQuestions[id].map(x=>`<li>${x}</li>`).join('')}</ul><p>Discuss or reflect; these questions are not graded.</p>`;}
 root.addEventListener('input',event=>{
  if(!event.target.matches('#controls input'))return;
  if(stage==='instruments'&&instrumentInteracted(instrumentOrder[position],event.target.id,instrumentStarts[event.target.id],Number(event.target.value)))mark(instrumentOrder[position]);
  if(stage==='faults'&&event.target.id==='altitude'&&q('#faults-internal').dataset.faultType==='blocked-static')revealPrediction('static');
  if(stage==='aircraft'&&event.target.id===experimentKey){const value=Number(event.target.value);if(value===359)northSeen=true;if(experimentComplete(experimentKey,start,value,northSeen)){mark(experimentKey);revealPrediction('heading');}}
 });
 root.addEventListener('change',event=>{
  if(event.target.matches('.journey-prediction input')){event.target.closest('fieldset').dataset.prediction=event.target.value;predictionChoices.set(event.target.name.replace('prediction-',''),event.target.value);}
  if(['journey-left','journey-right'].includes(event.target.id))comparisonFocus();
  if(event.target.id==='journey-case-family')chooseValue('dx-family',event.target.value,'change');
 });
 root.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-instrument-next')){position=stepState(position+1,instrumentOrder.length).index;instrument();focusTask('#journey-interaction');}
  if(b.hasAttribute('data-instrument-previous')){position=stepState(position-1,instrumentOrder.length).index;instrument();focusTask('#journey-interaction');}
  if(stage==='instruments'&&b.dataset.instrument&&event.isTrusted){position=instrumentOrder.indexOf(b.dataset.instrument);instrument();}

  if(b.dataset.aircraftExperiment)experiment(b.dataset.aircraftExperiment);
  if(b.hasAttribute('data-experiment-start')||b.hasAttribute('data-experiment-reset')){observed.delete('heading');const cue=q('[data-prediction-observation=heading]');if(cue)cue.hidden=true;chooseValue(experimentKey,experimentDetails[experimentKey].start);start=experimentDetails[experimentKey].start;northSeen=experimentKey==='heading';}
  if(b.hasAttribute('data-experiment-example')){if(experimentKey==='heading'&&!northSeen){chooseValue('heading',359);northSeen=true;}chooseValue(experimentKey,experimentDetails[experimentKey].target);}
  if(b.hasAttribute('data-walk-next')){if(walk===4){mark('pressure');b.disabled=true;}else{walk=stepState(walk+1,asiWalkthrough.length).index;await inside();focusTask('#journey-walk');}}
  if(b.hasAttribute('data-chain-next')){revealPrediction('pressure');if(chain==='pressure'&&walk===5){mark('pressure');chain='gyro';walk=0;const token=revision;await adapter.internal('attitude',true);if(token!==revision)return;}else if(chain==='gyro'&&walk===4){mark('gyro');b.disabled=true;return;}else walk=stepState(walk+1,chain==='pressure'?pressureWalkthrough.length:gyroSteps[gyroInstrument].length).index;await chainWalk();focusTask('#journey-walk');}
  if(b.dataset.journeyPair)reasoning(b.dataset.journeyPair);
  if(b.dataset.journeyFault)protocol(b.dataset.journeyFault);
  if(b.hasAttribute('data-fault-start')){if(fault==='gyro')chooseValue('heading',270);else{chooseValue('airspeed',110);chooseValue('altitude',3000);}}
  if(b.hasAttribute('data-case-reset')){q('[data-dx-reset]')?.click();diagnosticStep=0;predictionChoices.delete('diagnostic');observed.delete('diagnostic');q('#journey-simple-diagnostic').hidden=false;diagnostic();}
  if(b.hasAttribute('data-case-next')){diagnosticStep=nextDiagnosticStep(diagnosticStep);diagnostic();focusTask('#journey-simple-diagnostic');}
  if(b.hasAttribute('data-case-experiment')){q('[data-dx-experiment]')?.click();revealPrediction('diagnostic');syncDiagnostic();}
  if(b.hasAttribute('data-case-submit')){chooseValue('dx-diagnosis',q('#journey-case-diagnosis').value,'change');if(q('#dx-diagnosis').value){q('[data-dx-form]').requestSubmit();diagnosticStep=5;diagnostic();focusTask('#journey-simple-diagnostic');}}
  if(b.hasAttribute('data-dx-healthy')&&b.closest('#journey-case-result')){q('#diagnostics-internal [data-dx-healthy]')?.click();syncDiagnostic();}
  if(b.hasAttribute('data-diagnostic-full')){q('#journey-simple-diagnostic').hidden=true;q('[data-journey-module=controls]').hidden=false;delete q('#diagnostics-internal').dataset.journeyCompact;b.setAttribute('aria-expanded','true');}
  if(b.hasAttribute('data-modern-full')){q('[data-journey-module=controls]').hidden=false;delete q('#modern-internal').dataset.journeyCompact;b.setAttribute('aria-expanded','true');mark('comparison');}
  if(b.hasAttribute('data-finale-inspect'))mark('comparison');
 });
 return {render,invalidate(){revision++;stage=undefined;observer?.disconnect();},async inspect(id){if(stage==='chains'&&chain==='gyro'&&['attitude','heading'].includes(id)){gyroInstrument=id;walk=0;await chainWalk();}},dispose(){revision++;observer?.disconnect();}};
}
