import {createVSI} from '../../instruments/vsi.js';
import {bindInternalNavigation} from '../navigation.js';
import {mechanismState,LAG_SECONDS} from './model.js';
import {components,steps} from './content.js';
const marker=(n,x,y)=>`<g class="component-marker"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+5}">${n}</text></g>`;
const rate=value=>`${value>0?'+':''}${Math.round(value).toLocaleString('en-US')} ft/min`;
function diagram(){return `<svg class="internal-diagram vsi-diagram" viewBox="0 0 760 440" role="img" aria-labelledby="vsi-svg-title vsi-svg-desc">
<title id="vsi-svg-title">Mechanical VSI pressure-lag cutaway</title><desc id="vsi-svg-desc">A direct static inlet feeds the fast diaphragm. A separate restricted branch feeds the slower case. Pressure difference flexes the diaphragm and moves a conceptual linkage to the climb or descent pointer. Pressure bars use a shared moving reference.</desc>
<g data-component="case"><rect class="instrument-case" x="100" y="80" width="330" height="300" rx="20"/><path class="pressure-trend slow-trend"/>${marker(3,410,100)}<text x="260" y="120">CASE · DELAYED PRESSURE</text></g>
<g data-component="static" class="static-path"><path d="M20 190H180M75 190V315H155"/>${marker(1,35,165)}<text x="65" y="220">STATIC</text></g>
<g data-component="leak"><path class="restriction" d="M150 305L160 325L170 305L180 325L190 315H220"/>${marker(4,170,355)}<text x="285" y="330">CALIBRATED LEAK</text></g>
<g data-component="diaphragm"><path class="capsule-shell" data-diaphragm/><path class="pressure-trend fast-trend"/><text x="220" y="195" class="chamber-label">DIRECT STATIC</text>${marker(2,195,145)}<text x="230" y="275">FAST DIAPHRAGM</text></g>
<g data-component="difference"><text x="255" y="40">RELATIVE PRESSURES · SHARED MOVING REFERENCE</text><path class="pressure-baseline" d="M90 55H410"/><path class="pressure-bar fast-bar"/><path class="pressure-bar slow-bar"/>${marker(5,445,45)}</g>
<g data-component="linkage"><path class="connecting-link"/><path class="lever" d="M350 235L375 190"/>${marker(6,340,285)}</g>
<g data-component="shaft"><path class="pointer-shaft" d="M375 190H610"/>${marker(7,475,210)}</g>
<g data-component="dial"><circle class="front-dial" cx="610" cy="190" r="110"/>${marker(9,710,310)}<g class="vsi-dial-face" transform="translate(510 90)"></g></g>
<g data-component="pointer"><g class="cutaway-pointer"><path d="M607 203L610 107L613 203Z"/></g>${marker(8,610,70)}</g><circle class="pivot" cx="610" cy="190" r="6"/>
<text x="610" y="350">CLIMB ↑ · ZERO ← · DESCENT ↓</text><text x="380" y="415">Conceptual displacement and linkage · not manufacturing geometry</text></svg>`;}
export function createVsiInternalView(panel){
 panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3C</p><h2 id="vsi-internal-title">Vertical Speed Indicator</h2></div><span>PRESSURE LAG</span></div>
 <p class="internal-intro">Use the existing Vertical Speed control to explore fast diaphragm pressure and delayed case pressure. Set it to zero to watch equalization.</p>
 <div class="internal-tabs" role="tablist" aria-label="VSI learning views">${[['face','Instrument Face'],['cutaway','Internal Cutaway'],['works','How It Works']].map(([id,label],i)=>`<button type="button" role="tab" id="vsi-tab-${id}" aria-controls="vsi-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>
 <div id="vsi-panel-face" role="tabpanel" aria-labelledby="vsi-tab-face"><div class="internal-face"></div><p class="face-reading">VSI indication: <output data-reading="face"></output></p></div>
 <div id="vsi-panel-cutaway" role="tabpanel" aria-labelledby="vsi-tab-cutaway" hidden></div>
 <div id="vsi-panel-works" role="tabpanel" aria-labelledby="vsi-tab-works" hidden><ol class="internal-steps">${steps.map(([id,label],i)=>`<li><button type="button" data-step="${i}" data-step-component="${id}" aria-pressed="false"><strong>Step ${i+1}</strong>${label}</button></li>`).join('')}</ol></div>
 <div class="internal-mechanism" hidden><div class="mechanism-layout"><div><p class="pressure-key"><span>Gold · diaphragm / fast</span><span>Blue · case / delayed</span></p><div class="diagram-scroll" tabindex="0" role="region" aria-label="VSI cutaway; scroll horizontally on narrow screens">${diagram()}</div><p class="diagram-caption">Climb: lower diaphragm pressure, positive case − diaphragm difference. Descent reverses the difference. The diaphragm contracts in climb and expands in descent. At zero input, the two pressure bars converge.</p><div class="component-legend">${components.map(([id,label],i)=>`<button type="button" data-select-component="${id}" aria-pressed="false"><span>${i+1}</span>${label}</button>`).join('')}</div><p class="component-explanation" role="status">Select a component or step to learn its role.</p></div>
 <div class="measurement-chain"><h3>Measurement chain</h3><ol>${[['input','Input · Vertical speed'],['trend','Static pressure trend'],['fast','Diaphragm response'],['slow','Case pressure response'],['difference','Pressure difference · case − diaphragm'],['output','Output · VSI']].map(([id,label])=>`<li><span>${label}</span><output data-reading="${id}"></output></li>`).join('')}</ol><p class="internal-note" data-motion-note></p><p class="internal-note">Physical concept: pressure-rate sensing through differential lag. Educational model: immediate diaphragm response and a first-order case lag of ${LAG_SECONDS} seconds, chosen for this lesson, not a universal real VSI constant. Visualization: normalized displacement and conceptual linkage geometry; pressure bars share a moving reference, not absolute pressure units.</p></div></div></div>
 <p class="internal-note">Pressure lag and displacement are simplified for teaching; actual VSI design and calibration vary. Sustained climb or descent maintains a difference; it decays when pressure stops changing. Vertical speed never changes altitude, and altitude, pitch and airspeed do not drive this model.</p>`;
 const face=createVSI(panel.querySelector('.internal-face'));
 createVSI(panel.querySelector('.vsi-dial-face'));
 // Reuse the original calibrated dial, with one explicitly highlighted live pointer.
 panel.querySelector('.vsi-dial-face [data-part="pointer"]').remove();
 const dial=panel.querySelector('.vsi-dial-face svg');dial.setAttribute('width','200');dial.setAttribute('height','200');
 const navigation=bindInternalNavigation(panel,{prefix:'vsi',instrument:'vsi',components});
 return {...navigation,update(state,lag,reduced=false){
 const m=mechanismState(lag,state.verticalSpeed);face({verticalSpeed:m.indicated});
 panel.dataset.differential=String(m.differential);panel.dataset.indicated=String(m.indicated);
 const values={face:rate(m.indicated),input:rate(m.input),trend:m.trend,fast:`Fast · direct static connection${m.input>0?' · falling':m.input<0?' · rising':' · constant'}`,slow:`Delayed · through calibrated leak${Math.abs(m.differential)>0.001?(m.differential>0?' · falling':' · rising'):' · initially unchanged'}`,difference:`${(100*m.differential).toFixed(1)}% relative scale`,output:rate(m.indicated)};
 for(const [key,value] of Object.entries(values))panel.querySelector(`[data-reading="${key}"]`).textContent=value;
 panel.querySelector('[data-motion-note]').textContent=reduced?'Reduced motion: settled positions shown immediately. A real-time transition would build a pressure difference; at zero, case pressure catches up and the pointer returns to neutral.':'Watch the difference build or reverse. Set Vertical Speed to zero to see pressure equalization and recovery.';
 // Higher surrounding case pressure contracts the diaphragm in climb.
 const end=260-m.displacement;
 panel.querySelector('[data-diaphragm]').setAttribute('d',`M180 165H${end}Q${end+15} 195 ${end} 225H180Z`);
 const a=-20*m.differential*Math.PI/180;
 const tip={x:350+25*Math.cos(a)+45*Math.sin(a),y:235+25*Math.sin(a)-45*Math.cos(a)};
 panel.querySelector('.connecting-link').setAttribute('d',`M${end} 195L${tip.x} ${tip.y}`);
 panel.querySelector('.lever').setAttribute('transform',`rotate(${-20*m.differential} 350 235)`);
 panel.querySelector('.cutaway-pointer').setAttribute('transform',`rotate(${m.angle} 610 190)`);
 panel.querySelector('.fast-bar').setAttribute('d',`M250 55H${250+150*m.diaphragm}`);
 panel.querySelector('.slow-bar').setAttribute('d',`M250 65H${250+150*m.case}`);
 for(const [selector,x,y,value] of [['.fast-trend',220,240,m.input/2000],['.slow-trend',390,170,m.differential]]){
  const part=panel.querySelector(selector);const length=28*value;
  part.setAttribute('d',Math.abs(value)<0.001?'':`M${x} ${y}v${length}m-5 ${-5*Math.sign(value)}l5 ${5*Math.sign(value)}l5 ${-5*Math.sign(value)}`);
 }
 panel.classList.add('chain-active');
 }};
}
