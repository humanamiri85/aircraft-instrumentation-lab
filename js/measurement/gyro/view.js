import {lessonSteps,lessonComponents,bindLessonComponents} from '../../internal/navigation.js';
import {gyroAssembly} from '../../internal/gyro/svg-assembly.js';
import {createAttitude} from '../../instruments/attitude.js';
import {createHeading} from '../../instruments/heading.js';
import {createTurn} from '../../instruments/turn.js';
import {systemState,referenceTypes,focusedPaths} from './model.js';
import {titles,chains,steps,components,proxyNote} from './content.js';

// Reuse Phase 3 assembly geometry; HTML stage labels stay readable at narrow widths.
function assembly(kind) {
  const rate=kind==='turn';
  const geometry=gyroAssembly({restrained:rate}).replaceAll('data-component="','data-component="gc-');
  return `<svg class="gc-assembly attitude-diagram" viewBox="-110 -110 220 220" role="img" aria-label="${rate?'Restrained rate gyro; conceptual deflection axis':kind==='attitude'?'Ideal vertical axis; separate pitch and bank projections':'Ideal directional axis; world-view yaw projection'}">
    <path d="M-100 0H100" class="${rate?'gc-neutral':'stable-horizon'}"/>
    <g data-component="${rate?'gc-rate':'gc-relative'}"><g data-motion="${kind}">${rate?`<g data-component="gc-precession">${geometry}</g>`:`<rect x="-88" y="-88" width="176" height="176" rx="12" class="gc-case"/><path d="M-75 15H-30L-18 23M18 23L30 15H75" class="case-symbol"/>${kind==='heading'?'<path d="M0 -88V-102M-6 -96L0 -102L6 -96" class="case-symbol"/>':''}`}</g></g>
    ${rate?'':geometry}
    ${rate?'<g data-component="gc-spring"><path data-spring d="M65 0L73 8L81 -8L89 8L97 0" class="turn-spring"/></g>':''}
    </svg><p class="gc-assembly-caption">${rate?'Restrained · not world-stabilized':kind==='attitude'?'Vertical · world up':'Directional · north'}</p>`;
}
function path(instrument) {
  const rate=instrument==='turn',ai=instrument==='attitude';
  const cells=[
    ['gc-body','1 · Aircraft motion',rate?'APP CONTROL: Bank proxy<br>REAL MEASURAND: Angular rate':ai?'Pitch / bank orientation':'Heading / yaw orientation'],
    [rate?'gc-rate':ai?'gc-vertical':'gc-directional','2 · Gyro input / reference',rate?'Restrained rate gyro':ai?'Ideal stabilized vertical gyro':'Ideal directional gyro'],
    [rate?'gc-precession':'gc-relative',rate?'3 · Precession / restraint':'3 · Gimbals / relative motion',`${assembly(instrument)}${ai?`<p>Side pitch projection</p><div data-bank-projection>${assembly(instrument)}</div><p>Front bank projection</p>`:''}${rate?'Precession tendency → spring-restraint equilibrium':ai?'Case moves around world up':'Case rotates around directional reference'}`],
    ['gc-conversion','4 · Mechanical conversion',rate?'Spring-restraint deflection → output linkage':ai?'Gimbal / display linkage':'Pickoff / gear → card rotation'],
    ['gc-output','5 · Cockpit indication',`<div class="gc-face" data-chain-face="${instrument}"></div>${rate?'Turn indication · proxy mapping':ai?'Pitch and bank · relative horizon':'Heading · fixed lubber line'}`]
  ];
  return `<article class="gc-path" data-gyro-path="${instrument}"><h4>${titles[instrument]} <span data-path-badge></span></h4><ol class="gc-stages">${cells.map(([id,title,body])=>`<li data-component="${id}"><strong>${title}</strong><div>${body}</div></li>`).join('')}</ol></article>`;
}
export function createGyroChainView(panel,instrument) {
  const entries=components(instrument);
  panel.innerHTML=`<section class="gc-system" aria-label="${titles[instrument]} measurement chain">
    <h3>Gyroscopic measurement chains</h3><p>Aircraft motion → gyro input / reference → gimbals or restraint → mechanical conversion → cockpit indication.</p>
    <p class="ps-focus-note" data-focus-note></p>
    <p class="internal-note">AI: vertical reference for pitch / bank. HI: directional reference for heading. TC: restrained angular-rate response. AI/HI solid axes denote ideal references; TC’s shaft denotes its spin axis, not a world reference. Dashed cases denote aircraft-fixed parts. Rotor disks and axis projections are schematic; ↻ shows spin direction statically.</p>
    <div class="gc-topology">${Object.keys(titles).map(path).join('')}</div>
    <p class="gc-proxy-note">${proxyNote}</p>
    <div class="turn-inclinometer" data-component="gc-ball"><h4>Inclinometer ball · separate subsystem</h4><svg viewBox="0 0 300 85" role="img" aria-label="Separate centered ball; no gyro linkage or slip/skid dynamics"><path d="M40 20Q150 60 260 20v25Q150 85 40 45Z" fill="#c8d0cd" stroke="#f0f1e7"/><circle cx="150" cy="48" r="10" fill="#101416"/><path d="M134 35v28m32 -28v28" stroke="#343b3d"/></svg><p>The existing ball stays centered. Real displacement depends on gravity and lateral acceleration; this app has no slip/skid model.</p></div>
    <div class="ps-live"><h4>Live system values</h4><dl>${[['pitch','Pitch'],['bank','Bank'],['heading','Heading'],['aiReference','AI reference'],['hiReference','HI reference'],['tcInput','TC teaching input'],['tcResponse','TC physical response concept'],['deflection','TC gyro deflection']].map(([id,title])=>`<div><dt>${title}</dt><dd><output data-gyro-value="${id}"></output></dd></div>`).join('')}</dl></div>
    <div class="ps-chain"><h4>${titles[instrument]}: motion to indication</h4><ol>${chains[instrument].map(([label,text])=>`<li><strong>${label}</strong><span>${text}</span></li>`).join('')}</ol></div>
    <p class="ps-internal-link">Explore the reused Phase 3 mechanism in <button type="button" data-open-cutaway>Internal Cutaway</button>.</p>
    <h4>System teaching steps</h4>${lessonSteps(steps[instrument])}${lessonComponents(entries,'Gyroscopic measurement chain')}
    <p class="internal-note">Physical principle: gyroscopic rigidity / angular momentum provides orientation references; gyroscopic precession underlies restrained angular-rate sensing.</p>
    <p class="internal-note">Educational model: idealized vertical or directional reference orientation; TC uses bounded, quasi-static restrained-gyro response driven only by the Bank proxy. Independent controls do not integrate heading, attitude or flight dynamics. No calibrated angular rates or spring forces are inferred.</p>
    <p class="internal-note">Visual mapping: the geometry and motion are conceptual teaching representations, not manufacturer-specific hardware. Existing Phase 3 SVG assemblies and cockpit mappings are reused. The reference gyro is idealized; real instruments exhibit drift, friction and erection-system behavior, which are not modeled here.</p>
    </section>`;
  const system=panel.querySelector('.gc-system');
  system.dataset.selectedInstrument=instrument;system.dataset.referenceType=referenceTypes[instrument];
  const faces={attitude:createAttitude(system.querySelector('[data-chain-face="attitude"]')),heading:createHeading(system.querySelector('[data-chain-face="heading"]')),turn:createTurn(system.querySelector('[data-chain-face="turn"]'))};
  // Reuse renderer parts and prefix component names to keep the original lessons independent.
  system.querySelectorAll('.gc-face [data-component]').forEach(part=>part.dataset.component=`gc-${part.dataset.component}`);
  const card=system.querySelector('[data-chain-face="heading"] [data-part="card"]');card.dataset.component='gc-card';
  card.nextElementSibling.dataset.component='gc-lubber';card.nextElementSibling.nextElementSibling.dataset.component='gc-lubber';
  system.querySelector('[data-chain-face="turn"] [data-part="plane"]').dataset.component='gc-output';
  bindLessonComponents(system,entries);
  system.querySelectorAll('[data-step],[data-select-component]').forEach(button=>button.addEventListener('click',()=>system.querySelectorAll(`.gc-path:not([data-gyro-path="${instrument}"]) .component-active`).forEach(part=>part.classList.remove('component-active'))));
  system.querySelector('[data-open-cutaway]').addEventListener('click',()=>{const tab=panel.closest('.internal-panel').querySelector('[role=tab][id$="-tab-cutaway"]');tab.click();tab.focus();});
  let headingAngle,lastFocus;
  return {
    setFocus(enabled) {
      if(lastFocus===enabled)return;lastFocus=enabled;
      system.dataset.focus=String(enabled);
      system.querySelectorAll('[data-gyro-path]').forEach(row=>{
        const selected=focusedPaths(instrument).includes(row.dataset.gyroPath);
        row.classList.toggle('gc-selected',enabled&&selected);row.classList.toggle('gc-dimmed',enabled&&!selected);
        row.querySelector('[data-path-badge]').textContent=selected?'Selected instrument':enabled?'Other path':'All paths visible';
      });
      system.querySelector('[data-focus-note]').textContent=enabled?`Teaching Focus: ${titles[instrument]} chain emphasized; other paths remain visible.`:'Teaching Focus off: all gyroscopic paths shown equally.';
    },
    update(state,_lag,reduced=false) {
      const m=systemState(state,headingAngle);headingAngle=m.heading.caseAngle;
      Object.assign(system.dataset,{reducedMotion:String(reduced),pitchOffset:String(m.attitude.display.pitchOffset),horizonRoll:String(m.attitude.display.roll),caseAngle:String(headingAngle),cardAngle:String(m.heading.continuousCardAngle),rateProxy:String(m.turn.rateProxy),gimbalAngle:String(m.turn.gimbalAngle),ballOffset:String(m.turn.ballOffset)});
      for(const id of Object.keys(faces))faces[id](m[id]);
      // Continuous Phase 3 heading adapter avoids a 359↔0 visual discontinuity.
      card.setAttribute('transform',`rotate(${m.heading.continuousCardAngle} 100 100)`);
      const ai=system.querySelector('[data-gyro-path="attitude"]');
      ai.querySelector('[data-motion]').setAttribute('transform',`rotate(${m.attitude.casePitch})`);
      ai.querySelector('[data-bank-projection] [data-motion]').setAttribute('transform',`rotate(${m.attitude.caseBank})`);
      system.querySelector('[data-motion="heading"]').setAttribute('transform',`rotate(${headingAngle})`);
      system.querySelector('[data-motion="turn"]').setAttribute('transform',`rotate(${m.turn.gimbalAngle})`);
      const radians=m.turn.gimbalAngle*Math.PI/180,x=50*Math.cos(radians),y=50*Math.sin(radians);
      const points=Array.from({length:9},(_,i)=>`${x+(100-x)*i/8},${y*(1-i/8)+(i===0||i===8?0:i%2?5:-5)}`);
      system.querySelector('[data-spring]').setAttribute('d',`M${points.join('L')}`);
      const signed=value=>`${value>0?'+':''}${value}°`;
      const values={pitch:signed(m.attitude.pitch),bank:signed(m.attitude.bank),heading:m.heading.reading,aiReference:'Vertical gyro — ideal stabilized reference',hiReference:'Directional gyro — ideal heading reference',tcInput:`Bank proxy ${signed(m.turn.bank)}`,tcResponse:'Angular-rate sensing',deflection:`${m.turn.rateProxy.toFixed(2)} normalized · ${m.turn.direction}`};
      for(const [id,value] of Object.entries(values)) {const output=system.querySelector(`[data-gyro-value="${id}"]`);if(output.textContent!==value)output.textContent=value;}
    }
  };
}
