import {createAttitude} from '../../instruments/attitude.js';
import {attitudeLabels} from '../../aircraft/orientation.js';
import {bindInternalNavigation} from '../navigation.js';
import {gyroAssembly} from '../gyro/svg-assembly.js';
import {mechanismState,advanceSpin} from './model.js';
import {components,steps} from './content.js';

const tabs=[['face','Instrument Face'],['cutaway','Internal Cutaway'],['works','How It Works']];
function projection(id,x,title,caption) {
  return `<g transform="translate(${x} 160)"><text y="-125" class="projection-title">${title}</text>
    <path d="M-105 0H105" class="stable-horizon" data-component="horizon"/>
    ${gyroAssembly()}
    <g data-case="${id}" data-component="case"><rect x="-87" y="-90" width="174" height="180" rx="12" class="instrument-case"/>
    <path d="M-87 -48H-68M68 -48H87M-87 48H-68M68 48H87" class="gyro-bearing"/>
    <g data-component="aircraft"><path d="M-75 18h45l12 8M18 26l12 -8h45" class="case-symbol"/>${id==='pitch'?'<path d="M-90 0H90L77 -8M90 0L77 8" class="case-symbol"/>':''}</g></g>
    <text y="114">${caption}</text><text y="133">Gold axis / horizon: WORLD-STABILIZED</text></g>`;
}
export function createAttitudeInternalView(panel) {
  panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3E</p><h2 id="attitude-internal-title">Attitude Indicator</h2></div><span>IDEAL VERTICAL GYRO</span></div>
    <p class="internal-intro">Use the existing Pitch and Bank controls. The aircraft case moves around a stabilized reference; the display shows their relative orientation. Heading is not indicated.</p>
    <div class="internal-tabs" role="tablist" aria-label="Attitude Indicator learning views">${tabs.map(([id,label],i)=>`<button type="button" role="tab" id="attitude-tab-${id}" aria-controls="attitude-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>
    <div id="attitude-panel-face" role="tabpanel" aria-labelledby="attitude-tab-face"><div class="internal-face"></div><p class="face-reading" data-reading="face"></p></div>
    <div id="attitude-panel-cutaway" role="tabpanel" aria-labelledby="attitude-tab-cutaway" hidden></div>
    <div id="attitude-panel-works" role="tabpanel" aria-labelledby="attitude-tab-works" hidden><ol class="internal-steps">${steps.map(([id,text],i)=>`<li><button type="button" data-step="${i}" data-step-component="${id}" aria-pressed="false"><strong>Step ${i+1}</strong> ${text}</button></li>`).join('')}</ol></div>
    <div class="internal-mechanism" hidden><div class="mechanism-layout"><div>
      <p class="pressure-key"><span>Dashed case &amp; aircraft symbol · AIRCRAFT-FIXED</span><span>Solid gyro axis &amp; horizon · WORLD-STABILIZED</span></p>
      <div class="diagram-scroll" tabindex="0" role="region" aria-label="Attitude cutaway projections; scroll horizontally on narrow screens">
      <svg class="internal-diagram attitude-diagram" viewBox="0 0 640 340" role="img" aria-labelledby="attitude-diagram-title attitude-diagram-desc"><title id="attitude-diagram-title">Aircraft case moving around a vertical gyro</title><desc id="attitude-diagram-desc">Separate side pitch and front bank projections show a dashed moving case around a fixed rotor axis and horizon. Combined attitudes use both projections; these are conceptual views, not a literal mechanism. The instrument display below shows the combined relative orientation.</desc>
      ${projection('pitch',160,'SIDE · PITCH','Nose points right; nose-up rotates case upward')}
      ${projection('bank',480,'FRONT · BANK','Aircraft right wing is on diagram right')}
      <text x="320" y="326">Separate pitch / bank projections · bearing positions and rotor disk are schematic</text></svg></div>
      <p class="attitude-spin-note"></p>
      <div class="attitude-display-path" data-component="horizon">Stabilized gyro → conceptual gimbal pickoff / display linkage → relative horizon indication</div>
      <div class="attitude-cutaway-display"><div class="internal-face cutaway-face"></div><p>CASE-FIXED viewer: the aircraft symbol stays level on the dial; the horizon and pitch ladder move.</p></div>
      <div class="component-legend" aria-label="Attitude Indicator components">${components.map(([id,title],i)=>`<button type="button" data-select-component="${id}" aria-pressed="false"><span>${i+1}</span> ${title}</button>`).join('')}</div><p class="component-explanation" role="status">Select a component or teaching step.</p>
    </div><div class="measurement-chain"><h3>Attitude chain</h3><ol>
      <li><span>Input · existing controls</span><output data-reading="input"></output></li>
      <li><span>Reference</span><span>Gyro axis = stabilized world up</span></li>
      <li><span>Relative motion</span><output data-reading="relative"></output></li>
      <li><span>Display · pitch and bank</span><output data-reading="display"></output></li></ol>
      <p class="internal-note">Physical concept: rigidity in space provides a stabilized reference.</p>
      <p class="internal-note">Educational model: an ideal vertical gyro, with no drift or erection dynamics. A north-pointing spin axis alone does not stabilize roll; this attitude lesson uses world up.</p>
      <p class="internal-note">Visualization: separate pitch/bank projections and a conceptual display linkage. The rotor disk is shown face-on for visibility; the gold shaft denotes the vertical axis. Gimbal shapes are schematic, not certified bearing geometry.</p>
    </div></div></div>
    <p class="internal-note">Gyro stabilization and internal geometry are simplified for teaching; real instruments include additional erection, damping, and drive systems.</p>`;
  const faceUpdate=createAttitude(panel.querySelector('.internal-face'));
  const displayUpdate=createAttitude(panel.querySelector('.cutaway-face'));
  const navigation=bindInternalNavigation(panel,{prefix:'attitude',instrument:'attitude',components});
  let phase=0;
  return {...navigation,update(state,_lag,reduced=false,dt=0) {
    const m=mechanismState(state),labels=attitudeLabels({...m,heading:0});
    faceUpdate(m);displayUpdate(m);
    panel.querySelector('[data-case="pitch"]').setAttribute('transform',`rotate(${m.casePitch})`);
    panel.querySelector('[data-case="bank"]').setAttribute('transform',`rotate(${m.caseBank})`);
    panel.querySelectorAll('.attitude-diagram [data-component="outer"]').forEach((outer,i)=>outer.setAttribute('transform',`rotate(${i===0?m.casePitch:m.caseBank})`));
    // Only the visible lesson animates; orientation always stays synchronized.
    if(!panel.hidden)phase=advanceSpin(phase,dt,reduced);
    if(reduced)phase=0;
    panel.querySelectorAll('[data-rotor-spokes]').forEach(spokes=>spokes.setAttribute('transform',`rotate(${phase*180/Math.PI})`));
    panel.dataset.spinPhase=String(phase);
    panel.dataset.reference=JSON.stringify(m.reference.worldUp);
    panel.dataset.bodyReference=JSON.stringify(m.reference.bodyUp);
    panel.querySelector('.attitude-spin-note').textContent=reduced?'↻ Spin direction shown statically for reduced motion. Case and horizon still follow Pitch and Bank.':'Slow rotor spin illustrates direction, not physical RPM. Only rotor spokes spin; the axis remains stabilized.';
    const reading=`Pitch ${labels.pitch} · Bank ${labels.bank}`;
    for(const key of ['face','input','display'])panel.querySelector(`[data-reading="${key}"]`).textContent=reading;
    panel.querySelector('[data-reading="relative"]').textContent=`Case: ${labels.pitch} pitch · ${labels.bank} bank. Horizon ${m.pitch>0?'below':m.pitch<0?'above':'level with'} aircraft symbol; ${Math.abs(m.bank)}° ${m.bank>0?'counterclockwise':m.bank<0?'clockwise':'roll'}.`;
  }};
}
