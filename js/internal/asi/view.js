import {bindInternalNavigation} from '../navigation.js';
import {createAirspeed} from '../../instruments/airspeed.js';
import {mechanismState} from './model.js';
import {components, steps} from './content.js';

// SVG is a conceptual side cutaway with the front dial shown obliquely alongside it.
// Numbered components share a keyboard-accessible HTML legend, keeping labels readable.
const marker = (number,x,y) => `<g class="component-marker"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+5}">${number}</text></g>`;
function diagram() {
  return `<svg class="asi-diagram internal-diagram" viewBox="0 0 600 410" role="img" aria-labelledby="asi-svg-title asi-svg-desc">
  <title id="asi-svg-title">Mechanical airspeed indicator conceptual cutaway</title>
  <desc id="asi-svg-desc">Pitot total pressure enters inside the capsule. Static pressure surrounds it in the case. Capsule deflection moves a link, lever and gear, transmitting motion through a shaft to the front pointer. Numbers correspond to component buttons below.</desc>
  <defs><marker id="asi-flow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>
  <path class="asi-case instrument-case" d="M100 75L360 75L415 125L415 345L100 345Z"/>
  <g data-component="static" class="static-path"><path d="M35 105H155V155M125 155H335M125 190H335" marker-end="url(#asi-flow)"/>${marker(2,65,105)}</g>
  <g data-component="pitot" class="pitot-path"><path d="M35 300H135" marker-end="url(#asi-flow)"/>${marker(1,65,300)}</g>
  <g data-component="capsule"><path class="capsule-shell" d="M135 266Q110 300 135 334H190Q215 300 190 266Z"/><path class="capsule-fold" d="M145 270Q125 300 145 330M158 270Q138 300 158 330M171 270Q151 300 171 330"/>${marker(3,155,355)}</g>
  <g data-component="linkage"><path class="connecting-link" d="M190 300L240 288"/><circle class="link-joint" cx="190" cy="300" r="5"/>${marker(4,215,340)}</g>
  <g data-component="gear"><g class="sector"><path d="M290 260L261 221A49 49 0 0 1 335 279Z"/><path d="M329 233L335 229M334 243L341 241M338 254L345 254M337 265L344 267M333 276L340 280"/></g><path class="lever" d="M290 260L240 288"/><circle class="pivot" cx="290" cy="260" r="7"/><g class="pinion"><circle cx="355" cy="260" r="17"/><path d="M355 239V281M334 260H376M340 245L370 275M340 275L370 245"/></g>${marker(5,300,315)}</g>
  <g data-component="shaft"><path class="pointer-shaft" d="M355 260L475 170"/><circle class="pivot" cx="355" cy="260" r="5"/><path class="shaft-label-line" d="M380 297L390 245"/>${marker(6,380,310)}</g>
  <g data-component="dial"><circle class="front-dial" cx="475" cy="170" r="100"/>
  ${Array.from({length:11},(_,i)=>{const angle=i*33*Math.PI/180;return `<path class="dial-tick" d="M${475+92*Math.sin(angle)} ${170-92*Math.cos(angle)}L${475+83*Math.sin(angle)} ${170-83*Math.cos(angle)}"/><text class="dial-number" x="${475+70*Math.sin(angle)}" y="${174-70*Math.cos(angle)}">${i*20}</text>`;}).join('')}
  <text class="dial-unit" x="475" y="212">KNOTS</text>${marker(8,565,285)}</g>
  <g data-component="pointer"><g class="cutaway-pointer"><path d="M471 185L475 90L479 185Z"/></g><circle class="pivot" cx="475" cy="170" r="6"/>${marker(7,475,50)}</g>
  </svg>`;
}

export function createAsiInternalView(panel) {
  panel.innerHTML = `<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3A</p><h2 id="internal-title">Airspeed Indicator</h2></div><span>CONCEPTUAL CUTAWAY</span></div>
    <p class="internal-intro">Trace pressure into motion. Use the existing Airspeed control to explore the measurement chain.</p>
    <div class="internal-tabs" role="tablist" aria-label="Airspeed learning views">${[['face','Instrument Face'],['cutaway','Internal Cutaway'],['works','How It Works']].map(([id,label],i)=>`<button type="button" role="tab" id="asi-tab-${id}" aria-controls="asi-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>
    <div id="asi-panel-face" role="tabpanel" aria-labelledby="asi-tab-face"><div class="internal-face"></div><p class="face-reading">Indicated airspeed: <output data-reading="face"></output></p><p class="internal-note">The same teaching dial and indication as the cockpit ASI.</p></div>
    <div id="asi-panel-cutaway" role="tabpanel" aria-labelledby="asi-tab-cutaway" hidden></div>
    <div id="asi-panel-works" role="tabpanel" aria-labelledby="asi-tab-works" hidden><ol class="asi-steps internal-steps">${steps.map(([component,label],i)=>`<li><button type="button" data-step="${i}" data-step-component="${component}" aria-pressed="false"><strong>Step ${i+1}</strong> ${label}</button></li>`).join('')}</ol></div>
    <div class="internal-mechanism" hidden><div class="mechanism-layout"><div><p class="pressure-key"><span>Pt · Pitot / total pressure → inside capsule</span><span>Ps · Static pressure → outside capsule</span></p><div class="diagram-scroll" tabindex="0" role="region" aria-label="Cutaway diagram; scroll horizontally on narrow screens">${diagram()}</div><p class="diagram-caption">Case shown open; front dial shown alongside. Numbers identify components.</p><div class="component-legend" aria-label="Cutaway components">${components.map(([id,label],i)=>`<button type="button" data-select-component="${id}" aria-pressed="false"><span>${i+1}</span> ${label}</button>`).join('')}</div><p class="component-explanation" role="status">Select a numbered component or a teaching step to learn its role.</p></div>
    <div class="measurement-chain"><h3>Measurement chain</h3><ol><li><span>Input · Airspeed</span><output data-reading="ias"></output></li><li><span>Pressure · ΔP = Pt − Ps ≈ q</span><output data-reading="pressure"></output></li><li><span>Sensor · Diaphragm deflection</span><output data-reading="deflection"></output></li><li><span>Conversion · Linkage / gear motion</span><span>Capsule → link → lever → shaft</span></li><li><span>Output · Pointer</span><output data-reading="pointer"></output></li></ol><dl class="pressure-reference"><div><dt>Static pressure</dt><dd>Reference (fixed)</dd></div><div><dt>Dynamic pressure q</dt><dd data-reading="dynamic"></dd></div></dl><p class="internal-note">q = ½ρV² · ρ = 1.225 kg/m³<br>V converted from knots to m/s.</p><p class="internal-note">Pressure values use a simplified fixed-density teaching model. These are educational reference values, not exact aircraft air-data values. Altitude does not change this calculation.</p></div></div></div>
    <p class="internal-note">Internal geometry and displacement are simplified for teaching. Pressure is a physics-based reference calculation; deflection and linkage travel are normalized visual mappings, not calibrated mechanical dimensions.</p>`;
  const faceUpdate = createAirspeed(panel.querySelector('.internal-face'));
  const navigation = bindInternalNavigation(panel, {prefix:'asi', instrument:'airspeed', components});
  let lastAirspeed;
  return {
    ...navigation,
    update(state) {
      if(lastAirspeed===state.airspeed)return;
      lastAirspeed=state.airspeed;
      const m=mechanismState(state.airspeed);
      faceUpdate({airspeed:m.ias});
      const readings={face:`${Math.round(m.ias)} kt`,ias:`${Math.round(m.ias)} kt`,pointer:`${Math.round(m.ias)} kt`,pressure:`${Math.round(m.pressure)} Pa`,dynamic:`${Math.round(m.pressure)} Pa`,deflection:`${Math.round(m.deflection*100)}% visual scale`};
      for(const [key,value] of Object.entries(readings))panel.querySelector(`[data-reading="${key}"]`).textContent=value;
      panel.dataset.pressure=String(m.pressure);panel.dataset.deflection=String(m.deflection);
      panel.querySelector('.capsule-shell').setAttribute('d',`M135 266Q110 300 135 334H${m.capsuleEnd}Q${m.capsuleEnd+25} 300 ${m.capsuleEnd} 266Z`);
      panel.querySelector('.connecting-link').setAttribute('d',`M${m.capsuleEnd} 300L${m.leverTip.x} ${m.leverTip.y}`);
      panel.querySelector('.link-joint').setAttribute('cx',m.capsuleEnd);
      panel.querySelector('.lever').setAttribute('d',`M290 260L${m.leverTip.x} ${m.leverTip.y}`);
      panel.querySelector('.sector').setAttribute('transform',`rotate(${m.leverAngle} 290 260)`);
      // The nonlinear calibrated scale is represented conceptually, not a literal gear ratio.
      panel.querySelector('.pinion').setAttribute('transform',`rotate(${m.pointerAngle} 355 260)`);
      panel.querySelector('.cutaway-pointer').setAttribute('transform',`rotate(${m.pointerAngle} 475 170)`);
      // Continuous outlined chain supplies cause/effect emphasis without flashing or extra animation.
      panel.classList.add('chain-active');
    }
  };
}
