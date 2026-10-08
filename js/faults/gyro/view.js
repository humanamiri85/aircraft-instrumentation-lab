import {definitions,initialFault,initialParameters,parameters,activate,clear,advance,transform} from './model.js';
import {titles,steps,questions,assumptions} from './content.js';
import {path} from '../../measurement/gyro/view.js';
import {createAttitude} from '../../instruments/attitude.js';
import {createHeading} from '../../instruments/heading.js';
import {createTurn} from '../../instruments/turn.js';
import {continuousHeading} from '../../internal/heading/model.js';
const text=(element,value)=>{if(element.textContent!==value)element.textContent=value;};
export function createGyroFaultView(panel,onChange) {
 let state,selected='attitude',focused=true,fault=initialFault(),lastKey,headingAngle;
 const fields=[['decaySeconds','Educational decay time (seconds)',2,60,1,15,'drive'],['driftRate','Signed educational drift rate (deg/min)',-12,12,1,3,'drift'],['pitchBias','Pitch reference bias (degrees)',-5,5,1,3,'bias'],['bankBias','Bank reference bias (degrees)',-10,10,1,5,'bias'],['effectiveness','TC gyro effectiveness (%)',0,100,1,50,'effectiveness']];
 panel.innerHTML=`<h2 id="gyro-faults-title">Gyroscopic Failures and Reference Degradation</h2><p>Healthy gyro / reference → fault → degraded effective state → conversion → symptom → interpretation.</p>
 <fieldset><legend>Gyro Fault Injection</legend><p role="status" data-gf-status></p><label for="gf-instrument">Instrument</label><select id="gf-instrument">${Object.entries(titles).map(([id,title])=>`<option value="${id}">${title}</option>`).join('')}</select><label for="gf-type">Fault</label><select id="gf-type"></select>
 ${fields.map(([key,label,min,max,step,value,type])=>`<label data-gf-parameter="${type}" for="gf-${key}">${label}<input id="gf-${key}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('')}
 <button type="button" data-gf-activate>Activate Fault</button><button type="button" data-gf-clear>Clear Fault</button><p data-gf-snapshot></p></fieldset>
 <p data-gf-focus></p><div class="gc-topology">${Object.keys(titles).map(path).join('')}</div>
 <p data-gf-propagation></p><h3>Healthy vs effective state</h3><dl class="fault-values">${['Healthy state','Effective state','Reference / sensing type','Gyro effectiveness','Accumulated HI error','Elapsed fault time'].map((label,i)=>`<div><dt>${label}</dt><dd><output aria-live="off" data-gf-value="${i}"></output></dd></div>`).join('')}</dl>
 <p>TC APP CONTROL: Bank proxy. REAL MEASURAND: Angular rate. The separate inclinometer remains centered; no slip/skid dynamics are modeled.</p><p>Physical flight-state controls stay independent. Other chain lessons explain healthy references; the cockpit and this fault diagram show degraded indications.</p>
 <div class="fault-cards">${Object.entries(titles).map(([id,title])=>`<article data-gf-card="${id}"><h3>${title}</h3><strong></strong><p></p></article>`).join('')}</div>
 <h3>Guided fault explanation</h3><ol data-gf-steps></ol><h3>Diagnostic reasoning</h3>${questions.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
 <p>These are instrument-specific injections. A shared drive fault could affect multiple instruments in an actual aircraft, but this lesson does not model a common vacuum/electrical supply or imply specific aircraft plumbing.</p><p class="internal-note">${assumptions}</p><p class="internal-note">AI pitch/bank indications retain the existing bounded teaching ranges. Bias subtracts from aircraft orientation before the existing vertical-reference mapping; saturation at the teaching limits is a visual/model bound, not hardware-specific failure physics.</p>`;
 const instrument=panel.querySelector('#gf-instrument'),type=panel.querySelector('#gf-type');
 const faces={attitude:createAttitude(panel.querySelector('[data-chain-face="attitude"]')),heading:createHeading(panel.querySelector('[data-chain-face="heading"]')),turn:createTurn(panel.querySelector('[data-chain-face="turn"]'))};
 function refreshOptions(){type.innerHTML=Object.values(definitions).filter(d=>d.instruments.includes(selected)).map(d=>`<option value="${d.id}">${d.title}</option>`).join('');}
 function readParameters(){return parameters(Object.fromEntries(fields.map(([key])=>[key,Number(panel.querySelector(`#gf-${key}`).value)/(key==='effectiveness'?100:1)])));}
 function resetFields(){const p=initialParameters();fields.forEach(([key])=>panel.querySelector(`#gf-${key}`).value=p[key]*(key==='effectiveness'?100:1));}
 refreshOptions();
 instrument.addEventListener('change',()=>{fault=clear(fault);selected=instrument.value;refreshOptions();resetFields();lastKey=undefined;onChange();});
 type.addEventListener('change',()=>{fault=clear(fault);lastKey=undefined;onChange();});
 fields.forEach(([key])=>panel.querySelector(`#gf-${key}`).addEventListener('input',()=>{fault={...fault,parameters:readParameters()};panel.querySelector(`#gf-${key}`).value=fault.parameters[key]*(key==='effectiveness'?100:1);onChange();}));
 panel.querySelector('[data-gf-activate]').addEventListener('click',()=>{fault=activate(fault,selected,type.value,state,readParameters());onChange();});
 panel.querySelector('[data-gf-clear]').addEventListener('click',()=>{fault=clear(fault);type.value='normal';resetFields();lastKey=undefined;onChange();});
 return {
  tick(next,dt=0){state=next;fault=advance(fault,dt,next);return {[selected]:transform(next,selected,fault).displayState};},
  reset(){fault=initialFault();selected='attitude';instrument.value=selected;refreshOptions();resetFields();lastKey=undefined;},
  setFocus(enabled){focused=enabled;},
  update(next,reduced){state=next;if(panel.hidden)return;const key=JSON.stringify([next,fault,selected,focused,type.value,reduced]);if(key===lastKey)return;lastKey=key;
   const m=transform(next,selected,fault);Object.assign(panel.dataset,{gyroFaultInstrument:selected,faultType:fault.type,effectiveness:String(m.effectiveness),error:String(m.error),elapsed:String(m.elapsed),event:String(fault.event),effectivePitch:String(m.effectiveState.pitch??''),effectiveBank:String(m.effectiveState.bank??''),effectiveHeading:String(m.effectiveState.heading??''),effectiveResponse:String(m.effectiveState.rateProxy??''),reducedMotion:String(reduced)});
   const describe=s=>selected==='attitude'?`Pitch ${s.pitch.toFixed(1)}° · bank ${s.bank.toFixed(1)}°`:selected==='heading'?`${s.heading.toFixed(2)}°`:`${s.rateProxy.toFixed(3)} normalized${s===m.effectiveState?'':` · Bank proxy ${s.bank}°`} · ball ${s.ballOffset}`;
   const p=fault.snapshot?.parameters,parameterNote=p?(fault.type==='drive'?`decay ${p.decaySeconds} s`:fault.type==='drift'?`signed drift ${p.driftRate} deg/min`:fault.type==='bias'?`pitch reference bias ${p.pitchBias}°, bank reference bias ${p.bankBias}°`:`gyro effectiveness ${100*p.effectiveness}%`):'';
   text(panel.querySelector('[data-gf-status]'),m.status);panel.querySelectorAll('[data-gf-parameter]').forEach(label=>label.hidden=label.dataset.gfParameter!==type.value);
   text(panel.querySelector('[data-gf-snapshot]'),fault.snapshot?`FAULT ACTIVATED HERE · event ${fault.snapshot.event} · ${titles[selected]} · pitch ${fault.snapshot.pitch}° · bank ${fault.snapshot.bank}° · heading ${fault.snapshot.heading}° · healthy ${m.referenceType} state: ${describe(fault.snapshot.healthyState)} · ${parameterNote}`:'No activation snapshot. Changing instrument or fault selection clears the previous injection. Activate captures current healthy reference and parameters.');
   text(panel.querySelector('[data-gf-focus]'),focused?`Teaching Focus: ${titles[selected]} reference/response path emphasized; other paths remain visible.`:'Teaching Focus off: all gyro paths shown equally.');
   for(const id of Object.keys(titles)){
    const row=panel.querySelector(`[data-gyro-path="${id}"]`),active=id===selected;row.classList.toggle('gc-dimmed',focused&&!active);row.classList.toggle('gc-selected',focused&&active);text(row.querySelector('[data-path-badge]'),active?m.status:'HEALTHY');
    const healthy=transform(next,id).healthyState,effective=active?m.effectiveState:healthy;faces[id](effective);
    const reference=row.querySelector(`[data-component="${id==='attitude'?'gc-vertical':id==='heading'?'gc-directional':'gc-rate'}"] > div`);text(reference,!active||fault.type==='normal'?{attitude:'Ideal stabilized vertical gyro',heading:'Ideal directional gyro',turn:'Restrained rate gyro'}[id]:`${m.referenceType} gyro / reference — ${m.status} · ${m.observedSymptom}`);
    row.querySelectorAll('[data-component]').forEach(part=>part.classList.toggle('gyro-fault-path',active&&fault.type!=='normal'&&['gc-vertical','gc-directional','gc-rate','gc-precession','gc-relative','gc-conversion','gc-output'].includes(part.dataset.component)));
    if(id==='attitude'){row.querySelector('[data-motion]').setAttribute('transform',`rotate(${effective.casePitch})`);row.querySelector('[data-bank-projection] [data-motion]').setAttribute('transform',`rotate(${effective.caseBank})`);}
    if(id==='heading'){headingAngle=continuousHeading(headingAngle,effective.heading);row.querySelector('[data-motion]').setAttribute('transform',`rotate(${headingAngle})`);row.querySelector('[data-part="card"]').setAttribute('transform',`rotate(${-headingAngle} 100 100)`);}
    if(id==='turn'){row.querySelector('[data-motion]').setAttribute('transform',`rotate(${effective.gimbalAngle})`);row.querySelector('[data-spring]').setAttribute('transform',`rotate(${effective.gimbalAngle/2} 65 0)`);}
    const card=panel.querySelector(`[data-gf-card="${id}"]`);text(card.querySelector('strong'),active?m.status:'HEALTHY');text(card.querySelector('p'),active?m.observedSymptom:'Healthy reference / response; no injection in this instrument.');
   }
   [describe(m.healthyState),describe(m.effectiveState),m.referenceType,`${(100*m.effectiveness).toFixed(1)}%`,`${m.error>=0?'+':''}${m.error.toFixed(2)}°`,`${m.elapsed.toFixed(1)} s`].forEach((value,i)=>text(panel.querySelector(`[data-gf-value="${i}"]`),value));
   text(panel.querySelector('[data-gf-propagation]'),fault.type==='normal'?'HEALTHY reference / response → existing conversion → normal indication':`FAULT ${m.definition.title} → ${m.referenceType} reference/gyro → ${m.observedSymptom} → ${m.status}`);
   const guided=panel.querySelector('[data-gf-steps]');if(guided.dataset.type!==fault.type){guided.dataset.type=fault.type;guided.innerHTML=steps[fault.type].map(step=>`<li>${step}</li>`).join('');}
  }
 };
}
