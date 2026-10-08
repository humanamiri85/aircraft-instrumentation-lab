import {lessonSteps,lessonComponents,bindLessonComponents} from '../../internal/navigation.js';
import {systemState,focusedRegions} from './model.js';
import {components,steps,chains,titles} from './content.js';

const group=(id,body)=>`<g data-component="${id}">${body}</g>`;
const label=(x,y,text)=>`<text x="${x}" y="${y}">${text}</text>`;
const path=(id,d,kind)=>group(id,`<path class="ps-route ${kind}" d="${d}"/>`);
const destination=(id,x,y,width)=>group(`${id}-connection`,`<rect x="${x}" y="${y}" width="${width}" height="78" rx="10"/>${label(x+12,y+25,{airspeed:'ASI · Pt + Ps',altimeter:'Altimeter · Ps only',vsi:'VSI · Ps only'}[id])}${label(x+12,y+51,{airspeed:'Differential diaphragm',altimeter:'Sealed aneroid stack',vsi:'Internal calibrated leak'}[id])}${label(x+12,y+70,'Sensing → indication')}`);
function diagram(instrument,mobile=false) {
  const title=`ps-${instrument}-${mobile?'vertical':'horizontal'}`;
  const sources=mobile?
    `${group('free-stream',label(18,28,'Atmosphere / free stream →'))}<path class="ps-fuselage" d="M18 55Q160 35 318 55V155H18Z"/>
    ${group('pitot-tube',`<path class="ps-probe" d="M22 80H75V115"/>${label(25,72,'Pitot tube')}`)}${group('total-pressure',label(45,142,'Pt'))}
    ${group('static-port',`<circle class="ps-port" cx="235" cy="110" r="6"/>${label(160,92,'Static port')}`)}${group('static-pressure',label(250,142,'Ps'))}`:
    `${group('free-stream',label(18,32,'Atmosphere / free stream →'))}<path class="ps-fuselage" d="M18 70Q160 45 250 90V275H18Z"/>
    ${group('pitot-tube',`<path class="ps-probe" d="M40 115H100V140"/>${label(30,100,'Pitot tube')}`)}${group('total-pressure',label(110,140,'Pt'))}
    ${group('static-port',`<circle class="ps-port" cx="175" cy="215" r="6"/>${label(60,195,'Static port')}`)}${group('static-pressure',label(195,237,'Ps'))}`;
  const topology=mobile?
    `${path('pitot-line','M75 115V225H105V275','ps-total')}${path('static-line','M235 110V570','ps-static')}
    ${path('airspeed-connection','M235 315H195','ps-static')}${destination('airspeed',18,275,190)}
    ${path('altimeter-connection','M235 425H195','ps-static')}${destination('altimeter',18,385,190)}
    ${path('vsi-connection','M235 535H195','ps-static')}${destination('vsi',18,495,190)}
    ${label(18,195,'Transmission: pressure signals')}${label(25,250,'Pt ↓ · solid')}${label(244,360,'Ps ↓')}${label(244,380,'dashed')}`:
    `${path('pitot-line','M100 140H305V100H540','ps-total')}${path('static-line','M175 215H365V145M365 215V405','ps-static')}
    ${path('airspeed-connection','M365 145H540','ps-static')}${destination('airspeed',540,80,205)}
    ${path('altimeter-connection','M365 280H540','ps-static')}${destination('altimeter',540,240,205)}
    ${path('vsi-connection','M365 405H540','ps-static')}${destination('vsi',540,365,205)}
    ${label(310,70,'Pt → solid line')}${label(375,205,'Ps → dashed line')}${label(18,335,'Simplified aircraft exterior')}${label(18,360,'Separate pressure connections')}`;
  return `<svg class="ps-diagram ps-${mobile?'vertical':'horizontal'}" viewBox="0 0 ${mobile?'340 600':'770 465'}" role="img" aria-labelledby="${title}-title ${title}-desc"><title id="${title}-title">Pitot-static measurement system</title><desc id="${title}-desc">Solid total-pressure line from the pitot tube to ASI only. Dashed static-pressure line from the side port to ASI, altimeter and VSI. The VSI calibrated leak is internal. Paths represent pressure signals, not continuous airflow.</desc>${sources}${topology}</svg>`;
}

export function createPitotStaticView(panel,instrument) {
  const guided=steps.map(([id,text],i)=>[i>=4?`${instrument}-connection`:id,text]);
  panel.innerHTML=`<section class="ps-system" aria-label="${titles[instrument]} measurement chain">
    <h3>Pitot-static measurement chain</h3><p>Physical source → transmission → sensing element → conversion → cockpit indication.</p>
    <p class="ps-focus-note" data-focus-note></p>
    <div class="ps-topology">${diagram(instrument)}${diagram(instrument,true)}</div>
    <p class="internal-note">Solid Pt line: ASI only. Dashed Ps line: ASI, Altimeter and VSI. Arrows and subtle pulses represent a pressure signal transmitted through the line, not continuous bulk airflow.</p>
    <div class="ps-live"><h4>Live system values</h4><dl>${[['airspeed','Airspeed'],['altitude','Altitude'],['verticalSpeed','Vertical speed input'],['ps','Static pressure Ps'],['q','Dynamic pressure q'],['pt','Total pressure Pt'],['trend','VSI pressure trend'],['lag','VSI internal lag'],['indicated','VSI cockpit indication']].map(([key,title])=>`<div><dt>${title}</dt><dd><output data-system-value="${key}"></output></dd></div>`).join('')}</dl></div>
    <div class="ps-chain"><h4>${titles[instrument]}: source to indication</h4><ol>${chains[instrument].map(([title,text])=>`<li><strong>${title}</strong><span>${text}</span></li>`).join('')}</ol></div>
    <p class="ps-internal-link">Trace these inputs into <button type="button" data-open-cutaway>Internal Cutaway</button>: <span>${instrument==='airspeed'?'Pt inside diaphragm / Ps around diaphragm':instrument==='altimeter'?'Ps in case around sealed aneroid stack':'Ps to diaphragm and delayed case; calibrated leak stays internal'}</span>.</p>
    <h4>System teaching steps</h4>${lessonSteps(guided)}${lessonComponents(components,'Pitot-static system')}
    <p class="internal-note">Physical reference: Pt = Ps + q; q = ½ρV², fixed ρ = 1.225 kg/m³ and knots converted to m/s. Ps uses the existing altitude-dependent standard atmosphere. Existing simplified Phase 3 physics models are reused; ASI q remains independent of altitude.</p>
    <p class="internal-note">Educational VSI model: vertical speed controls a normalized pressure trend / internal lag around a moving reference; it never integrates altitude or changes absolute Ps. At zero input the trend is stable while a previous lag may still equalize. Reduced motion shows the settled lag immediately.</p>
    <p class="internal-note">Pressure paths, line geometry and port locations are simplified for teaching. Local fuselage pressure effects, compressibility, blockages, leaks, icing, failures and air-data computers are outside this phase. Conceptual geometry is not certified hardware.</p>
    </section>`;
  const system=panel.querySelector('.ps-system');
  bindLessonComponents(system,components);
  // A system step can emphasize both separate transmission paths without changing routing.
  system.querySelector('[data-step="3"]').addEventListener('click',()=>system.querySelectorAll('[data-component="pitot-line"]').forEach(part=>part.classList.add('component-active')));
  system.querySelector('[data-open-cutaway]').addEventListener('click',()=>{const tab=panel.closest('.internal-panel').querySelector('[role=tab][id$="-tab-cutaway"]');tab.click();tab.focus();});
  let lastFocus;
  return {
    setFocus(enabled) {
      if(lastFocus===enabled)return;
      lastFocus=enabled;
      const regions=focusedRegions(instrument);
      system.dataset.selectedInstrument=instrument;system.dataset.focus=String(enabled);
      system.querySelectorAll('[data-component]').forEach(part=>{
        const active=regions.includes(part.dataset.component);
        part.classList.toggle('ps-selected',enabled&&active);part.classList.toggle('ps-dimmed',enabled&&!active);
      });
      system.querySelector('[data-focus-note]').textContent=enabled?`Teaching Focus: ${titles[instrument]} pressure paths emphasized; other branches remain visible.`:'Teaching Focus off: all pressure paths shown equally.';
    },
    update(state,lag,reduced=false) {
      const m=systemState(state,lag);
      system.dataset.reducedMotion=String(reduced);
      for(const key of ['ps','q','pt','vsiDifferential','vsiIndicated'])system.dataset[key]=String(m[key]);
      const rate=value=>`${value>0?'+':''}${Math.round(value).toLocaleString('en-US')} ft/min`;
      const values={airspeed:`${Math.round(m.airspeed)} kt`,altitude:`${Math.round(m.altitude).toLocaleString('en-US')} ft`,verticalSpeed:rate(m.verticalSpeed),ps:`${(m.ps/1000).toFixed(1)} kPa`,q:`${Math.round(m.q).toLocaleString('en-US')} Pa`,pt:`${(m.pt/1000).toFixed(1)} kPa`,trend:m.trend,lag:`${(100*m.vsiDifferential).toFixed(1)}% relative scale`,indicated:rate(m.vsiIndicated)};
      for(const [key,value] of Object.entries(values)) {
        const output=system.querySelector(`[data-system-value="${key}"]`);
        if(output.textContent!==value)output.textContent=value;
      }
    }
  };
}
