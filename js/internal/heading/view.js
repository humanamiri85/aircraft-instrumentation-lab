import {createHeading} from '../../instruments/heading.js';
import {bindInternalNavigation,lessonTabs,lessonSteps,lessonComponents} from '../navigation.js';
import {gyroAssembly} from '../gyro/svg-assembly.js';
import {mechanismState,advanceSpin} from './model.js';
import {components,steps} from './content.js';

export function createHeadingInternalView(panel) {
  panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3F</p><h2 id="heading-internal-title">Heading Indicator</h2></div><span>IDEAL DIRECTIONAL GYRO</span></div>
    <p class="internal-intro">Use the existing Heading control. The aircraft case turns around a stable azimuth reference; the card counter-rotates beneath the case-fixed lubber line. Pitch and Bank do not change this indication.</p>
    ${lessonTabs('heading','Heading Indicator')}
    <div id="heading-panel-face" role="tabpanel" aria-labelledby="heading-tab-face"><div class="internal-face"></div><p class="face-reading" data-reading="face"></p></div>
    <div id="heading-panel-cutaway" role="tabpanel" aria-labelledby="heading-tab-cutaway" hidden></div>
    <div id="heading-panel-works" role="tabpanel" aria-labelledby="heading-tab-works" hidden>${lessonSteps(steps)}</div>
    <div class="internal-mechanism" hidden><div class="mechanism-layout"><div>
      <p class="pressure-key"><span>Dashed case / nose · AIRCRAFT-FIXED</span><span>Solid gold axis / north · WORLD-STABILIZED</span></p>
      <div class="diagram-scroll" tabindex="0" role="region" aria-label="Heading cutaway; scroll horizontally on narrow screens">
      <svg class="internal-diagram attitude-diagram heading-diagram" viewBox="0 0 500 330" role="img" aria-labelledby="heading-diagram-title heading-diagram-desc"><title id="heading-diagram-title">Aircraft case turns around a directional gyro</title><desc id="heading-diagram-desc">World-view yaw projection: dashed case and nose rotate clockwise with heading while the solid gold horizontal spin axis remains pointed north. Bearings, rotor disk and gear are schematic projections; the rotor disk is drawn face-on to make its slow spin visible.</desc>
      <g transform="translate(250 165)"><text y="-145" class="projection-title">WORLD VIEW · YAW ONLY</text>
      <g data-component="reference"><path d="M0 -120V105M-7 -108L0 -120L7 -108" class="gyro-shaft"/><text x="20" y="-108">N</text></g>
      ${gyroAssembly()}
      <g data-component="case" data-case="heading"><rect x="-95" y="-100" width="190" height="200" rx="12" class="instrument-case"/><path d="M0 -100V-128M-8 -115L0 -128L8 -115" class="case-symbol"/><text y="90">CASE / AIRCRAFT NOSE ↑</text></g>
      <g data-component="drive"><circle cx="112" cy="40" r="16" class="gyro-inner"/><path d="M95 40H68M128 40H155V105" class="gyro-bearing"/><path data-drive-gear d="M100 40h24M112 28v24" class="gyro-shaft"/></g>
      <text y="145">Horizontal axis; rotor disk and bearings shown schematically</text></g></svg></div>
      <p class="heading-spin-note"></p>
      <div class="attitude-display-path" data-component="drive">Case-to-gyro relative yaw → conceptual pickoff / card-drive gear → counter-rotating compass card ↓</div>
      <div class="attitude-cutaway-display"><h3>CASE-FIXED VIEW · Compass card and lubber line</h3><div class="internal-face cutaway-face"></div><p>Aircraft turns clockwise → card counter-rotates. The gold lubber line stays at the top of the case.</p></div>
      ${lessonComponents(components,'Heading Indicator')}
    </div><div class="measurement-chain"><h3>Live indication chain</h3><ol>
      <li><span>Input · existing control</span><output data-reading="input"></output></li>
      <li><span>Reference</span><span>Directional gyro = stabilized azimuth</span></li>
      <li><span>Relative motion</span><output data-reading="relative"></output></li>
      <li><span>Display</span><output data-reading="display"></output></li></ol>
      <p class="internal-note">Physical concept: directional rigidity of a spinning gyro.</p>
      <p class="internal-note">Educational model: ideal stabilized azimuth, initially aligned to north. This yaw-only projection omits pitch/bank bearing motion; neither changes heading indication.</p>
      <p class="internal-note">Visualization: simplified gimbals, pickoff, gear and card. The face-on rotor disk illustrates spin, not its literal top-view geometry or physical RPM.</p>
    </div></div></div>
    <p class="internal-note">Gyro and card-drive geometry are simplified for teaching. Real heading indicators require periodic realignment because of drift and Earth-rate effects.</p>`;
  const faceUpdate=createHeading(panel.querySelector('.internal-face'));
  const displayUpdate=createHeading(panel.querySelector('.cutaway-face'));
  // Annotate existing renderer parts without recreating its compass scale or lubber line.
  const card=panel.querySelector('.cutaway-face [data-part="card"]');card.dataset.component='card';
  card.nextElementSibling.dataset.component='lubber';
  card.nextElementSibling.nextElementSibling.dataset.component='lubber';
  const navigation=bindInternalNavigation(panel,{prefix:'heading',instrument:'heading',components});
  let phase=0,angle;
  return {...navigation,update(state,_lag,reduced=false,dt=0) {
    const m=mechanismState(state,angle);angle=m.caseAngle;
    faceUpdate(m);displayUpdate(m);
    panel.querySelector('[data-case="heading"]').setAttribute('transform',`rotate(${angle})`);
    panel.querySelector('[data-drive-gear]').setAttribute('transform',`rotate(${m.continuousCardAngle} 112 40)`);
    if(!panel.hidden)phase=advanceSpin(phase,dt,reduced);
    if(reduced)phase=0;
    panel.querySelector('[data-rotor-spokes]').setAttribute('transform',`rotate(${phase*180/Math.PI})`);
    panel.dataset.spinPhase=String(phase);panel.dataset.caseAngle=String(angle);
    panel.dataset.cardAngle=String(m.continuousCardAngle);
    panel.dataset.reference=JSON.stringify(m.reference.worldSpin);
    panel.querySelector('.heading-spin-note').textContent=reduced?'↻ Static spin-direction cue for reduced motion. Case and card still follow Heading.':'Slow rotor spokes illustrate spin direction; the directional axis stays stabilized.';
    panel.querySelector('[data-reading="face"]').textContent=`Heading ${m.reading}`;
    panel.querySelector('[data-reading="input"]').textContent=`Heading = ${m.reading}`;
    panel.querySelector('[data-reading="relative"]').textContent=`Case ${m.heading.toFixed(0)}° clockwise from north; card ${m.heading.toFixed(0)}° counterclockwise relative to case.`;
    panel.querySelector('[data-reading="display"]').textContent=`Compass card = ${m.reading} under lubber line`;
  }};
}
