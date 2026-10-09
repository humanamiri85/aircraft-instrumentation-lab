import {systemState,quantities,views,stages,headingWindow,affectedQuantities} from './model.js';
import {architectures,components,changed,unchanged,airNote,ahrsNote,validityNote,vsiNote,roadmapNote} from './content.js';
import {lessonTabs,bindLearningNavigation,lessonComponents,bindLessonComponents} from '../internal/navigation.js';
import {instruments} from '../catalog.js';
import {createAttitude} from '../instruments/attitude.js';

const signed=v=>`${v>0?'+':''}${Math.round(v)}`;
const heading=v=>String(Math.round(v)%360).padStart(3,'0');
const chain=(items,kind)=>`<ol class="modern-chain" aria-label="${kind} chain">${items.map((s,i)=>`<li data-component="${kind==='Modern'?s.element:'classical-'+s.element}"><strong>${i+1} · ${kind==='Modern'?components[i][1]:s.element}</strong><span>${s.label}</span><span data-modern-stage-badge></span></li>`).join('')}</ol>`;
export function createModernView(panel){
 const button=document.querySelector('#modern-instrumentation');
 panel.innerHTML=`<div class="section-heading"><h2 id="modern-title">Modern Aircraft Instrumentation</h2><button type="button" data-close-modern>Close workspace</button></div>
 <p>Same physical quantities → different sensing, processing and presentation. This optional workspace shows healthy teaching references; the main cockpit retains its Phase 5 fault behavior.</p>
 ${lessonTabs('modern','Modern aircraft systems',views)}
 ${views.map(([id,title],i)=>`<section id="modern-panel-${id}" role="tabpanel" aria-labelledby="modern-tab-${id}" ${i?'hidden':''}><h3>${title}</h3>${id==='overview'?`<div class="modern-architectures">${architectures.map(a=>`<article><h4>${a.title}</h4><ol>${a.chain.map(s=>`<li>${s}</li>`).join('')}</ol><p>${a.note}</p></article>`).join('')}</div><div class="modern-takeaway"><article><h4>What changed?</h4><ul>${changed.map(s=>`<li>${s}</li>`).join('')}</ul></article><article><h4>What did not change?</h4><ul>${unchanged.map(s=>`<li>${s}</li>`).join('')}</ul></article></div>`:id==='air-data'?`<p>${airNote}</p><p>Pt / Ps → pressure transducers → electrical representation → conceptual digital conversion → Air Data Computer / Module → computed flight parameters → digital avionics data → PFD.</p><dl class="modern-pressure"><div><dt>Healthy physical Pt</dt><dd><output data-modern-pressure="pt" aria-live="off"></output></dd></div><div><dt>Healthy physical Ps</dt><dd><output data-modern-pressure="ps" aria-live="off"></output></dd></div><div><dt>Pt − Ps</dt><dd><output data-modern-pressure="q" aria-live="off"></output></dd></div></dl>`:`<p>${ahrsNote}</p><p>Motion / acceleration → electronic rate gyros + accelerometers → AHRS with references / aiding → digital attitude / heading solution → avionics data → PFD.</p><p>AI continuity: vertical-reference attitude concept. HI continuity: distinct directional / heading reference concept. These are reference roles, not two mechanical stabilized gyros inside AHRS. Rate-related turn information is conceptual only: Bank is not angular rate.</p>`}</section>`).join('')}
 <div class="modern-controls"><label for="modern-quantity">Trace a flight quantity<select id="modern-quantity">${Object.values(quantities).map(q=>`<option value="${q.id}">${q.title}</option>`).join('')}</select></label><label for="modern-presentation">Display comparison<select id="modern-presentation"><option value="classical">Classical</option><option value="modern">Modern</option><option value="both" selected>Side by Side</option></select></label></div>
 <p data-modern-focus></p><p data-modern-flow role="status"></p>
 <div class="modern-quantity-detail"></div>
 <h3>Sensor → Computer → Display</h3><p>Select a stage to trace information. Outlines and text badges identify focus and live changes; animation is not required.</p>${lessonComponents(components,'Modern system')}
 <div class="modern-comparison" data-modern-presentation="both"><section class="modern-classical" aria-label="Healthy classical comparison"><h3>Classical indications · healthy reference</h3><div class="modern-classical-faces">${instruments.map(i=>`<article data-modern-classical="${i.id}"><h4>${i.abbr}</h4><div class="drawing"></div><output aria-live="off"></output></article>`).join('')}</div></section>
 <section class="modern-digital" aria-label="Simplified Primary Flight Display"><h3>Primary Flight Display · educational</h3><p class="modern-validity">HEALTHY TEACHING REFERENCE<br>Value + validity / reliability</p><div class="pfd-frame">
 <div class="pfd-airspeed" data-pfd-region="airspeed"><h4>AIRSPEED</h4><ol class="pfd-tape" data-pfd-tape="airspeed" aria-hidden="true"></ol><output data-pfd-value="airspeed" aria-label="PFD airspeed" aria-live="off"></output><span>kt · pressure-inferred</span></div>
 <div class="pfd-attitude" data-pfd-region="attitude"><h4>ATTITUDE</h4><div data-pfd-horizon></div><div class="pfd-attitude-values"><output data-pfd-value="pitch" aria-label="PFD pitch" aria-live="off"></output><output data-pfd-value="bank" aria-label="PFD bank" aria-live="off"></output></div><span>Ideal supplied AHRS solution</span></div>
 <div class="pfd-altitude" data-pfd-region="altimeter"><h4>ALTITUDE</h4><ol class="pfd-tape" data-pfd-tape="altitude" aria-hidden="true"></ol><output data-pfd-value="altitude" aria-label="PFD altitude" aria-live="off"></output><span>ft · Ps-inferred</span></div>
 <div class="pfd-heading" data-pfd-region="heading"><h4>HEADING</h4><ol class="pfd-heading-tape" aria-hidden="true"></ol><output data-pfd-value="heading" aria-label="PFD heading" aria-live="off"></output><span>Supplied directional reference</span></div>
 <div class="pfd-vsi" data-pfd-region="vsi"><h4>VERTICAL SPEED</h4><output data-pfd-value="verticalSpeed" aria-label="PFD vertical speed" aria-live="off"></output><span>ft/min · shared healthy lag</span></div>
 </div><p>Turn-rate presentation is conceptual here: electronic rate sensing can supply rate-related information, but this app has no true angular-rate input or numeric turn-rate estimate. Bank remains only the TC teaching proxy; the classical ball remains separate.</p></section></div>
 <p class="internal-note">${vsiNote}</p><section><h3>Digital information is not automatically valid</h3><p>${validityNote}</p><p>Classical displacement / pointer position carries information mechanically; numerical digital values carry it between modern systems. The conceptual avionics data path does not simulate ARINC, AFDX or other protocols.</p></section><p class="internal-note">Conceptual, idealized teaching architecture; not manufacturer-specific hardware or an implemented flight computer. No electronic sensor streams, circuit voltages, detailed conversion theory, navigation estimator or redundancy logic are simulated.</p><p class="internal-note">${roadmapNote}</p>`;
 const q=s=>panel.querySelector(s),selector=q('#modern-quantity'),presentation=q('#modern-presentation');
 const faces=instruments.map(i=>({id:i.id,update:i.create(q(`[data-modern-classical="${i.id}"] .drawing`)),read:i.read,output:q(`[data-modern-classical="${i.id}"] output`)}));
 const horizon=createAttitude(q('[data-pfd-horizon]'));
 let selected='airspeed',focused=true,latest,lastState,changedIds=[],activeStage,lastValues,disposeComponents=()=>{};
 const navigation=bindLearningNavigation(panel,{prefix:'modern',initial:'overview',onSelect(){const allowed=Object.values(quantities).filter(m=>panel.dataset.view==='overview'||m.system===panel.dataset.view);selector.querySelectorAll('option').forEach(option=>option.disabled=!allowed.some(m=>m.id===option.value));if(!allowed.some(m=>m.id===selected)){selected=allowed[0].id;selector.value=selected;}renderChain();}});
 function renderChain(){
  const m=quantities[selected];
  q('.modern-quantity-detail').innerHTML=`<h3>${m.title}: classical → modern</h3><p>Desired quantity: ${m.targetQuantity}. ${m.system==='air-data'?`Direct pressure input: ${m.directInput}. Output remains inferred.`:`Classical reference role: ${m.reference}. Modern sensor / processing path uses the same reference requirement concept.`}</p>${m.id==='turn'?'<p class="gc-proxy-note">APP CONTROL: Bank proxy. REAL MEASURAND: Angular rate. No numerical angular-rate estimate is derived from bank angle.</p>':''}<div class="modern-chain-pair"><article class="modern-classical"><h4>Classical</h4>${chain(m.classical,'Classical')}</article><article class="modern-digital"><h4>${m.system==='air-data'?'Air Data':'AHRS / inertial information'}</h4>${chain(m.modern,'Modern')}</article></div>`;
  panel.dataset.modernSystem=m.system;panel.dataset.modernQuantity=m.id;panel.dataset.modernReference=m.reference||'none';panel.dataset.modernPressureInputs=m.inputs.join(',');
  disposeComponents=bindLessonComponents(panel,components);highlight();updateValues();
 }
 function highlight(){
  panel.querySelectorAll('.modern-chain [data-component]').forEach(el=>{const stage=el.dataset.component;el.classList.toggle('modern-live',changedIds.includes(selected)&&stages.includes(stage));el.querySelector('[data-modern-stage-badge]').textContent=stage===activeStage?'SELECTED STAGE':changedIds.includes(selected)&&stages.includes(stage)?'LIVE CHANGE':focused?'FOCUSED CHAIN':'';el.classList.toggle('modern-focused',focused);el.classList.toggle('component-active',stage===activeStage);});
  q('[data-modern-focus]').textContent=focused?`Teaching Focus: ${quantities[selected].title} ${quantities[selected].system==='air-data'?'Air Data':'inertial / reference'} chain emphasized.`:'Teaching Focus off: classical and modern chains remain visible.';
  panel.querySelectorAll('[data-pfd-region]').forEach(el=>el.classList.toggle('modern-live',changedIds.includes(el.dataset.pfdRegion)));
 }
 function updateValues(){
  if(!latest)return;const m=systemState(latest[0],latest[1]),s=m.pfd;
  panel.dataset.modernReducedMotion=String(latest[2]);
  const signature=Object.values(s).join('|');if(signature===lastValues)return;lastValues=signature;
  faces.forEach(r=>{r.update(s);const value=r.read(s);if(r.output.textContent!==value)r.output.textContent=value;});horizon(s);
  const values={airspeed:Math.round(s.airspeed).toLocaleString('en-US'),altitude:Math.round(s.altitude).toLocaleString('en-US'),verticalSpeed:signed(s.verticalSpeed),pitch:`Pitch ${signed(s.pitch)}°`,bank:`Bank ${signed(s.bank)}°`,heading:`${heading(s.heading)}°`};
  Object.entries(values).forEach(([key,value])=>{const el=q(`[data-pfd-value="${key}"]`);if(el.textContent!==value)el.textContent=value;});
  for(const key of ['airspeed','altitude']){const step=key==='airspeed'?10:500,center=Math.round(s[key]/step)*step;q(`[data-pfd-tape="${key}"]`).innerHTML=[2,1,0,-1,-2].map(offset=>`<li>${Math.max(0,center+offset*step).toLocaleString('en-US')}</li>`).join('');}
  q('.pfd-heading-tape').innerHTML=headingWindow(s.heading).map(v=>`<li>${heading(v)}</li>`).join('');
  for(const key of ['pt','ps','q'])q(`[data-modern-pressure="${key}"]`).textContent=`${(m.air[key]/1000).toFixed(3)} kPa`;
 }
 selector.addEventListener('change',()=>{selected=selector.value;activeStage=undefined;renderChain();});
 presentation.addEventListener('change',()=>{panel.dataset.presentation=presentation.value;q('[data-modern-presentation]').dataset.modernPresentation=presentation.value;});
 panel.addEventListener('click',event=>{const component=event.target.closest('[data-select-component]');if(component){activeStage=component.dataset.selectComponent;highlight();}if(event.target.closest('[data-close-modern]')){button.click();button.focus();}});
 panel.dataset.presentation='both';renderChain();
 return {
  dispose(){disposeComponents();},
  select(id){if(quantities[id]&&(panel.dataset.view==='overview'||quantities[id].system===panel.dataset.view)){selected=id;selector.value=id;activeStage=undefined;renderChain();}},
  open(){panel.hidden=false;button.setAttribute('aria-expanded','true');panel.scrollIntoView({behavior:'auto',block:'start'});navigation.tabs.find(t=>t.getAttribute('aria-selected')==='true').focus({preventScroll:true});},
  setExtensionFocus(enabled){if(focused!==enabled){focused=enabled;highlight();}},
  update(state,lag,reduced=false){latest=[state,lag,reduced];if(lastState){const keys=Object.keys(state).filter(key=>state[key]!==lastState[key]);if(keys.length){changedIds=affectedQuantities(keys);const names=changedIds.map(id=>quantities[id].title).join(', ');q('[data-modern-flow]').textContent=`LIVE CHANGE: ${names}. ${changedIds.some(id=>quantities[id].system==='air-data')?'Pressure information → Air Data processing → digital data → PFD. ':''}${changedIds.some(id=>quantities[id].system==='ahrs')?'Inertial / reference concept → AHRS solution → digital data → PFD. Bank is not angular rate.':''}`;highlight();}}lastState={...state};updateValues();}
 };
}
