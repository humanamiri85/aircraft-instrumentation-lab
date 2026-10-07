import {createTurn} from '../../instruments/turn.js';
import {bindInternalNavigation} from '../navigation.js';
import {mechanismState,advanceSpin} from './model.js';
import {components,steps} from './content.js';

const proxyNote='In this teaching model, Bank is used as a proxy input to drive a conceptual turn-rate response. A real Turn Coordinator responds to aircraft angular rate, not bank angle directly.';
export function createTurnInternalView(panel) {
  panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3G</p><h2 id="turn-internal-title">Turn Coordinator</h2></div><span>RESTRAINED RATE GYRO</span></div>
    <p class="internal-intro">${proxyNote}</p>
    <div class="internal-tabs" role="tablist" aria-label="Turn Coordinator learning views">${[['face','Instrument Face'],['cutaway','Internal Cutaway'],['works','How It Works']].map(([id,label],i)=>`<button type="button" role="tab" id="turn-tab-${id}" aria-controls="turn-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>
    <div id="turn-panel-face" role="tabpanel" aria-labelledby="turn-tab-face"><div class="internal-face"></div><p class="face-reading" data-reading="face"></p><p>±30° Bank aligns with the standard-rate reference marks only in this simplified teaching mapping. Bank alone does not determine a real standard-rate turn.</p></div>
    <div id="turn-panel-cutaway" role="tabpanel" aria-labelledby="turn-tab-cutaway" hidden></div>
    <div id="turn-panel-works" role="tabpanel" aria-labelledby="turn-tab-works" hidden><ol class="internal-steps">${steps.map(([id,text],i)=>`<li><button type="button" data-step="${i}" data-step-component="${id}" aria-pressed="false"><strong>Step ${i+1}</strong> ${text}</button></li>`).join('')}</ol></div>
    <div class="internal-mechanism" hidden><div class="mechanism-layout"><div>
      <p class="pressure-key"><span>Dashed outline · AIRCRAFT-FIXED</span><span>Solid rotor / gimbal · RATE-GYRO MOVING PARTS</span><span>Zigzag spring · RESTORING ELEMENT</span></p>
      <div class="diagram-scroll" tabindex="0" role="region" aria-label="Turn cutaway; scroll horizontally on narrow screens">
      <svg class="internal-diagram attitude-diagram turn-diagram" viewBox="0 0 500 360" role="img" aria-labelledby="turn-diagram-title turn-diagram-desc"><title id="turn-diagram-title">Restrained rate gyro and restoring spring</title><desc id="turn-diagram-desc">Aircraft rotational-rate input acts about a different axis from permitted gimbal deflection. A moving rotor and single restrained gimbal load a spring anchored to the fixed case. A separate inclinometer has no connection to the gyro linkage. Axis arrows are schematic projections, not a calibrated bearing arrangement.</desc>
      <g data-component="case"><rect x="30" y="45" width="440" height="215" rx="12" class="instrument-case"/><text x="250" y="66">AIRCRAFT-FIXED CASE / SPRING ANCHOR</text></g>
      <g class="turn-input"><path d="M65 108Q85 75 115 108M106 100L115 108L103 109"/><text x="105" y="78">Rotational-rate INPUT</text><text x="105" y="132">Yaw + roll sensitivity</text><text x="105" y="147">Bank proxy here</text></g>
      <path d="M250 90V235" class="turn-neutral"/><text x="250" y="249">Dashed center = neutral</text>
      <g transform="translate(250 162)"><g data-gimbal>
        <g data-component="gimbal"><ellipse rx="65" ry="47" class="gyro-inner"/><path d="M-80 0h15M65 0h15" class="gyro-bearing"/></g>
        <g data-component="rotor"><circle r="27" class="gyro-wheel"/><g data-rotor-spokes><path d="M0 0L23 0M0 0L-12 20M0 0L-12 -20"/></g></g>
        <g data-component="spin"><path d="M0 -65V65M-5 -55L0 -65L5 -55" class="gyro-shaft"/></g>
      </g></g>
      <g data-component="spring"><path data-spring class="turn-spring"/><circle cx="435" cy="162" r="5" class="gyro-wheel"/><text x="388" y="196">RESTORING SPRING</text><text x="388" y="212" data-spring-label></text></g>
      <g data-component="linkage"><path data-linkage class="gyro-bearing"/><text x="130" y="227">OUTPUT PICKOFF ↓</text></g>
      <circle cx="250" cy="162" r="5" class="turn-deflection-axis"/><circle cx="250" cy="162" r="1" fill="#f0f1e7"/><text x="250" y="285" data-response-label></text><text x="250" y="305">⊙ Permitted DEFLECTION axis · out of diagram</text><text x="250" y="326">Precession responds about a different axis from the input</text>
      </svg></div>
      <p class="turn-spin-note"></p>
      <p class="attitude-display-path" data-component="shaft">Restrained gimbal → output linkage → airplane-symbol shaft ↓</p>
      <div class="attitude-cutaway-display"><h3>CASE-FIXED DISPLAY · Shared cockpit mapping</h3><div class="internal-face cutaway-face"></div><p data-component="marks">Left/right 2 MIN marks are preserved. Real standard rate is an angular rate, not a Bank angle.</p></div>
      <div class="turn-inclinometer"><h3>BALL / INCLINOMETER · SEPARATE SUBSYSTEM</h3><svg viewBox="0 0 300 85" role="img" aria-label="Separate curved inclinometer tube with centered ball"><g data-component="tube"><path d="M40 20Q150 60 260 20v25Q150 85 40 45Z" fill="#c8d0cd" stroke="#f0f1e7"/></g><g data-component="ball"><circle cx="150" cy="48" r="10" fill="#101416"/><path d="M134 35v28m32 -28v28" stroke="#343b3d"/></g></svg><p>Gravity and lateral acceleration determine ball displacement. Centered = coordinated condition; displaced = slip/skid indication. The ball is not driven by the gyro.</p><p>In this phase the ball is shown as a separate conceptual subsystem and is not dynamically driven by a lateral-acceleration model.</p></div>
      <div class="component-legend" aria-label="Turn Coordinator components">${components.map(([id,title],i)=>`<button type="button" data-select-component="${id}" aria-pressed="false"><span>${i+1}</span> ${title}</button>`).join('')}</div><p class="component-explanation" role="status">Select a component or teaching step.</p>
    </div><div class="measurement-chain"><h3>Conceptual rate chain</h3><ol>${[['input','Input · Bank proxy'],['interpretation','Teaching interpretation'],['response','Gyro response'],['spring','Restoring element'],['output','Output'],['ball','Inclinometer']].map(([id,label])=>`<li><span>${label}</span><output data-reading="${id}"></output></li>`).join('')}</ol>
      <p class="internal-note">Physical concept: angular-rate sensing using a restrained gyro, not an orientation reference or a free gyro.</p>
      <p class="internal-note">Educational model: bounded, quasi-static equilibrium deflection and spring load in visual units; no calibrated spring forces or response times.</p>
      <p class="internal-note">Visualization: schematic rotor, single gimbal, spring and linkage. Conventional Turn Coordinators use a canted rate gyro with roll and yaw sensitivity; these axis projections are conceptual.</p>
      <p class="internal-note">Precession is shown conceptually. Detailed torque and angular-momentum dynamics are beyond this phase.</p>
    </div></div></div>
    <p class="internal-note">Real Turn Coordinators respond to angular rate. Bank angle is used here only as an educational proxy until a turn-rate flight model is introduced.</p>`;
  const faceUpdate=createTurn(panel.querySelector('.internal-face'));
  const displayUpdate=createTurn(panel.querySelector('.cutaway-face'));
  panel.querySelector('.cutaway-face [data-part="plane"]').dataset.component='shaft';
  panel.querySelector('.cutaway-face [data-part="references"]').dataset.component='marks';
  const navigation=bindInternalNavigation(panel,{prefix:'turn',instrument:'turn',components});
  let phase=0;
  return {...navigation,update(state,_lag,reduced=false,dt=0) {
    const m=mechanismState(state);faceUpdate(m);displayUpdate(m);
    panel.querySelector('[data-gimbal]').setAttribute('transform',`rotate(${m.gimbalAngle})`);
    // Spring end follows an actual attachment on the rotating gimbal.
    const radians=m.gimbalAngle*Math.PI/180,x=250+65*Math.cos(radians),y=162+65*Math.sin(radians);
    const points=Array.from({length:9},(_,i)=>`${x+(435-x)*i/8},${y+(162-y)*i/8+(i===0||i===8?0:i%2?8:-8)}`);
    panel.querySelector('[data-spring]').setAttribute('d',`M${points.join('L')}`);
    panel.querySelector('[data-linkage]').setAttribute('d',`M${250-65*Math.cos(radians)} ${162-65*Math.sin(radians)}L130 210V240`);
    panel.querySelector('[data-spring-label]').textContent=m.rateProxy===0?'Centered / unloaded':`Loaded · ${(m.springLoad*100).toFixed(0)}% visual load`;
    panel.querySelector('[data-response-label]').textContent=`${m.direction} precession response · ${m.gimbalAngle.toFixed(1)}° visual deflection`;
    if(!panel.hidden)phase=advanceSpin(phase,dt,reduced);
    if(reduced)phase=0;
    panel.querySelector('[data-rotor-spokes]').setAttribute('transform',`rotate(${phase*180/Math.PI})`);
    Object.assign(panel.dataset,{spinPhase:String(phase),rateProxy:String(m.rateProxy),gimbalAngle:String(m.gimbalAngle),springLoad:String(m.springLoad),ballOffset:String(m.ballOffset)});
    panel.querySelector('.turn-spin-note').textContent=reduced?'↻ Static spin-direction cue for reduced motion; gimbal, spring and symbol still follow the proxy.':'Slow rotor spokes illustrate spin, not physical RPM. The gimbal is restrained, not world-stabilized.';
    const readings={face:`${m.direction} turn indication · Bank proxy ${m.bank}°`,input:`Bank proxy = ${m.bank>0?'+':''}${m.bank}° · ${m.direction}`,interpretation:m.rateProxy===0?'Zero conceptual rate input':`Conceptual ${m.direction.toLowerCase()}-turn rate input · normalized ${m.rateProxy.toFixed(2)}`,response:`${m.direction} precession / restrained gimbal ${m.gimbalAngle.toFixed(1)}° (visual units)`,spring:m.rateProxy===0?'Spring restores centered equilibrium':'Spring resists deflection; visual load increases with magnitude',output:`${m.direction} turn indication · shared symbol angle ${m.symbolAngle.toFixed(1)}°`,ball:'Separate coordination subsystem · centered, not simulated'};
    for(const [id,text] of Object.entries(readings))panel.querySelector(`[data-reading="${id}"]`).textContent=text;
  }};
}
