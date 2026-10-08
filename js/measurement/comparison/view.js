import {families,instruments,selection,liveState,liveValues} from './model.js';
import {familyContent,layers,presets,terminology,questions,teachingNote} from './content.js';
function measured(m,side='overview') {
  return `<article class="cmp-measured-card" data-measured="${side}" data-measured-id="${m.id}"><h4>${m.title}</h4><dl><div><dt>Displayed / desired quantity</dt><dd>${m.targetQuantity}</dd></div><div><dt>${m.family==='gyroscopic'&&m.measurementType==='reference-based'?'Sensing concept':'Directly sensed physical quantity'+(m.id==='turn'?' · real instrument':'')}</dt><dd data-direct-quantity>${m.directlySensedQuantity}</dd></div></dl>${m.teachingInput?`<p class="gc-proxy-note">CURRENT APP CONTROL: ${m.teachingInput}. Bank angle is not the actual measurand; no real angular rate is calculated.</p>`:''}<p>${m.inference}</p></article>`;
}
export function createComparisonView(panel) {
  panel.innerHTML=`<div class="section-heading"><h2 id="comparison-title">Measurement Chain Comparison</h2><button type="button" data-close-comparison>Close comparison</button></div><p>Compare what each instrument senses, how information reaches its mechanism and how the displayed quantity is produced.</p>
    <div class="cmp-system"><section aria-labelledby="comparison-measured-title"><h3 id="comparison-measured-title">What Is Actually Measured?</h3><p>The desired flight quantity and the directly sensed physical input can differ. A reference-based indication also requires a specific reference.</p><div class="cmp-measured cmp-columns" data-measured-pair></div><details><summary>View all six instruments</summary><div class="cmp-overview">${Object.values(instruments).map(m=>measured(m)).join('')}</div></details></section>
    <section aria-label="Family measurement systems"><div class="cmp-columns">${Object.entries(familyContent).map(([id,family])=>`<article class="cmp-family" data-family="${id}"><h3>${family.title}</h3><ol>${family.chain.map(stage=>`<li>${stage}</li>`).join('')}</ol><p>${family.note}</p></article>`).join('')}</div></section>
    <section aria-labelledby="comparison-presets-title"><h3 id="comparison-presets-title">Guided comparisons</h3><div class="cmp-presets" role="group" aria-label="Comparison presets">${presets.map((p,i)=>`<button type="button" data-preset="${i}" aria-pressed="${i===0}">${p.title}</button>`).join('')}</div><p data-preset-explanation role="status"></p></section>
    <p class="ps-focus-note" data-comparison-focus></p>
    <div class="cmp-columns cmp-workspace">${[['left','pitot-static'],['right','gyroscopic']].map(([side,family])=>`<article class="cmp-instrument" data-comparison-side="${side}" data-family="${family}"><h3>${familyContent[family].title}</h3><label for="comparison-${side}">Select ${family==='pitot-static'?'pitot-static':'gyroscopic'} instrument</label><select id="comparison-${side}">${families[family].map(id=>`<option value="${id}">${instruments[id].title}</option>`).join('')}</select><div data-comparison-detail></div></article>`).join('')}</div>
    <section aria-labelledby="comparison-terms-title"><h3 id="comparison-terms-title">Measurement system terminology</h3><dl class="cmp-terms">${terminology.map(([term,definition])=>`<div><dt>${term}</dt><dd>${definition}</dd></div>`).join('')}</dl></section>
    <section aria-labelledby="comparison-think-title"><h3 id="comparison-think-title">Think About It</h3><p>Discuss each prompt, then open its explanation. These are ungraded teaching questions.</p>${questions.map(([question,answer])=>`<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}</section><p class="internal-note">${teachingNote}</p></div>`;
  const system=panel.querySelector('.cmp-system'),button=document.querySelector('#measurement-comparison');
  let left='airspeed',right='attitude',focused=true,latest,headingAngle;
  function focus() {
    system.dataset.focus=String(focused);
    system.querySelectorAll('.cmp-chain').forEach(chain=>chain.classList.toggle('cmp-focused',focused));
    system.querySelector('[data-comparison-focus]').textContent=focused?'Teaching Focus: both selected instrument chains emphasized. Each family retains its own sensing principle.':'Teaching Focus off: both selected chains remain available without emphasis.';
  }
  function updateValues() {
    if(!latest)return;
    const m=liveState(latest[0],latest[1],headingAngle);headingAngle=m.gyro.heading.caseAngle;
    system.dataset.reducedMotion=String(latest[2]);
    for(const [side,id] of [['left',left],['right',right]]) {
      for(const [key,_label,value] of liveValues(id,m)) {
        const output=system.querySelector(`[data-comparison-side="${side}"] [data-comparison-value="${key}"]`);
        if(output.textContent!==value)output.textContent=value;
      }
    }
  }
  function render() {
    const selected=selection(left,right);
    system.querySelector('[data-measured-pair]').innerHTML=measured(selected.left,'left')+measured(selected.right,'right');
    for(const [side,m] of [['left',selected.left],['right',selected.right]]) {
      const card=system.querySelector(`[data-comparison-side="${side}"]`);
      Object.assign(card.dataset,{selectedInstrument:m.id,measurementType:m.measurementType,inferred:String(m.isInferred),reference:m.referenceType||'none',pressureInputs:m.pressureInputs.join(',')});
      card.querySelector('[data-comparison-detail]').innerHTML=`<h4>${m.title}</h4><div class="cmp-badges">${m.badges.map(label=>`<span>${label}</span>`).join('')}</div><dl class="cmp-layers">${layers.map(([key,label])=>`<div data-layer="${key}"><dt>${label}</dt><dd>${m[key]}</dd></div>`).join('')}</dl><h4>Compact measurement chain</h4><ol class="cmp-chain" aria-label="${m.title} chain">${m.chain.map(stage=>`<li data-chain-element="${stage.element}">${stage.label}</li>`).join('')}</ol><div class="ps-live"><h4>Live values</h4><dl>${liveValues(m.id,liveState({airspeed:0,altitude:0,verticalSpeed:0,pitch:0,bank:0,heading:0},{differential:0})).map(([key,label])=>`<div><dt>${label}</dt><dd><output aria-label="${label}" data-comparison-value="${key}"></output></dd></div>`).join('')}</dl></div>`;
    }
    const preset=presets.find(p=>p.left===left&&p.right===right);
    system.querySelector('[data-preset-explanation]').textContent=preset?.explanation||'Custom comparison: trace each physical input through its own mechanism. Similar displayed information does not imply equivalent sensing physics.';
    system.querySelectorAll('[data-preset]').forEach(control=>control.setAttribute('aria-pressed',String(presets[control.dataset.preset]===preset)));
    focus();updateValues();
  }
  system.querySelectorAll('select').forEach(control=>control.addEventListener('change',()=>{left=system.querySelector('#comparison-left').value;right=system.querySelector('#comparison-right').value;render();}));
  system.querySelectorAll('[data-preset]').forEach(control=>control.addEventListener('click',()=>{const p=presets[control.dataset.preset];left=p.left;right=p.right;system.querySelector('#comparison-left').value=left;system.querySelector('#comparison-right').value=right;render();}));
  panel.querySelector('[data-close-comparison]').addEventListener('click',()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus();});
  render();
  return {
    // Dedicated workspace retains its pair when cockpit selection changes.
    select() {},
    open(){panel.hidden=false;button.setAttribute('aria-expanded','true');panel.scrollIntoView({behavior:'auto',block:'start'});panel.querySelector('#comparison-left').focus({preventScroll:true});},
    setExtensionFocus(enabled){focused=enabled;focus();},
    update(state,lag,reduced=false){latest=[state,lag,reduced];updateValues();}
  };
}
