// One shared diagram moves between the cutaway and guided panels; IDs stay unique.
export function bindInternalNavigation(panel, {prefix, instrument, components}) {
  const mechanism = panel.querySelector('.internal-mechanism');
  const tabs = [...panel.querySelectorAll('[role=tab]')];
  function setView(id, focusTab=false) {
    tabs.forEach(tab=>{const active=tab.id===`${prefix}-tab-${id}`;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focusTab)tab.focus();});
    panel.querySelectorAll('[role=tabpanel]').forEach(body=>body.hidden=body.id!==`${prefix}-panel-${id}`);
    mechanism.hidden=id==='face';
    // One live diagram serves both cutaway and guided steps without duplicate SVG IDs.
    panel.querySelector(`#${prefix}-panel-${id}`).append(mechanism);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>setView(tab.id.replace(`${prefix}-tab-`,'')));
    tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%3;if(event.key==='ArrowLeft')next=(index+2)%3;if(event.key==='Home')next=0;if(event.key==='End')next=2;if(next!==undefined){event.preventDefault();setView(tabs[next].id.replace(`${prefix}-tab-`,''),true);}});
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
