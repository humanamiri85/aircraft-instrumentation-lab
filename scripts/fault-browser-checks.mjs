import assert from 'node:assert/strict';
const input=async(page,id,value)=>page.locator(`#${id}`).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const data=async(page)=>page.locator('#faults-internal').evaluate(el=>({...el.dataset}));
export async function checkFaults(page){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#reset').click();await page.locator('#pitot-static-faults').focus();await page.keyboard.press('Enter');
 const panel=page.locator('#faults-internal');await panel.locator('[data-activate]').waitFor();
 assert.equal((await data(page)).faultType,'normal');
 await page.locator('[data-instrument="attitude"]').click();await page.locator('#teaching-focus').check();assert.match(await panel.locator('[data-fault-focus]').textContent(),/does not use pitot-static/);assert.equal(await panel.locator('.ps-dimmed').count(),0);await page.locator('[data-instrument="airspeed"]').click();
 const activate=async type=>{await page.locator('#fault-type').selectOption(type);await panel.locator('[data-activate]').click();assert.equal((await data(page)).faultType,type);};
 const clear=async()=>{await panel.locator('[data-clear]').click();assert.equal((await data(page)).faultType,'normal');assert.match(await panel.locator('[data-snapshot]').textContent(),/No trapped/);assert.equal(await panel.locator('.fault-path').count(),0);};
 await activate('blocked-pitot');const pitot=await data(page);await input(page,'airspeed',180);let current=await data(page);assert.equal(current.asiPt,pitot.asiPt);assert.notEqual(current.livePt,pitot.livePt);assert.equal(current.asiPs,current.livePs);assert.equal(await panel.locator('[data-fault-instrument="altimeter"] strong').textContent(),'HEALTHY');
 await input(page,'altitude',7000);current=await data(page);assert.notEqual(current.q,pitot.q);await clear();
 await input(page,'altitude',3000);await input(page,'verticalSpeed',1000);await activate('blocked-static');const stat=await data(page);await input(page,'altitude',7000);current=await data(page);assert.equal(current.asiPs,stat.asiPs);assert.notEqual(current.livePs,stat.livePs);assert.equal(current.altimeterPs,stat.asiPs);assert.equal(current.vsiPs,stat.asiPs);assert.equal(await page.locator('[data-instrument="altimeter"] .instrument-value').textContent(),'3,000 ft');assert.equal(await page.locator('[data-instrument="vsi"] .instrument-value').textContent(),'0 ft/min');assert.notEqual(stat.event,pitot.event);await clear();
 await activate('pitot-leak');let previous=Infinity;for(const severity of [0,25,50,75,100]){await input(page,'leak-severity',severity);current=await data(page);assert.ok(Number(current.q)<=previous);previous=Number(current.q);assert.equal(current.altimeterPs,current.livePs);assert.equal(current.vsiPs,current.livePs);}assert.equal(previous,0);assert.equal(await page.locator('[data-instrument="airspeed"] .instrument-value').textContent(),'0 kt');
 for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`fault ${width}: overflow`);}
 await page.locator('#teaching-focus').uncheck();assert.match(await panel.locator('[data-fault-focus]').textContent(),/off/);await page.locator('#teaching-focus').check();
 await page.emulateMedia({reducedMotion:'no-preference'});await clear();await input(page,'verticalSpeed',1000);await page.waitForTimeout(500);await activate('blocked-static');await page.waitForTimeout(300);const first=Number((await panel.locator('[data-fault-value="10"]').textContent()).split(' ')[0]);await page.waitForTimeout(2000);const settled=Number((await panel.locator('[data-fault-value="10"]').textContent()).split(' ')[0]);assert.ok(Math.abs(settled)<Math.abs(first));
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#reset').click();assert.equal((await data(page)).faultType,'normal');assert.equal(await page.locator('#fault-type').inputValue(),'normal');assert.equal(await page.locator('#leak-severity').inputValue(),'50');await page.locator('#pitot-static-faults').click();
 console.log('PASS Phase 5A: cross-fault snapshots, effective inputs, symptoms, clearing, VSI settling, five widths, focus, Reset, keyboard and reduced motion');
}
export async function checkFaultIsolation(page,scenario){
 await page.locator('#pitot-static-faults').click();if(scenario==='fault-update-throws')await input(page,'airspeed',170);
 await page.locator('#faults-internal [role="status"]').filter({hasText:'unavailable'}).waitFor();
 await input(page,'airspeed',160);assert.equal(await page.locator('[data-instrument="airspeed"] .instrument-value').textContent(),'160 kt');
 await page.locator('[data-instrument="airspeed"]').click();await page.locator('#inside-instrument').click();await page.locator('#asi-tab-chain').click();await page.locator('#asi-panel-chain .ps-system').waitFor();await page.locator('#measurement-comparison').click();await page.locator('#comparison-internal h2').waitFor();await page.locator('#measurement-comparison').click();await page.locator('#reset').click();
}
