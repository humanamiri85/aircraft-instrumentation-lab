// Optional lessons load independently after the cockpit is initialized.
// A broken dependency or renderer disables only its own lesson.
export const gyroInstruments=['attitude','heading','turn'];
const lessons=[
  ['airspeed','asi','createAsiInternalView',()=>import('./asi/view.js')],
  ['altimeter','altimeter','createAltimeterInternalView',()=>import('./altimeter/view.js')],
  ['vsi','vsi','createVsiInternalView',()=>import('./vsi/view.js')],
  ['attitude','attitude','createAttitudeInternalView',()=>import('./attitude/view.js')],
  ['heading','heading','createHeadingInternalView',()=>import('./heading/view.js')],
  ['turn','turn','createTurnInternalView',()=>import('./turn/view.js')],
  ['gyro','gyro','createGyroView',()=>import('./gyro/view.js')]
];
export function createInternalLessons() {
  const entries=new Map(lessons.map(([id,prefix,factory,load])=>[id,{panel:document.querySelector(`#${prefix}-internal`),factory,load}]));
  let selected='airspeed',focused=true,closed=false,state,lag,reduced=false;
  function fail(id,error) {
    const entry=entries.get(id);
    if(entry.failed)return;
    console.error(`Optional ${id} lesson failed:`,error);
    try {entry.view?.dispose?.();} catch(cleanupError) {console.error('Lesson cleanup failed:',cleanupError);}
    entry.view=undefined;entry.failed=true;
    // Preserve the section heading referenced by aria-labelledby, replacing partial content.
    const heading=document.createElement('h2');heading.id=entry.panel.getAttribute('aria-labelledby');
    heading.textContent=id==='gyro'?'Gyroscope Fundamentals':`${id==='airspeed'?'Airspeed':id[0].toUpperCase()+id.slice(1)} internal lesson`;
    const status=document.createElement('p');status.setAttribute('role','status');
    status.textContent='This internal lesson is unavailable. The cockpit, controls and other lessons remain usable.';
    entry.panel.replaceChildren(heading,status);
    entry.panel.hidden=id!==selected;
  }
  function run(id,action) {
    const entry=entries.get(id);
    if(entry.view&&!entry.failed)try {action(entry.view);} catch(error) {fail(id,error);}
  }
  function updateOne(id,dt=0) {
    if(!state)return;
    run(id,view=>{if(id==='gyro')view.update(state,dt,reduced);else view.update(state,lag,reduced,dt);view.updateExtension?.(state,lag,reduced);});
  }
  function applyFocus() {
    entries.forEach((entry,id)=>entry.panel.classList.toggle('focus-linked',focused&&(id===selected || id==='gyro'&&gyroInstruments.includes(selected))));
    run('gyro',view=>view.setFocus(focused&&gyroInstruments.includes(selected)));
    entries.forEach((entry,id)=>run(id,view=>view.setExtensionFocus?.(focused)));
  }
  function synchronize(id) {
    const entry=entries.get(id);
    run(id,view=>view.select(selected));
    if(entry.failed)entry.panel.hidden=id!==selected;
    updateOne(id);applyFocus();
    if(entry.pendingOpen){entry.pendingOpen=false;run(id,view=>view.open());updateOne(id);}
  }
  return {
    has(id) {return entries.has(id);},
    panelId(id) {return entries.get(id)?.panel.id;},
    start() {
      entries.forEach((entry,id)=>{
        entry.load().then(module=>{
          if(closed)return;
          entry.view=module[entry.factory](entry.panel);
          if(gyroInstruments.includes(id))entry.view.addLearningMode?.('chain','Measurement Chain',()=>import('../measurement/gyro/view.js').then(module=>body=>module.createGyroChainView(body,id)));
          if(['airspeed','altimeter','vsi'].includes(id))entry.view.addLearningMode?.('chain','Measurement Chain',()=>import('../measurement/pitot-static/view.js').then(module=>body=>module.createPitotStaticView(body,id)));
          synchronize(id);
        }).catch(error=>{if(!closed)fail(id,error);});
      });
    },
    select(id) {
      selected=id;
      // Cancel delayed opens from earlier selections; loading must never reveal a stale lesson.
      entries.forEach((entry,key)=>{entry.pendingOpen=false;synchronize(key);});
    },
    update(nextState,nextLag,motion,dt=0) {
      state=nextState;lag=nextLag;reduced=motion;
      // Hidden lessons need no DOM work or rotor animation. Selection refreshes from shared state.
      entries.forEach((entry,id)=>{if(!entry.panel.hidden)updateOne(id,dt);});
    },
    setFocus(enabled) {focused=enabled;applyFocus();},
    open(id=selected) {
      const entry=entries.get(id);
      if(!entry)return;
      if(!entry.view&&!entry.failed){entry.pendingOpen=true;return;}
      run(id,view=>view.open());updateOne(id);
    },
    dispose() {closed=true;entries.forEach((entry,id)=>run(id,view=>view.dispose?.()));}
  };
}
