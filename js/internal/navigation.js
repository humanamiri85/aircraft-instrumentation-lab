export const learningModes = [['face','Instrument Face'],['cutaway','Internal Cutaway'],['works','How It Works']];

export function lessonTabs(prefix, title) {
  return `<div class="internal-tabs" role="tablist" aria-label="${title} learning views">${learningModes.map(([id,label],i)=>`<button type="button" role="tab" id="${prefix}-tab-${id}" aria-controls="${prefix}-panel-${id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${label}</button>`).join('')}</div>`;
}
export function lessonSteps(steps) {
  return `<ol class="internal-steps">${steps.map(([id,text],i)=>`<li><button type="button" data-step="${i}" data-step-component="${id}" aria-pressed="false"><strong>Step ${i+1}</strong> ${text}</button></li>`).join('')}</ol>`;
}
export function lessonComponents(components, title) {
  return `<div class="component-legend" role="group" aria-label="${title} components">${components.map(([id,label],i)=>`<button type="button" data-select-component="${id}" aria-pressed="false"><span>${i+1}</span> ${label}</button>`).join('')}</div><p class="component-explanation" role="status" aria-atomic="true">Select a component or teaching step.</p>`;
}

// One shared diagram moves between the cutaway and guided panels; IDs stay unique.
export function bindInternalNavigation(panel, {prefix, instrument, components}) {
  const mechanism = panel.querySelector('.internal-mechanism');
  const tabs = [...panel.querySelectorAll('[role=tab]')];
  panel.querySelectorAll('[role=tabpanel]').forEach(body=>body.tabIndex=0);
  panel.dataset.view='face';
  // Keep the live chain before component explanations in the reading order.
  const explanations=document.createElement('div');explanations.className='lesson-components';
  explanations.append(panel.querySelector('.component-legend'),panel.querySelector('.component-explanation'));
  mechanism.append(explanations);
  function setView(id, focusTab=false) {
    panel.dataset.view=id;
    tabs.forEach(tab=>{const active=tab.id===`${prefix}-tab-${id}`;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focusTab)tab.focus();});
    panel.querySelectorAll('[role=tabpanel]').forEach(body=>body.hidden=body.id!==`${prefix}-panel-${id}`);
    mechanism.hidden=id==='face';
    // One live diagram serves both cutaway and guided steps without duplicate SVG IDs.
    panel.querySelector(`#${prefix}-panel-${id}`).append(mechanism);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>setView(tab.id.replace(`${prefix}-tab-`,'')));
    tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();setView(tabs[next].id.replace(`${prefix}-tab-`,''),true);}});
  });
  function highlight(id) {
    panel.querySelectorAll('[data-component]').forEach(part=>part.classList.toggle('component-active',part.dataset.component===id));
    panel.querySelectorAll('[data-select-component]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.selectComponent===id)));
    panel.querySelector('.component-explanation').textContent=components.find(component=>component[0]===id)[2];
  }
  panel.querySelectorAll('[data-select-component]').forEach(button=>button.addEventListener('click',()=>{highlight(button.dataset.selectComponent);panel.querySelectorAll('[data-step]').forEach(step=>step.setAttribute('aria-pressed','false'));}));
  panel.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{highlight(button.dataset.stepComponent);panel.querySelectorAll('[data-step]').forEach(step=>step.setAttribute('aria-pressed',String(step===button)));}));
  return {
    select(id) {panel.hidden=id!==instrument;},
    open() {panel.hidden=false;setView('cutaway');panel.scrollIntoView({behavior:'auto',block:'start'});tabs[1].focus({preventScroll:true});}
  };
}
