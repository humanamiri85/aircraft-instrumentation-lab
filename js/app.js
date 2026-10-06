import {variables,initialState,setVariable,smoothState} from './model.js';
import {instruments} from './catalog.js';
const target=initialState(),current=initialState();
const grid=document.querySelector('#instruments'),controls=document.querySelector('#controls');
const renderers=instruments.map((instrument,index)=>{const button=document.createElement('button');button.type='button';button.className='instrument';button.dataset.instrument=instrument.id;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Learn about the ${instrument.name}`);button.innerHTML=`<div class="drawing"></div><span class="instrument-name">${instrument.name}</span><span class="instrument-value"></span>`;grid.append(button);button.addEventListener('click',()=>select(instrument));return {update:instrument.create(button.querySelector('.drawing')),read:instrument.read,value:button.querySelector('.instrument-value')}});
const format=(v,value)=>`${Math.round(value).toLocaleString('en-US')}${v.unit==='°'?'':' '}${v.unit}`;
variables.forEach(v=>{const row=document.createElement('div');row.className='control';row.innerHTML=`<div class="control-line"><label for="${v.key}">${v.label}</label><output for="${v.key}" id="${v.key}-value"></output></div><input id="${v.key}" type="range" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.initial}"><div class="limits"><span>${format(v,v.min)}</span><span>${format(v,v.max)}</span></div>`;controls.append(row);row.querySelector('output').textContent=format(v,v.initial);row.querySelector('input').addEventListener('input',event=>{setVariable(target,v.key,Number(event.target.value));row.querySelector('output').textContent=format(v,target[v.key])})});
function select(instrument) {
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
    ${instrument.note ? `<div class="note">${instrument.note}</div>` : ''}`;
}
select(instruments[0]);
document.querySelector('#reset').addEventListener('click',()=>{Object.assign(target,initialState());variables.forEach(v=>{document.getElementById(v.key).value=target[v.key];document.getElementById(`${v.key}-value`).textContent=format(v,target[v.key])})});
const motion=matchMedia('(prefers-reduced-motion: reduce)');let last=performance.now();
function frame(now){smoothState(current,target,(now-last)/1000,motion.matches);last=now;renderers.forEach(r=>{r.update(current);r.value.textContent=r.read(current)});requestAnimationFrame(frame)}requestAnimationFrame(frame);
