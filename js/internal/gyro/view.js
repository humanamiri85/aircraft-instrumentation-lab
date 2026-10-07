import {gyroInstruments,modes,components,steps,conceptNote} from './content.js';
import {attitudeLabels} from '../../aircraft/orientation.js';

// One reusable panel; instrument-specific cutaways remain future work.
export function createGyroView(panel) {
  panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">SHARED FOUNDATION · PHASE 3D</p><h2 id="gyro-title">Gyroscope Fundamentals</h2></div></div>
    <p class="internal-intro">Use the existing Pitch, Bank and Heading controls. This shared lesson is not an Attitude Indicator, Heading Indicator or Turn Coordinator cutaway.</p>
    <div class="internal-tabs" role="tablist" aria-label="Gyroscope learning views">${modes.map(([id,title],i)=>`<button type="button" role="tab" id="gyro-tab-${id}" aria-controls="gyro-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${title}</button>`).join('')}</div>
    ${modes.map(([id])=>`<div id="gyro-panel-${id}" role="tabpanel" aria-labelledby="gyro-tab-${id}" ${id==='assembly'?'':'hidden'}></div>`).join('')}
    <div class="gyro-lesson"><p class="gyro-mode-description"></p><div class="gyro-viewport"><span class="gyro-spin-direction" hidden>↻ Rotor spin direction · viewed from +Z</span><p class="gyro-status" role="status">Open the lesson to load the optional 3D assembly.</p></div>
    <p class="gyro-reading"></p><p class="gyro-relative"></p><p class="gyro-motion"></p>
    <dl class="gyro-axis-key"><div><dt>Aircraft longitudinal</dt><dd>Nose · local −Z; bank rotates about this axis.</dd></div><div><dt>Aircraft lateral</dt><dd>Right wing · local +X; positive pitch raises the nose.</dd></div><div><dt>Aircraft vertical</dt><dd>Up · local +Y; heading increases clockwise from north.</dd></div><div><dt>Gyro spin</dt><dd>Gold shaft · fixed world −Z / north, distinct from the moving aircraft nose.</dd></div><div><dt>Outer gimbal axis</dt><dd>Blue bearing · body +Y.</dd></div><div><dt>Inner gimbal axis</dt><dd>White bearing · outer-ring local +X.</dd></div></dl>
    <div class="component-legend">${components.map(([id,title],i)=>`<button type="button" data-gyro-component="${id}" aria-pressed="false"><span>${i+1}</span>${title}</button>`).join('')}</div><p class="component-explanation" role="status">Select a component or a teaching step.</p>
    <h3>How it works</h3><ol class="internal-steps">${steps.map(([id,text],i)=>`<li><button type="button" data-gyro-step="${i}" data-component-id="${id}" aria-pressed="false"><strong>Step ${i+1}</strong>${text}</button></li>`).join('')}</ol>
    <p class="internal-note">${conceptNote}</p><p class="internal-note">Ideal, unlimited gimbal travel is shown. The two bearings keep the spin axis pointed north; rotation about that axis is not a stabilized attitude reference. This common lesson illustrates rigidity, not the different axis arrangements or rate sensing of specific instruments. A turn coordinator will later require torque and precession concepts. Wheel speed is slowed for visibility; no physical RPM, indication, drift or dynamics is calculated.</p></div>`;
  let mode='assembly',component='',phase=0,scene,modelModule,loading,closed=false;
  let latest={pitch:0,bank:0,heading:0},reduced=false;
  const lesson=panel.querySelector('.gyro-lesson'),status=panel.querySelector('.gyro-status');
  const descriptions={assembly:'Assembly: gold rotor and shaft, white inner ring, blue outer ring, and dashed aircraft-mounted instrument frame.',axes:'Axis View: labeled aircraft axes move with the body. Blue and white arrows show the two gimbal bearing axes; the gold spin axis stays north.',rigidity:'Rigidity Demo: change Pitch, Bank or Heading and compare the moving dashed aircraft frame with the stable gold north-pointing shaft. Relative bearing angles provide a foundation for future indication mechanisms.'};
  const tabs=[...panel.querySelectorAll('[role=tab]')];
  function setMode(id,focus=false) {
    mode=id;tabs.forEach(tab=>{const active=tab.id===`gyro-tab-${id}`;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
    panel.querySelectorAll('[role=tabpanel]').forEach(body=>body.hidden=body.id!==`gyro-panel-${id}`);
    panel.querySelector(`#gyro-panel-${id}`).append(lesson);
    panel.querySelector('.gyro-mode-description').textContent=descriptions[id];
    update(latest,0,reduced);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>setMode(modes[index][0]));
    tab.addEventListener('keydown',event=>{const next={ArrowRight:(index+1)%3,ArrowLeft:(index+2)%3,Home:0,End:2}[event.key];if(next!==undefined){event.preventDefault();setMode(modes[next][0],true);}});
  });
  function highlight(id,step) {
    component=id;panel.querySelector('.component-explanation').textContent=components.find(c=>c[0]===id)[2];
    panel.querySelectorAll('[data-gyro-component]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.gyroComponent===id)));
    panel.querySelectorAll('[data-gyro-step]').forEach(button=>button.setAttribute('aria-pressed',String(button===step)));
    update(latest,0,reduced);
  }
  panel.querySelectorAll('[data-gyro-component]').forEach(button=>button.addEventListener('click',()=>highlight(button.dataset.gyroComponent)));
  panel.querySelectorAll('[data-gyro-step]').forEach(button=>button.addEventListener('click',()=>highlight(button.dataset.componentId,button)));
  function fail(error) {
    console.error('Optional gyroscope visualization failed:',error);scene?.dispose();scene=undefined;
    status.hidden=false;status.textContent='3D gyroscope unavailable. The labeled axes, shared controls and teaching steps remain usable.';
  }
  function load() {
    if(loading)return;
    loading=Promise.all([import('./model.js'),import('./scene.js')]).then(([model,{createGyroScene}])=>{
      if(closed)return;modelModule=model;scene=createGyroScene(panel.querySelector('.gyro-viewport'));status.hidden=true;update(latest,0,reduced);
    }).catch(fail);
  }
  function update(state,dt=0,motion=false) {
    latest={pitch:state.pitch,bank:state.bank,heading:state.heading};reduced=motion;
    if(panel.hidden)return;
    const labels=attitudeLabels(latest);
    panel.querySelector('.gyro-reading').textContent=`Aircraft frame · Pitch ${labels.pitch} · Bank ${labels.bank} · Heading ${labels.heading}. Gyro spin reference · fixed world north.`;
    panel.querySelector('.gyro-spin-direction').hidden=!reduced;
    panel.querySelector('.gyro-motion').textContent=reduced?'Reduced motion: stationary rotor with a spin-direction indicator. All body and bearing positions still follow the controls.':'Slow rotor motion illustrates spin direction, not physical rotor speed.';
    if(modelModule) {
      const model=modelModule.gyroState(latest);
      phase=modelModule.advanceSpin(phase,dt,reduced);
      panel.querySelector('.gyro-relative').textContent=`Relative bearing angles · outer ${(model.outer*180/Math.PI).toFixed(1)}° · inner ${(model.inner*180/Math.PI).toFixed(1)}°. Future mechanisms can use relative motion to derive an indication.`;
      try {scene?.update(model,phase,mode,component,reduced);}catch(error){fail(error);}
    }
  }
  setMode(mode);
  return {update,select(){panel.hidden=true;panel.classList.remove('focus-linked');},setFocus(enabled){panel.classList.toggle('focus-linked',enabled);},open(){panel.hidden=false;setMode('assembly');load();panel.scrollIntoView({behavior:'auto',block:'start'});tabs[0].focus({preventScroll:true});},dispose(){closed=true;scene?.dispose();}};
}
export {gyroInstruments};
