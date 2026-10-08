import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from './js/model.js';
import {systemState} from './js/measurement/pitot-static/model.js';
import {initialLag,advanceLag,mechanismState} from './js/internal/vsi/model.js';
import {initialFault,activateFault,clearFault,setSeverity,transform,definitions} from './js/faults/pitot-static/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Normal exactly preserves healthy inputs across representative states',()=>{
 for(const airspeed of [40,110,180])for(const altitude of [0,5000,10000])for(const verticalSpeed of [-1000,0,1000]){
 const s={...initialState(),airspeed,altitude,verticalSpeed},lag=advanceLag(initialLag(),verticalSpeed,1),m=transform(s,initialFault(),lag),healthy=systemState(s,lag);
 assert.deepEqual(m.state,s);assert.deepEqual(m.physical,healthy);near(m.effective.asiPt,healthy.pt);near(m.effective.asiPs,healthy.ps);near(m.effective.altimeterPs,healthy.ps);near(m.effective.vsiPs,healthy.ps);near(m.effective.q,healthy.q);
 }});
test('Trapped pitot captures activation Pt, ignores subsequent airspeed and responds to live static pressure',()=>{
 const s=initialState(),f=activateFault(initialFault(),'blocked-pitot',s),m=transform({...s,airspeed:180},f);
 assert.notEqual(m.physical.pt,f.snapshot.pt);near(m.effective.asiPt,f.snapshot.pt);near(m.effective.asiPs,m.physical.ps);near(m.state.airspeed,110);
 const changed=transform({...s,altitude:7000},f);assert.notEqual(changed.effective.q,m.effective.q);near(changed.effective.altimeterPs,changed.physical.ps);near(changed.effective.vsiPs,changed.physical.ps);
 assert.deepEqual(definitions['blocked-pitot'].affected,['airspeed']);
});
test('Blocked static traps the shared Ps, holds altitude and settles the existing VSI lag',()=>{
 const s={...initialState(),altitude:3000,verticalSpeed:1000},f=activateFault(initialFault(),'blocked-static',s),m=transform({...s,altitude:7000,airspeed:180},f);
 assert.notEqual(m.physical.ps,f.snapshot.ps);for(const key of ['asiPs','altimeterPs','vsiPs'])near(m.effective[key],f.snapshot.ps);near(m.effective.asiPt,m.physical.pt);near(m.state.altitude,3000);assert.equal(m.state.verticalSpeed,0);
 let lag=advanceLag(initialLag(),1000,3);const before=lag.differential;for(let i=0;i<100;i++)lag=advanceLag(lag,m.state.verticalSpeed,.1);assert.ok(Math.abs(lag.differential)<before/100);assert.ok(Math.abs(mechanismState(lag,0).indicated)<2);
 assert.deepEqual(definitions['blocked-static'].affected,['airspeed','altimeter','vsi']);
});
test('Specified leak monotonically reduces differential pressure and preserves static branches',()=>{
 const s=initialState();let previous=Infinity;
 for(const severity of [0,.25,.5,.75,1]){const f=setSeverity(activateFault(initialFault(),'pitot-leak',s),severity),m=transform(s,f);assert.ok(m.effective.q<=previous);previous=m.effective.q;near(m.effective.q,(1-severity)*m.physical.q);near(m.effective.altimeterPs,m.physical.ps);near(m.effective.vsiPs,m.physical.ps);near(m.state.airspeed,110*Math.sqrt(1-severity));}
 near(previous,0);assert.deepEqual(definitions['pitot-leak'].affected,['airspeed']);
});
test('Clear and fresh activation never leak previous snapshots; physical state is immutable',()=>{
 for(const type of ['blocked-pitot','blocked-static','pitot-leak']){const s=Object.freeze(initialState()),f=activateFault(initialFault(),type,s),next={...s,altitude:7000,airspeed:180};const cleared=clearFault(f);assert.equal(cleared.snapshot,null);assert.deepEqual(transform(next,cleared).state,next);const again=activateFault(cleared,type,next);assert.equal(again.event,2);near(again.snapshot.ps,systemState(next,initialLag()).ps);}
});
test('Out-of-scale fault inputs are explicitly distinguished from valid airspeed inference',()=>{
 const s={...initialState(),altitude:10000},f=activateFault(initialFault(),'blocked-pitot',s),m=transform({...s,altitude:0},f);assert.ok(m.effective.q<0);assert.equal(m.state.airspeed,0);assert.match(m.scaleNote,/Negative differential/);
});

test('Fault attachments use existing comparison chain IDs and never route pitot to Altimeter or VSI',async()=>{
 const {chainAttachments}=await import('./js/faults/pitot-static/model.js');
 const {instruments}=await import('./js/measurement/comparison/model.js');
 for(const [type,attachments] of Object.entries(chainAttachments))for(const attachment of attachments){
 assert.ok(instruments[attachment.instrument].chain.some(link=>link.element===attachment.element));
 if(attachment.signal==='Pt')assert.equal(attachment.instrument,'airspeed');
 assert.deepEqual(attachment.components,definitions[type].elements);
 }
});
