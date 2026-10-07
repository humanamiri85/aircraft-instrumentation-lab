import {createAltimeter} from '../../instruments/altimeter.js';
import {bindInternalNavigation,lessonTabs,lessonSteps,lessonComponents} from '../navigation.js';
import {mechanismState} from './model.js';
import {components,steps} from './content.js';

const marker=(n,x,y)=>`<g class="component-marker"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+5}">${n}</text></g>`;
const outputs=[['hundreds',415,250,16,'1,000 ft / turn'],['thousands',460,310,21,'10,000 ft / turn'],['tenThousands',500,370,26,'100,000 ft / turn']];
function diagram() {
  return `<svg class="internal-diagram altimeter-diagram" viewBox="0 0 760 470" role="img" aria-labelledby="altimeter-svg-title altimeter-svg-desc">
    <title id="altimeter-svg-title">Mechanical altimeter conceptual cutaway</title>
    <desc id="altimeter-svg-desc">Static pressure fills the open case around three sealed nearly evacuated aneroid wafers. Expansion moves the linkage and lever into a conceptual reduction train and concentric shafts. Three pointers match the cockpit altimeter. Numbered components have keyboard-accessible buttons below.</desc>
    <defs><marker id="altimeter-flow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>
    <g data-component="case"><path class="instrument-case" d="M95 75H395L435 115V420H95Z"/>${marker(2,110,90)}<text class="mechanism-label" x="255" y="108">SURROUNDING STATIC PRESSURE</text></g>
    <g data-component="static" class="static-path"><path d="M25 145H160M160 150V195M195 150V195M230 150V195M160 345V300M195 345V300M230 345V300" marker-end="url(#altimeter-flow)"/>${marker(1,45,145)}</g>
    <path class="stack-support" d="M128 210V290M128 250H140"/>
    <g data-component="stack"><g data-component="capsule">${[0,1,2].map(i=>`<path class="capsule-shell" data-wafer="${i}"/><path class="capsule-fold" data-fold="${i}"/>`).join('')}${[0,1].map(i=>`<path class="capsule-bridge" data-bridge="${i}"/>`).join('')}${marker(3,150,280)}</g>${marker(4,210,320)}<text class="mechanism-label" x="205" y="370">SEALED · NEARLY EVACUATED</text><text class="mechanism-label" x="205" y="390">No static inlet into the wafers</text></g>
    <g data-component="linkage"><path class="connecting-link"/><circle class="link-joint" cy="250" r="5"/>${marker(5,260,300)}</g>
    <g data-component="gear"><g class="sector"><path d="M335 250L367 216A47 47 0 0 1 375 275Z"/><path d="M371 217L377 212M378 230L386 228M381 245H389M379 259L387 262M372 272L378 278"/></g><path class="lever"/><circle class="pivot" cx="335" cy="250" r="7"/>
    <path class="transmission-path" d="M382 250H395M425 267L447 293M474 327L483 349" marker-end="url(#altimeter-flow)"/>
    ${outputs.map(([id,x,y,r,label])=>`<g class="output-gear" data-output-gear="${id}"><circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x-r-4} ${y}H${x+r+4}M${x} ${y-r-4}V${y+r+4}M${x-r*.7} ${y-r*.7}L${x+r*.7} ${y+r*.7}"/></g><text class="gear-label" x="${x}" y="${y+r+18}">${label}</text>`).join('')}${marker(6,350,320)}</g>
    <g data-component="shaft">${outputs.map(([id,x,y])=>`<path class="pointer-shaft" data-output-shaft="${id}" d="M${x} ${y}L620 190"/>`).join('')}${marker(7,535,290)}<text class="mechanism-label" x="615" y="335">CONCENTRIC SHAFTS</text></g>
    <g data-component="dial"><circle class="front-dial" cx="620" cy="190" r="110"/>${Array.from({length:50},(_,i)=>{const a=i*2*Math.PI/50;const major=i%5===0;return `<path class="dial-tick" d="M${620+100*Math.sin(a)} ${190-100*Math.cos(a)}L${620+(major?88:94)*Math.sin(a)} ${190-(major?88:94)*Math.cos(a)}"/>${major?`<text class="dial-number" x="${620+75*Math.sin(a)}" y="${195-75*Math.cos(a)}">${i/5}</text>`:''}`;}).join('')}<text class="dial-unit" x="620" y="232">FEET</text>${marker(9,715,320)}</g>
    <g data-component="pointer"><g data-cutaway-pointer="tenThousands"><path class="outlined-pointer" d="M620 203V104M620 96l-5 11h10Z"/></g><g class="cutaway-pointer" data-cutaway-pointer="thousands"><path d="M615 204L620 142L625 204Z"/></g><g class="cutaway-pointer" data-cutaway-pointer="hundreds"><path d="M618 205L620 108L622 205Z"/></g><circle class="pivot" cx="620" cy="190" r="7"/>${marker(8,620,50)}</g>
    <text class="mechanism-label" x="380" y="452">Motion path schematic · gear sizes and spacing do not encode actual tooth ratios</text>
  </svg>`;
}
export function createAltimeterInternalView(panel) {
  panel.innerHTML=`<div class="section-heading"><div><p class="eyebrow">INSIDE THE INSTRUMENT · PHASE 3B</p><h2 id="altimeter-internal-title">Altimeter</h2></div><span>CONCEPTUAL CUTAWAY</span></div>
    <p class="internal-intro">Trace surrounding static pressure into altitude indication. Use the existing Altitude control.</p>
    ${lessonTabs('altimeter','Altimeter')}
    <div id="altimeter-panel-face" role="tabpanel" aria-labelledby="altimeter-tab-face"><div class="internal-face"></div><p class="face-reading">Indicated altitude: <output data-reading="face"></output></p><p class="internal-note">The same three-pointer dial as the cockpit altimeter. Pressure setting remains fixed.</p></div>
    <div id="altimeter-panel-cutaway" role="tabpanel" aria-labelledby="altimeter-tab-cutaway" hidden></div>
    <div id="altimeter-panel-works" role="tabpanel" aria-labelledby="altimeter-tab-works" hidden>${lessonSteps(steps)}</div>
    <div class="internal-mechanism" hidden><div class="mechanism-layout"><div><p class="pressure-key"><span>Sealed wafers · no pressure inlet inside</span><span>Ps · Static pressure surrounds the stack</span></p><div class="diagram-scroll" tabindex="0" role="region" aria-label="Altimeter cutaway; scroll horizontally on narrow screens">${diagram()}</div><p class="diagram-caption">Lower external pressure → expansion. Higher external pressure → contraction. Case shown open; front dial alongside. Capsule displacement shown is conceptual.</p>${lessonComponents(components,'Altimeter')}</div>
    <div class="measurement-chain"><h3>Live indication chain</h3><ol><li><span>Input · Altitude</span><output data-reading="altitude"></output></li><li><span>Measured physical quantity · Static pressure</span><output data-reading="pressure"></output></li><li><span>Sensing element · Aneroid expansion</span><output data-reading="expansion"></output></li><li><span>Mechanical conversion</span><span>Stack → linkage → lever / gear train → shafts</span></li><li><span>Output · Altimeter</span><output data-reading="pointer"></output></li></ol><p class="internal-note">Long hand: 1 turn / 1,000 ft<br>Short hand: 1 turn / 10,000 ft<br>Outlined marker: 1 turn / 100,000 ft</p><p class="internal-note">Physical principle: static pressure acts on sealed aneroid capsules. Educational model: altitude → static pressure, using a dry standard troposphere: P = P₀(1 − Lh/T₀)^(g/RL). P₀ = 101.325 kPa, T₀ = 288.15 K, L = 0.0065 K/m, g = 9.80665 m/s², R = 287.05 J/(kg·K); h = feet × 0.3048.</p><p class="internal-note">Educational visualization: pressure deficit normalized between 0 and 10,000 ft → capsule expansion. Conceptual mechanism: stack → linkage → gears → shafts. ASI retains its fixed-density model; other controls do not affect this indication.</p></div></div></div>
    <p class="internal-note">Internal geometry and capsule displacement are simplified for teaching. Capsule displacement shown is conceptual. Gear motion illustrates the calibrated pointer outputs, not certified geometry or a literal tooth layout. No barometric-setting effects, lag, temperature corrections, failures or flight dynamics are modeled.</p>`;
  const faceUpdate=createAltimeter(panel.querySelector('.internal-face'));
  const navigation=bindInternalNavigation(panel,{prefix:'altimeter',instrument:'altimeter',components});
  let lastAltitude;
  return {...navigation,update(state) {
    if(lastAltitude===state.altitude)return;
    lastAltitude=state.altitude;
    const m=mechanismState(state.altitude);
    faceUpdate({altitude:m.altitude});
    const feet=`${Math.round(m.altitude).toLocaleString('en-US')} ft`;
    for(const [key,value] of Object.entries({face:feet,altitude:feet,pointer:feet,pressure:`${(m.pressure/1000).toFixed(1)} kPa`,expansion:`${Math.round(m.expansion*100)}% visual scale`}))panel.querySelector(`[data-reading="${key}"]`).textContent=value;
    panel.dataset.pressure=String(m.pressure);panel.dataset.expansion=String(m.expansion);
    for(let i=0;i<3;i++){
      const x=140+i*(m.waferWidth+4),end=x+m.waferWidth;
      panel.querySelector(`[data-wafer="${i}"]`).setAttribute('d',`M${x} 220Q${x-5} 250 ${x} 280H${end}Q${end+5} 250 ${end} 220Z`);
      panel.querySelector(`[data-fold="${i}"]`).setAttribute('d',`M${x+5} 224Q${x+1} 250 ${x+5} 276M${end-5} 224Q${end-1} 250 ${end-5} 276`);
    }
    for(let i=0;i<2;i++){
      const end=140+i*(m.waferWidth+4)+m.waferWidth;
      panel.querySelector(`[data-bridge="${i}"]`).setAttribute('d',`M${end} 250H${end+4}`);
    }
    panel.querySelector('.connecting-link').setAttribute('d',`M${m.capsuleEnd} 250L${m.leverTip.x} ${m.leverTip.y}`);
    panel.querySelector('.link-joint').setAttribute('cx',m.capsuleEnd);
    panel.querySelector('.lever').setAttribute('d',`M335 250L${m.leverTip.x} ${m.leverTip.y}`);
    panel.querySelector('.sector').setAttribute('transform',`rotate(${m.leverAngle} 335 250)`);
    for(const [id,x,y] of outputs){
      panel.querySelector(`[data-output-gear="${id}"]`).setAttribute('transform',`rotate(${m.angles[id]} ${x} ${y})`);
      panel.querySelector(`[data-output-shaft="${id}"]`).dataset.angle=String(m.angles[id]);
      panel.querySelector(`[data-cutaway-pointer="${id}"]`).setAttribute('transform',`rotate(${m.angles[id]} 620 190)`);
    }
    panel.classList.add('chain-active');
  }};
}
