import {definitions,initialFault,activateFault,clearFault,setSeverity,transform,status} from './model.js';
import {diagram} from '../../measurement/pitot-static/view.js';
import {focusedRegions} from '../../measurement/pitot-static/model.js';
import {guided,symptoms,questions} from './content.js';
export function createFaultView(panel,onChange) {
  let fault=initialFault(),state,lag,selected='airspeed',focused=true;
  panel.innerHTML=`<h2 id="faults-title">Pitot-Static Faults and Fault Propagation</h2>
  <p>Fault location → altered signal → instrument branch → symptom → diagnostic interpretation.</p>
  <fieldset><legend>Fault Injection</legend><p role="status" data-fault-status></p>
  <label for="fault-type">Fault Type</label><select id="fault-type">${Object.entries(definitions).map(([id,d])=>`<option value="${id}">${d.title}</option>`).join('')}</select>
  <label for="leak-severity">Educational leak severity (0–100%)</label><input id="leak-severity" type="number" min="0" max="100" step="1" value="50">
  <button type="button" data-activate>Activate Fault</button><button type="button" data-clear>Clear Fault / Return to Normal</button>
  <p data-snapshot></p></fieldset>
  <p>Healthy physical controls and pressure sources remain independent. Cockpit indications use effective delivered inputs. Other measurement-chain lessons remain physical-reference explanations.</p>
  <div class="ps-topology">${diagram('airspeed',false,'faults')}${diagram('airspeed',true,'faults')}</div><p data-propagation></p><p data-fault-focus></p>
  <h3>Healthy vs effective pressure signals</h3><dl class="fault-values">${['Live Ps','Live Pt','Healthy q','Effective ASI Pt','Effective ASI Ps','Effective Altimeter Ps','Effective VSI Ps','Effective q','ASI indication','Altimeter indication','VSI indication'].map((label,i)=>`<div><dt>${label}</dt><dd><output data-fault-value="${i}"></output></dd></div>`).join('')}</dl><p data-scale-note></p>
  <div class="fault-cards">${['airspeed','altimeter','vsi'].map(id=>`<article data-fault-instrument="${id}"><h3>${{airspeed:'ASI',altimeter:'Altimeter',vsi:'VSI'}[id]}</h3><strong></strong><p></p></article>`).join('')}</div>
  <h3>Guided fault propagation</h3><ol data-guided></ol>
  <h3>Fault / symptom matrix</h3><div class="fault-matrix">${symptoms.map(row=>`<article><h4>${row[0]}</h4><dl>${['ASI','Altimeter','VSI','Affected signal','Likely location'].map((label,i)=>`<div><dt>${label}</dt><dd>${row[i+1]}</dd></div>`).join('')}</dl></article>`).join('')}</div>
  <h3>Live experiments</h3><p>Set altitude to 3000 ft, activate Blocked Static, then move altitude to 7000 ft. Compare live Ps with trapped Ps and observe the altimeter and VSI. For Blocked Pitot, activate at 110 kt, then change airspeed and altitude. For the leak, hold flight state fixed and vary severity.</p>
  <h3>Diagnostic reasoning</h3>${questions.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
  <p>An incorrect indication does not necessarily mean the instrument has failed. A common pressure-source fault is more plausible than three simultaneous instrument failures in this exercise.</p>
  <p class="internal-note">Educational leak model: Pt effective = Ps + (1 − severity) × (Pt − Ps). No flow resistance or CFD. The existing VSI normalized lag is advanced once; blocked static supplies zero continuing pressure trend. Reduced motion shows the settled response immediately. Altitude and vertical speed remain independent controls.</p>
  <p class="internal-note">Conceptual teaching geometry, not manufacturer-specific hardware. Static-to-cabin leakage is deferred because no cabin-pressure model exists. No icing, drain-hole variants, alternate static source, mechanical failure, gyro failure or graded diagnosis is modeled.</p>`;
  const type=panel.querySelector('#fault-type'),severity=panel.querySelector('#leak-severity');
  function changed(){onChange();}
  type.addEventListener('change',()=>{fault=clearFault(fault);severity.value=50;changed();});
  severity.addEventListener('input',()=>{fault=setSeverity(fault,Number(severity.value)/100);severity.value=String(100*fault.severity);changed();});
  panel.querySelector('[data-activate]').addEventListener('click',()=>{fault=activateFault(fault,type.value,state);changed();});
  panel.querySelector('[data-clear]').addEventListener('click',()=>{fault=clearFault(fault);type.value='normal';severity.value=50;changed();});
  let lastType,lastUpdate;
  return {
    transform(next){state=next;return transform(next,fault,lag);},
    reset(){fault=initialFault();type.value='normal';severity.value=50;},
    setFocus(enabled,id){focused=enabled;selected=id;},
    update(next,nextLag,reduced){state=next;lag=nextLag;
      if(panel.hidden)return;
      const key=JSON.stringify([next,nextLag,reduced,selected,focused,fault,type.value]);
      if(key===lastUpdate)return;lastUpdate=key;
      const m=transform(state,fault,lag),definition=definitions[m.type];
      panel.dataset.faultType=m.type;panel.dataset.reducedMotion=String(reduced);panel.dataset.event=String(fault.event);
      severity.disabled=type.value!=='pitot-leak';const statusOutput=panel.querySelector('[data-fault-status]'),statusText=fault.active?'FAULT ACTIVE':'NORMAL';if(statusOutput.textContent!==statusText)statusOutput.textContent=statusText;
      panel.querySelector('[data-snapshot]').textContent=fault.snapshot?`FAULT ACTIVATED HERE · event ${fault.snapshot.event} · ${fault.snapshot.airspeed} kt · ${fault.snapshot.altitude} ft · Ps ${(fault.snapshot.ps/1000).toFixed(2)} kPa · Pt ${(fault.snapshot.pt/1000).toFixed(2)} kPa`:'No trapped pressure snapshot active. Select a fault, then Activate Fault; changing selection clears the previous fault.';
      const affected=definition.affected;
      panel.querySelector('[data-propagation]').textContent=m.type==='normal'?'HEALTHY: live Pt and Ps reach their normal branches.':`FAULT: ${definition.title} → ${definition.signal} ${m.type==='pitot-leak'?'DEGRADED':'TRAPPED'} → ${affected.join(' / ')} affected.`;
      const linked=['airspeed','altimeter','vsi'].includes(selected),regions=linked?focusedRegions(selected):[];
      panel.querySelectorAll('[data-component]').forEach(part=>{part.classList.toggle('fault-path',definition.elements.includes(part.dataset.component)||affected.some(id=>part.dataset.component===`${id}-connection`));part.classList.toggle('ps-dimmed',focused&&linked&&!regions.includes(part.dataset.component));});
      panel.querySelector('[data-fault-focus]').textContent=!focused?'Teaching Focus off: all branches visible.':linked?`Teaching Focus: ${selected} paths emphasized; unaffected branches stay visible.`:'The selected gyro instrument does not use pitot-static signals; the pressure family remains visible as context.';
      const e=m.effective,p=m.physical,pressure=v=>`${(v/1000).toFixed(2)} kPa`;
      const values=[p.ps,p.pt,p.q,e.asiPt,e.asiPs,e.altimeterPs,e.vsiPs,e.q].map(pressure).concat([`${Math.round(m.inferredAirspeed)} kt`,`${Math.round(m.state.altitude)} ft`,`${Math.round(2000*(lag?.differential||0))} ft/min`]);
      values.forEach((value,i)=>{const output=panel.querySelector(`[data-fault-value="${i}"]`);if(output.textContent!==value)output.textContent=value;});
      for(const [key,value] of Object.entries(e))panel.dataset[key]=String(value);
      panel.dataset.livePs=String(p.ps);panel.dataset.livePt=String(p.pt);
      panel.querySelector('[data-scale-note]').textContent=m.scaleNote;
      panel.querySelectorAll('[data-fault-instrument]').forEach(card=>{const [badge,reason]=status(m.type,card.dataset.faultInstrument);card.querySelector('strong').textContent=badge;card.querySelector('p').textContent=reason;});
      if(lastType!==m.type){lastType=m.type;panel.querySelector('[data-guided]').innerHTML=guided[m.type].map(text=>`<li>${text}</li>`).join('');}
    }
  };
}
