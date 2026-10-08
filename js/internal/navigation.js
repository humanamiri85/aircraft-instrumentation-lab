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

export function bindLessonComponents(panel, components) {
  const parts=[...panel.querySelectorAll('[data-component]')],buttons=[...panel.querySelectorAll('[data-select-component]')],steps=[...panel.querySelectorAll('[data-step]')];
  const explanation=panel.querySelector('.component-explanation');
  function highlight(id) {
    const component=components.find(component=>component[0]===id);
    if(!component)return;
    parts.forEach(part=>part.classList.toggle('component-active',part.dataset.component===id));
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.selectComponent===id)));
    explanation.textContent=component[2];
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{highlight(button.dataset.selectComponent);steps.forEach(step=>step.setAttribute('aria-pressed','false'));}));
  steps.forEach(button=>button.addEventListener('click',()=>{highlight(button.dataset.stepComponent);steps.forEach(step=>step.setAttribute('aria-pressed',String(step===button)));}));
}

// One shared diagram moves between the cutaway and guided panels; IDs stay unique.
export function bindInternalNavigation(panel, {prefix, instrument, components}) {
  const mechanism = panel.querySelector('.internal-mechanism');
  const tabs = [...panel.querySelectorAll('[role=tab]')];
  let extension, latest, focused=true;
  function extensionFailure(error) {
    if(extension.failed)return;
    extension.failed=true;
    console.error('Optional Measurement Chain failed:',error);
    extension.view=undefined;
    extension.body.innerHTML='<p role="status">Measurement Chain is unavailable. The cockpit and existing internal lessons remain usable.</p>';
  }
  function refreshExtension() {
    if(!extension?.view||extension.failed||!latest)return;
    try {extension.view.setFocus(focused);extension.view.update(...latest);} catch(error) {extensionFailure(error);}
  }
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
    mechanism.hidden=id==='face'||id===extension?.id;
    // One live diagram serves both cutaway and guided steps without duplicate SVG IDs.
    if(id!==extension?.id)panel.querySelector(`#${prefix}-panel-${id}`).append(mechanism);
    if(id===extension?.id) {
      if(!extension.started) {
        extension.started=true;
        extension.load().then(factory=>{extension.view=factory(extension.body);refreshExtension();}).catch(extensionFailure);
      }
      refreshExtension();
    }
  }
  function bindTab(tab,index) {
    tab.addEventListener('click',()=>setView(tab.id.replace(`${prefix}-tab-`,'')));
    tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();setView(tabs[next].id.replace(`${prefix}-tab-`,''),true);}});
  }
  tabs.forEach(bindTab);
  bindLessonComponents(panel,components);
  return {
    addLearningMode(id,label,load) {
      const tab=document.createElement('button');tab.type='button';tab.setAttribute('role','tab');
      tab.id=`${prefix}-tab-${id}`;tab.textContent=label;tab.setAttribute('aria-controls',`${prefix}-panel-${id}`);tab.setAttribute('aria-selected','false');tab.tabIndex=-1;
      const body=document.createElement('div');body.id=`${prefix}-panel-${id}`;body.setAttribute('role','tabpanel');body.setAttribute('aria-labelledby',tab.id);body.tabIndex=0;body.hidden=true;
      body.innerHTML='<p role="status">Loading measurement chain…</p>';
      extension={id,body,load};panel.querySelector('.internal-tabs').append(tab);panel.append(body);tabs.push(tab);bindTab(tab,tabs.length-1);
    },
    updateExtension(state,lag,reduced) {latest=[state,lag,reduced];if(panel.dataset.view===extension?.id)refreshExtension();},
    setExtensionFocus(enabled) {focused=enabled;if(panel.dataset.view===extension?.id)refreshExtension();},
    select(id) {panel.hidden=id!==instrument;},
    open() {panel.hidden=false;setView('cutaway');panel.scrollIntoView({behavior:'auto',block:'start'});tabs[1].focus({preventScroll:true});}
  };
}
