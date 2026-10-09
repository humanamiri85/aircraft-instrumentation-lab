import {instruments} from '../catalog.js';
import {focusFor} from './model.js';
import {instruments as measurement} from '../measurement/comparison/model.js';

const panels=[['modern','modern-title'],['diagnostics','diagnostics-title'],['gyro-faults','gyro-faults-title'],['faults','faults-title'],['comparison','comparison-title'],['asi','internal-title'],['altimeter','altimeter-internal-title'],['vsi','vsi-internal-title'],['attitude','attitude-internal-title'],['heading','heading-internal-title'],['turn','turn-internal-title'],['gyro','gyro-title']];
// Guided-specific DOM adapter for the existing app's public controls and views.
// No copy of its state, frame loop, lag, faults or rendering calculations lives here.
export function labShell(){return `<div id="lab-host" class="workspace">
 <div class="flight-panels"><section class="cockpit" data-journey-module="cockpit" aria-label="Six-pack cockpit"><h2>Primary flight instruments</h2><div id="instruments" class="instrument-grid"></div></section>
 ${panels.map(([id,title])=>`<section id="${id}-internal" class="internal-panel ${['modern','diagnostics','gyro-faults','faults','comparison'].includes(id)?id+'-panel':''}" aria-labelledby="${title}" hidden></section>`).join('')}
 <section class="aircraft-panel" data-journey-module="aircraft" aria-labelledby="aircraft-title"><h2 id="aircraft-title">Aircraft & flight-state cues</h2><label class="flight-data-toggle"><input id="show-flight-data" type="checkbox" checked aria-controls="flight-data"> Show flight data</label><div class="aircraft-viewport"><p class="aircraft-status" role="status">Loading aircraft view…</p><dl id="flight-data" class="attitude-overlay" aria-label="Flight state">${[['airspeed','IAS'],['altitude','ALT'],['verticalSpeed','V/S'],['pitch','PITCH'],['bank','BANK'],['heading','HDG']].map(([id,label])=>`<div><dt>${label}</dt><dd data-flight="${id}"></dd></div>`).join('')}</dl></div><div class="flight-cue-readings"><span data-cue="altitude"></span><span data-cue="verticalSpeed"></span></div><p>Flight variables are independently controlled. No flight dynamics are simulated. Altitude is not to scale; airspeed uses a relative-motion cue.</p></section></div>
 <aside data-journey-module="controls"><section class="controls"><div class="section-heading"><h2>Try the controls</h2><button id="reset" type="button">Reset flight state</button></div><p id="control-guidance">Move the highlighted control and observe its linked indication.</p><div id="controls"></div></section></aside>
 <div hidden><input id="teaching-focus" type="checkbox" checked><span id="focus-summary"></span><section id="info"></section><nav aria-label="Lab adapter actions"><button id="measurement-comparison" type="button" aria-expanded="false">Comparison</button><button id="pitot-static-faults" type="button" aria-expanded="false">Pressure faults</button><button id="gyro-faults" type="button" aria-expanded="false">Gyro faults</button><button id="diagnostic-scenarios" type="button" aria-expanded="false">Diagnostics</button><button id="modern-instrumentation" type="button" aria-expanded="false">Modern</button></nav></div></div>`;}

const prefix=id=>id==='airspeed'?'asi':id;
export function createLabAdapter(){
 let version=0;
 const q=selector=>document.querySelector(selector);
 function focus(id,all=false){
  const linked=focusFor(id);
  q('#instruments').querySelectorAll('[data-instrument]').forEach(el=>el.classList.toggle('journey-context',el.dataset.instrument!==id));
  q('#controls').querySelectorAll('[data-variable]').forEach(row=>{row.hidden=!all&&!linked.variables.includes(row.dataset.variable);row.classList.toggle('journey-current',linked.variables.includes(row.dataset.variable));});
  q('#journey-detail').textContent=`${instruments.find(i=>i.id===id).name}: ${instruments.find(i=>i.id===id).interpretation}${id==='turn'?' APP CONTROL: Bank proxy only. REAL MEASURAND: Angular rate. The inclinometer stays centered.':''}`;
 }
 function choose(id,all=false){q(`[data-instrument="${id}"]`).click();focus(id,all);}
 async function wait(selector,token=version){for(let i=0;i<100;i++){if(token!==version)return null;const el=q(selector);if(el)return el;await new Promise(resolve=>setTimeout(resolve,30));}return null;}
 async function internal(id,chain=false){
  const token=++version;choose(id);const panel=q(`#${prefix(id)}-internal`);panel.dataset.journeyVisible='true';
  const open=await wait('#inside-instrument',token);if(token!==version)return;open?.click();
  const tab=await wait(`#${prefix(id)}-tab-${chain?'chain':'cutaway'}`,token);if(token!==version)return;
  if(tab)tab.click();else{panel.hidden=false;const fallback=document.createElement('p');fallback.setAttribute('role','status');fallback.textContent='This optional lesson is unavailable. Continue the Journey or Explore Full Lab.';panel.append(fallback);}
 }
 function closePanels(){version++;q('#lab-host').querySelectorAll('.internal-panel').forEach(panel=>{panel.hidden=true;delete panel.dataset.journeyVisible;});q('#lab-host nav').querySelectorAll('button').forEach(button=>button.setAttribute('aria-expanded','false'));}
 function clearTemporary(){q('#faults-internal [data-clear]')?.click();q('#gyro-faults-internal [data-gf-clear]')?.click();q('#reset').click();}
 function openSystem(panelId,buttonId){const panel=q('#'+panelId);panel.dataset.journeyVisible='true';if(panel.hidden)q('#'+buttonId).click();}
 async function fault(type){
  q('#faults-internal [data-clear]')?.click();q('#gyro-faults-internal [data-gf-clear]')?.click();closePanels();
  if(type==='gyro'){choose('heading',true);openSystem('gyro-faults-internal','gyro-faults');const select=await wait('#gf-instrument');if(!select)return;select.value='heading';select.dispatchEvent(new Event('change',{bubbles:true}));q('#gf-type').value='drift';q('#gf-type').dispatchEvent(new Event('change',{bubbles:true}));}
  else{choose(type==='blocked-static'?'altimeter':'airspeed',true);openSystem('faults-internal','pitot-static-faults');const select=await wait('#fault-type');if(!select)return;select.value=type;select.dispatchEvent(new Event('change',{bubbles:true}));}
 }
 return {choose,focus,internal,closePanels,clearTemporary,openSystem,fault,
  async diagnostics(){openSystem('diagnostics-internal','diagnostic-scenarios');await wait('#dx-mode');},
  async modern(){choose('airspeed',true);openSystem('modern-internal','modern-instrumentation');await wait('#modern-presentation');},
  async fundamentals(){choose('attitude');const button=await wait('#gyro-fundamentals');const panel=q('#gyro-internal');panel.dataset.journeyVisible='true';button?.click();},
  dispose(){version++;}
 };
}

// Phase 4C's structured metadata supports same-family pairs without changing its
// intentionally cross-family selector API. Live indications are read from the
// existing cockpit DOM, not recalculated or advanced by the Journey.
export function comparisonCards(left,right){
 return [left,right].map(id=>{const m=measurement[id];return `<article data-journey-comparison="${id}"><h3>${m.title}</h3><p>${m.badges.join(' · ')}</p><dl>${[['Displayed quantity',m.targetQuantity],['Actually sensed / sensing concept',m.directlySensedQuantity],['Source / reference',m.sourceOrReference]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><details><summary>Show full engineering comparison</summary><dl>${[['Transmission',m.transmission],['Sensing element',m.sensingElement],['Conversion',m.conversion],['Inference / reference',m.inference],['Teaching simplification',m.teachingSimplification]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></details><p>Live indication: <output data-journey-indication="${id}" aria-live="off"></output></p></article>`;}).join('');
}
export function syncComparison(){document.querySelectorAll('[data-journey-indication]').forEach(el=>{const value=document.querySelector(`[data-instrument="${el.dataset.journeyIndication}"] .instrument-value`).textContent;if(el.textContent!==value)el.textContent=value;});}
