import {createAsiInternalView} from './internal/asi/view.js';
import {variables,initialState,setVariable,smoothState} from './model.js';
import {instruments} from './catalog.js';
import {instrumentLinks,initialFocus,selectFocus,toggleFocus,linkedFocus} from './education.js';
let focus=initialFocus();
const target=initialState(),current=initialState();
const grid=document.querySelector('#instruments'),controls=document.querySelector('#controls');
const renderers=instruments.map((instrument,index)=>{const button=document.createElement('button');button.type='button';button.className='instrument';button.dataset.instrument=instrument.id;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Learn about the ${instrument.name}`);button.innerHTML=`<div class="drawing"></div><span class="instrument-name">${instrument.name}</span><span class="instrument-value"></span>`;grid.append(button);button.addEventListener('click',()=>select(instrument));return {update:instrument.create(button.querySelector('.drawing')),read:instrument.read,value:button.querySelector('.instrument-value')}});
const internalView=createAsiInternalView(document.querySelector('#asi-internal'));
let aircraftView;
let disposed = false;
function aircraftFailure(error) {
  console.error('Optional aircraft visualization failed:', error);
  const failedView = aircraftView;
  aircraftView = undefined;
  try {failedView?.dispose();} catch (disposeError) {console.error('Aircraft cleanup failed:', disposeError);}
  const panel = document.querySelector('.aircraft-panel');
  const status = panel?.querySelector('.aircraft-status');
  if (status) {
    status.hidden = false;
    status.textContent = '3D view unavailable. The cockpit instruments and controls remain active.';
  }
  panel?.querySelectorAll('canvas').forEach(canvas => {canvas.hidden = true;});
}
function updateAircraft(dt = 0) {
  try {aircraftView?.update(current, dt, motion.matches, linkedFocus(focus));} catch (error) {aircraftFailure(error);}
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) {
    disposed = true;
    try {aircraftView?.dispose();} catch (error) {console.error('Aircraft cleanup failed:', error);}
  }
});
const format=(v,value)=>`${Math.round(value).toLocaleString('en-US')}${v.unit==='°'?'':' '}${v.unit}`;
variables.forEach(v=>{const row=document.createElement('div');row.className='control';row.dataset.variable=v.key;row.innerHTML=`<div class="control-line"><label for="${v.key}">${v.label}</label><output for="${v.key}" id="${v.key}-value"></output></div><input id="${v.key}" type="range" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.initial}"><div class="limits"><span>${format(v,v.min)}</span><span>${format(v,v.max)}</span></div>`;controls.append(row);row.querySelector('output').textContent=format(v,v.initial);row.querySelector('input').addEventListener('input',event=>{setVariable(target,v.key,Number(event.target.value));row.querySelector('output').textContent=format(v,target[v.key]);current[v.key]=target[v.key];renderers.forEach(r=>{r.update(current);r.value.textContent=r.read(current)});internalView.update(current);updateAircraft()})});
function applyFocus() {
  const linked=linkedFocus(focus);
  document.querySelector('.workspace').classList.toggle('teaching-focus',focus.enabled);
  controls.querySelectorAll('[data-variable]').forEach(row=>{
    const active=linked.variables.includes(row.dataset.variable);
    row.classList.toggle('linked',active);
    row.querySelector('input').setAttribute('aria-describedby',active?'relationship':'control-guidance');
  });
  document.querySelectorAll('[data-flight]').forEach(field=>{
    const active=linked.variables.includes(field.dataset.flight);
    field.parentElement.classList.toggle('linked',active);
    if(active) field.setAttribute('aria-describedby','relationship');
    else field.removeAttribute('aria-describedby');
  });
  document.querySelectorAll('[data-cue]').forEach(field=>field.classList.toggle('linked',linked.variables.includes(field.dataset.cue)));
  document.querySelector('#focus-summary').textContent=focus.enabled ? `Focus: ${instruments.find(i=>i.id===focus.instrument).name}` : 'Full cockpit view';
  document.querySelector('#asi-internal').classList.toggle('focus-linked',focus.enabled&&focus.instrument==='airspeed');
  updateAircraft();
}
function select(instrument) {
  focus=selectFocus(focus,instrument.id);
  const link=instrumentLinks[instrument.id];
  grid.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.instrument === instrument.id));
  });
  document.querySelector('#info').innerHTML = `
    <p class="eyebrow">INSTRUMENT REFERENCE</p>
    <h2>${instrument.name} <span class="abbreviation">${instrument.abbr}</span></h2>
    <dl>
      <div><dt>Measured / indicated quantity</dt><dd>${instrument.quantity}</dd></div>
      <div><dt>Displayed unit</dt><dd>${instrument.unit}</dd></div>
      <div class="pilot-interpretation"><dt>Pilot interpretation</dt><dd>${instrument.interpretation}</dd></div>
    </dl>
    <h3>Linked flight variables</h3>
    <dl class="linked-explanation">
      <div><dt>Variables / controls</dt><dd>${link.variables.map(key=>variables.find(v=>v.key===key).label).join(' · ')}</dd></div>
      <div><dt>3D representation</dt><dd>${link.representation}</dd></div>
      <div><dt>Pilot meaning</dt><dd>${link.meaning}</dd></div>
    </dl>
    <p id="relationship">${link.relationship}</p>
    ${instrument.note ? `<div class="note">${instrument.note}</div>` : ''}
    ${instrument.id==='airspeed' ? '<button type="button" id="inside-instrument" aria-controls="asi-internal">Inside the Instrument</button>' : '<p class="internal-unavailable">Internal mechanism view will be added in a later phase.</p>'}`;
  internalView.select(instrument.id);
  internalView.update(current);
  document.querySelector('#inside-instrument')?.addEventListener('click',()=>internalView.open());
  applyFocus();
}
document.querySelector('#teaching-focus').addEventListener('change',event=>{
  focus=toggleFocus(focus,event.target.checked);applyFocus();
});
document.querySelector('#reset').addEventListener('click',()=>{Object.assign(target,initialState());Object.assign(current,target);renderers.forEach(r=>{r.update(current);r.value.textContent=r.read(current)});internalView.update(current);updateAircraft();variables.forEach(v=>{document.getElementById(v.key).value=target[v.key];document.getElementById(`${v.key}-value`).textContent=format(v,target[v.key])})});
const motion=matchMedia('(prefers-reduced-motion: reduce)');let last=performance.now();
select(instruments[0]);
function frame(now){const previousFrame=last;smoothState(current,target,(now-last)/1000,motion.matches);last=now;renderers.forEach(r=>{r.update(current);r.value.textContent=r.read(current)});internalView.update(current);updateAircraft((now-previousFrame)/1000);requestAnimationFrame(frame)}requestAnimationFrame(frame);

// Core controls, instruments and the frame loop are ready before optional imports.
// A failed module anywhere in the aircraft dependency graph cannot block startup.
import('./aircraft/view.js')
  .then(({createAircraftView}) => createAircraftView(document.querySelector('.aircraft-panel')))
  .then(view => {
    if (disposed) {view.dispose(); return;}
    aircraftView = view;
    updateAircraft();
  })
  .catch(aircraftFailure);
