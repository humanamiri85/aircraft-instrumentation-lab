import {scenarios,seededScenario,startSession,experiment,evaluate,visibleCandidates,candidates,markCandidate,evidenceRows,candidateEvidence} from './model.js';
import {familyNames,hints,suggestedExperiment,debrief,explanations} from './content.js';
import {instruments} from '../catalog.js';
import {diagram} from '../measurement/pitot-static/view.js';
import {path} from '../measurement/gyro/view.js';
import {continuousHeading} from '../internal/heading/model.js';

const number=v=>Number.isFinite(v)?v.toFixed(Math.abs(v)<2?3:1):'—';
const labelRow=row=>`${row.name}: ${number(row.value)} ${row.unit}`;
export function createDiagnosticView(panel,{setFlightState}={}){
 panel.innerHTML=`<h2 id="diagnostics-title">Diagnostic Scenarios &amp; Troubleshooting</h2>
 <p>Observed symptoms → compare instruments → locate a shared element → eliminate unlikely causes → explain a diagnosis.</p>
 <p class="internal-note">This case workspace has its own real Phase 5A/5B fault state. The cockpit and manual fault panels remain independent. Use the existing flight controls to experiment with the case. No flight dynamics or new fault physics are introduced.</p>
 <div class="dx-toolbar"><label for="dx-mode">Diagnostic mode<select id="dx-mode"><option value="guided">Guided</option><option value="mixed">Mixed</option><option value="challenge">Challenge</option></select></label>
 <label for="dx-scenario">Investigation<select id="dx-scenario">${scenarios.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select></label>
 <label for="dx-seed">Case seed<input id="dx-seed" type="number" min="0" max="4294967295" step="1" value="1"></label></div>
 <p data-dx-context></p><p data-dx-focus></p>
 <div class="dx-actions"><button type="button" data-dx-reset>Reset Scenario</button><button type="button" data-dx-next>Next Scenario</button><button type="button" data-dx-time>Observe another 10 s</button><label><input id="dx-running" type="checkbox"> Run simulation clock</label></div>
 <p data-dx-clock></p><p data-dx-feedback role="status"></p>
 <h3>Observed instrument behavior</h3><p>The six indications below belong to this case. Aircraft-state controls are independent. TC: APP CONTROL — Bank proxy; REAL MEASURAND — Angular rate. The separate inclinometer ball stays centered.</p>
 <div class="dx-faces">${instruments.map(i=>`<article data-dx-face="${i.id}"><h4>${i.abbr}</h4><div class="drawing"></div><output aria-live="off"></output></article>`).join('')}</div>
 <div class="dx-evidence" data-dx-evidence></div><details><summary>Control and observation history</summary><p>Model-generated case observations; recent checkpoints are shown. Evaluation also retains earlier observations from this attempt. Change only one control for a confirming experiment.</p><ol data-dx-history></ol></details>
 <div class="dx-actions"><button type="button" data-dx-hint>Show next hint</button><button type="button" data-dx-experiment>Try a suggested experiment</button></div><p data-dx-suggestion></p><ol data-dx-hints></ol>
 <h3>Candidate elimination</h3><p>Mark candidates unlikely, possible or most likely. These are your reasoning notes; an eliminated candidate remains selectable for an explicit attempt.</p><div class="dx-candidates" data-dx-candidates></div>
 <details class="dx-reasoning"><summary>Diagnostic evidence matrix</summary><p>Compare each observation against each candidate. Candidate columns stack into cards on small screens. Your classifications remain visible; model consistency is revealed after an attempt. NEUTRAL means the evidence does not discriminate.</p><div class="dx-matrix" data-dx-matrix></div></details>
 <form data-dx-form><div class="dx-toolbar"><label for="dx-family">Fault family<select id="dx-family"><option value="uncertain">Uncertain</option><option value="pitot-static">Pitot-static</option><option value="gyroscopic">Gyroscopic</option></select></label>
 <label for="dx-diagnosis">Most likely fault<select id="dx-diagnosis" required><option value="">Choose a diagnosis</option></select></label>
 <label for="dx-confidence">Confidence (optional)<select id="dx-confidence"><option value="">Not specified</option><option>Low</option><option>Medium</option><option>High</option></select></label></div><button type="submit">Submit diagnosis</button></form>
 <section data-dx-result aria-label="Diagnosis result" hidden></section>
 <p class="internal-note">Evidence is compared with the bounded hypotheses for this educational case, not a universal probability engine. Actual failed hardware can behave differently. Bias-like, drift, lag, stuck/trapped, sensitivity loss and reference degradation are reusable teaching categories; formal measurement-error theory and assessment are deferred.</p>`;
 const q=s=>panel.querySelector(s),text=(selector,value)=>{const el=q(selector);if(el.textContent!==value)el.textContent=value;},mode=q('#dx-mode'),selector=q('#dx-scenario'),seed=q('#dx-seed');
 const renderers=instruments.map(i=>({id:i.id,update:i.create(q(`[data-dx-face="${i.id}"] .drawing`)),read:i.read,output:q(`[data-dx-face="${i.id}"] output`)}));
 let session,focused=true,headingAngle,chainFace,lastPaint=0,clockAccumulator=0;
 function start(){
  q('.dx-faces').hidden=false;session=startSession(seededScenario(selector.value,Number(seed.value)),mode.value);headingAngle=undefined;chainFace=undefined;clockAccumulator=0;
  q('#dx-running').checked=false;q('#dx-family').value='uncertain';q('#dx-confidence').value='';q('[data-dx-hints]').replaceChildren();q('[data-dx-result]').hidden=true;q('[data-dx-result]').replaceChildren();
  const ids=visibleCandidates(session);
  q('[data-dx-candidates]').innerHTML=ids.map(id=>`<label>${candidates[id].name}<select data-dx-mark="${id}" aria-label="Candidate ${candidates[id].name}"><option value="possible">Possible</option><option value="unlikely">Unlikely</option><option value="most likely">Most likely</option></select></label>`).join('');
  q('#dx-diagnosis').innerHTML='<option value="">Choose a diagnosis</option>'+ids.map(id=>`<option value="${id}">${candidates[id].name}</option>`).join('');
  q('[data-dx-matrix]').innerHTML=ids.map(id=>`<article><h4>${candidates[id].name}</h4>${evidenceRows(session).map(row=>`<label><span data-dx-row="${row.key}">${row.name}</span><select data-dx-cell="${id}:${row.key}" aria-label="${row.name} against ${candidates[id].name}"><option>NEUTRAL</option><option>CONSISTENT</option><option>INCONSISTENT</option></select><span data-dx-answer="${id}:${row.key}"></span></label>`).join('')}</article>`).join('');
  q('[data-dx-hint]').disabled=false;
  setFlightState?.(session.state);paint();
 }
 function advance(changes,seconds=0){experiment(session,changes,seconds);setFlightState?.(session.state);paint();if(session.result)result();}
 function result(){
  const r=session.result,target=q('[data-dx-result]');target.hidden=false;
  if(r.needsEvidence){target.innerHTML=`<h3>${r.status}</h3><p>More evidence is needed. The observed history supports multiple candidates. Change airspeed at fixed altitude or advance time, then submit again. A rejected candidate does not make the remaining alternatives uniquely identifiable.</p>`;return;}
  const d=debrief(session),key=evidenceRows(session).filter(row=>row.changed).map(labelRow).join(' · ')||'Compare response history, not just the final position.';
  target.innerHTML=`<h3>${r.status}</h3><p>${r.status==='PARTIALLY SUPPORTED'?'The specific hypothesis fits, but identify its fault family before concluding.':''}</p><h4>Diagnosis: ${d.diagnosis}</h4><p><strong>Key evidence:</strong> ${key}</p><p><strong>Why it fits:</strong> ${d.fits}</p><p><strong>Common-source reasoning:</strong> ${d.common}</p>
  <dl class="dx-trace"><div><dt>OBSERVATION</dt><dd>${key}</dd></div><div><dt>SHARED ELEMENT</dt><dd>${d.common}</dd></div><div><dt>FAULT HYPOTHESIS / DIAGNOSIS</dt><dd>${d.diagnosis}</dd></div><div><dt>CONFIRMING EVIDENCE / EXPERIMENT</dt><dd>${d.confirm}</dd></div><div><dt>CHAIN LOCATION</dt><dd>${d.location}</dd></div><div><dt>ERROR CATEGORY</dt><dd>${d.category}</dd></div><div><dt>TEMPORAL BEHAVIOR</dt><dd>${d.timePattern}</dd></div></dl>
  <details><summary>Why not the alternatives?</summary>${visibleCandidates(session).filter(id=>id!==session.scenario.hiddenFaultId).map(id=>`<p><strong>Why not ${candidates[id].name}?</strong> ${explanations[id].whyNot} ${evidenceRows(session).filter(row=>candidateEvidence(session,id,row.key)==='INCONSISTENT').map(row=>row.name).join(', ')} does not match this case history.</p>`).join('')}</details>
  <p><strong>Symptom pattern:</strong> ${d.fits}</p><p>${d.trust}</p><button type="button" data-dx-healthy aria-expanded="false">Show healthy reference</button><div data-dx-healthy-values hidden></div>
  <h4>Revealed measurement-chain location</h4><p>FAULT: ${d.location}. Highlight uses outline and text in addition to color. Educational reference/response is degraded, not the physical aircraft state.</p><div data-dx-chain></div>`;
  const c=candidates[session.scenario.hiddenFaultId],container=q('[data-dx-chain]');
  if(c.family==='pitot-static')container.innerHTML=`<div class="ps-topology ps-horizontal">${diagram(c.instrument,false,'diagnostic')}</div><div class="ps-topology ps-vertical">${diagram(c.instrument,true,'diagnostic')}</div>`;
  else{container.innerHTML=path(c.instrument);chainFace=instruments.find(i=>i.id===c.instrument).create(container.querySelector('[data-chain-face]'));container.querySelector('[data-path-badge]').textContent='FAULT REVEALED';container.querySelector(`[data-component="${c.component}"]`).insertAdjacentHTML('beforeend','<strong>REFERENCE / GYRO FAULT</strong>');}
  container.querySelectorAll(`[data-component="${c.component}"]`).forEach(el=>el.classList.add('dx-fault-location'));
  session.healthyVisible=false;paint();
 }
 function paint(){
  if(!session)return;
  const reveal=Boolean(session.result&&!session.result.needsEvidence),challenge=session.mode==='challenge'&&!reveal;
  panel.dataset.diagnosticMode=session.mode;panel.dataset.scenarioId=session.scenario.id;
  q('[data-dx-context]').textContent=`${session.scenario.title} · ${session.scenario.difficulty} · ${session.mode.toUpperCase()}${session.mode==='guided'?` · ${familyNames[session.scenario.faultFamily]} fault suspected`:''}`;
  q('#dx-family').closest('label').hidden=session.mode==='guided';
  q('[data-dx-focus]').textContent=focused?`Teaching Focus: ${session.mode==='guided'?familyNames[session.scenario.faultFamily]+' family': 'compare all six instruments'}; hidden fault location is not revealed.`:'Teaching Focus off: all six indications remain visible.';
  // Focus uses only known family before an attempt, never the hidden fault.
  panel.querySelectorAll('[data-dx-face]').forEach(el=>el.classList.toggle('dx-focus',focused&&session.mode==='guided'&&(session.scenario.faultFamily==='pitot-static'?['airspeed','altimeter','vsi']:['attitude','heading','turn']).includes(el.dataset.dxFace)));
  q('[data-dx-clock]').textContent=`Simulation time: ${session.elapsed.toFixed(1)} s · Paused unless Run simulation clock is checked. Reduced motion does not stop time evolution.`;
  text('[data-dx-feedback]',`Session feedback: ${session.attempts} attempts · ${session.hints} hints · ${session.experiments} experiments${session.result?' · '+session.result.status:''}`);
  const o=session.observation;
  renderers.forEach(r=>{const state=r.id==='turn'?{...o.display,bank:o.display.turnBank}:o.display;r.update(state);r.output.textContent=r.read(state);});
  headingAngle=continuousHeading(headingAngle,o.values.heading);q('[data-dx-face="heading"] [data-part="card"]').setAttribute('transform',`rotate(${-headingAngle} 100 100)`);
  const rows=evidenceRows(session);
  q('[data-dx-evidence]').innerHTML=rows.map(row=>`<article><strong>${labelRow(row)}</strong>${challenge?'':`<p>${row.changed?'DIFFERENT from same-state reference':'Matches same-state reference within teaching tolerance'}.</p>`}</article>`).join('')+(challenge?'':`<article><strong>Pressure signals delivered</strong><p>ASI Pt ${number(o.pressure.effective.asiPt/1000)} kPa · ASI Ps ${number(o.pressure.effective.asiPs/1000)} kPa · Altimeter/VSI Ps ${number(o.pressure.effective.altimeterPs/1000)} kPa</p></article>`);
  q('[data-dx-history]').innerHTML=session.history.slice(-6).map(h=>{const v=h.outputs[session.scenario.hiddenFaultId].values,s=h.state;return `<li>${h.time.toFixed(1)} s · Controls: ${s.airspeed} kt / ${s.altitude} ft / ${s.verticalSpeed} ft/min / pitch ${s.pitch}° / Bank proxy ${s.bank}° / heading ${s.heading}°. Indications: ASI ${number(v.airspeed)} kt, ALT ${number(v.altimeter)} ft, VSI ${number(v.vsi)} ft/min, AI ${number(v.pitch)}° / ${number(v.bank)}°, HI ${number(v.heading)}°, TC normalized ${number(v.turn)}.</li>`;}).join('');
  q('[data-dx-suggestion]').textContent='TRY THIS: '+suggestedExperiment(session).text;
  panel.querySelectorAll('[data-dx-row]').forEach(el=>{el.textContent=labelRow(rows.find(row=>row.key===el.dataset.dxRow));});
  panel.querySelectorAll('[data-dx-answer]').forEach(el=>{const [id,key]=el.dataset.dxAnswer.split(':');el.textContent=reveal?'Model: '+candidateEvidence(session,id,key):'';});
  if(chainFace){const c=candidates[session.scenario.hiddenFaultId];chainFace(c.instrument==='turn'?{...o.display,bank:o.display.turnBank}:o.display);}
  if(session.healthyVisible)healthy();
 }
 function healthy(){
  const target=q('[data-dx-healthy-values]');if(!target)return;
  const o=session.observation,c=candidates[session.scenario.hiddenFaultId],fault=session.contexts[session.scenario.hiddenFaultId].fault,snapshot=fault.snapshot;
  const p=snapshot.parameters,parameterText=c.type==='drive'?`Educational decay time ${p.decaySeconds} s`:c.type==='drift'?`Educational signed drift ${p.driftRate}°/min`:c.type==='bias'?`Pitch / bank reference biases ${p.pitchBias}° / ${p.bankBias}°`:c.type==='effectiveness'?`Gyro effectiveness ${p.effectiveness*100}%`:`Educational leak severity ${fault.severity*100}%`;
  target.hidden=false;target.innerHTML=`<h4>Same-state healthy vs effective indications</h4><dl>${evidenceRows(session).map(row=>`<div><dt>${row.name}</dt><dd>Healthy ${number(row.healthy)} ${row.unit} → effective ${number(row.value)} ${row.unit}</dd></div>`).join('')}</dl><p>Physical Ps ${number(o.pressure.physical.ps/1000)} kPa · physical Pt ${number(o.pressure.physical.pt/1000)} kPa. Delivered ASI Pt ${number(o.pressure.effective.asiPt/1000)} kPa / Ps ${number(o.pressure.effective.asiPs/1000)} kPa. VSI uses the existing separate pressure-lag state.</p><p>${c.family==='gyroscopic'?`Healthy / effective reference: ${o.gyros[c.instrument].referenceType}; effectiveness ${number(o.gyros[c.instrument].effectiveness)}; accumulated HI error ${number(o.gyros[c.instrument].error)}°. Activation snapshot: event ${snapshot.event}; pitch ${snapshot.pitch}°; Bank proxy ${snapshot.bank}°; heading ${snapshot.heading}°. ${parameterText}.`:`Activation snapshot: event ${snapshot.event}; ${snapshot.airspeed} kt; ${snapshot.altitude} ft; captured Ps ${number(snapshot.ps/1000)} kPa / Pt ${number(snapshot.pt/1000)} kPa.${c.type==='pitot-leak'?' '+parameterText:''}`}</p>`;
 }
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-dx-reset]')){start();return;}
  if(!session)return;
  if(event.target.closest('[data-dx-next]')){selector.selectedIndex=(selector.selectedIndex+1)%scenarios.length;start();}
  if(event.target.closest('[data-dx-time]'))advance({},10);
  if(event.target.closest('[data-dx-experiment]')){const a=suggestedExperiment(session);advance(a.state,a.seconds||0);}
  if(event.target.closest('[data-dx-hint]')){if(session.hints<hints.length){const li=document.createElement('li');li.textContent=hints[session.hints++];q('[data-dx-hints]').append(li);}q('[data-dx-hint]').disabled=session.hints===hints.length;paint();}
  if(event.target.closest('[data-dx-healthy]')){session.healthyVisible=true;event.target.setAttribute('aria-expanded','true');healthy();}
 });
 panel.addEventListener('change',event=>{
  if([mode,selector,seed].includes(event.target)){start();return;}
  if(event.target.matches('[data-dx-mark]')){markCandidate(session,event.target.dataset.dxMark,event.target.value);panel.querySelectorAll('[data-dx-mark]').forEach(el=>el.value=session.marks[el.dataset.dxMark]||'possible');if(event.target.value==='most likely')q('#dx-diagnosis').value=event.target.dataset.dxMark;}
  if(event.target.matches('[data-dx-cell]'))session.matrix[event.target.dataset.dxCell]=event.target.value;
 });
 q('[data-dx-form]').addEventListener('submit',event=>{event.preventDefault();session.confidence=q('#dx-confidence').value;evaluate(session,q('#dx-diagnosis').value,q('#dx-family').value);result();paint();});
 return {
  open(){if(!session)start();else paint();},
  reset(){session=undefined;chainFace=undefined;q('.dx-faces').hidden=true;q('[data-dx-evidence]').replaceChildren();q('[data-dx-result]').hidden=true;q('[data-dx-result]').replaceChildren();q('[data-dx-hints]').replaceChildren();q('[data-dx-matrix]').replaceChildren();q('[data-dx-candidates]').replaceChildren();q('#dx-diagnosis').innerHTML='<option value="">Choose a diagnosis</option>';q('[data-dx-feedback]').textContent='Case cleared. Use Reset Scenario to begin again.';q('[data-dx-clock]').textContent='';q('[data-dx-history]').replaceChildren();q('[data-dx-context]').textContent='No active diagnostic case.';q('[data-dx-focus]').textContent='';q('#dx-family').value='uncertain';q('#dx-confidence').value='';q('#dx-running').checked=false;delete panel.dataset.scenarioId;},
  setFocus(enabled){focused=enabled;},
  update(state,dt=0){if(panel.hidden||!session)return;const changes=Object.fromEntries(Object.entries(state).filter(([key,value])=>Math.abs(value-session.state[key])>.001));if(Object.keys(changes).length)experiment(session,changes,0);
   if(q('#dx-running').checked&&dt>0){clockAccumulator+=dt;if(clockAccumulator>=.25){experiment(session,{},clockAccumulator,false);clockAccumulator=0;}}
   const now=performance.now();if(Object.keys(changes).length||now-lastPaint>250){lastPaint=now;paint();}
  }
 };
}
