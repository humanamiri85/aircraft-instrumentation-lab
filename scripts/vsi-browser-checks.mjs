import assert from 'node:assert/strict';
export async function checkVsiInternal(page,scenario){
 const panel=page.locator('#vsi-internal');
 const set=async(key,value)=>page.locator(`#${key}`).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const diff=async()=>Number(await panel.getAttribute('data-differential'));
 async function synchronized(){
  const indicated=Number(await panel.getAttribute('data-indicated'));
  const expected=-260+(indicated+2000)/4000*340;
  // Freeze animation for one atomic snapshot of the three pointer transforms.
  const angles=await page.evaluate(()=>[
   document.querySelector('[data-instrument="vsi"] [data-part="pointer"]'),
   document.querySelector('#vsi-internal .internal-face [data-part="pointer"]'),
   document.querySelector('#vsi-internal .cutaway-pointer')
  ].map(p=>Number(p.getAttribute('transform').match(/rotate\(([^ ]+)/)[1])));
  assert.equal(angles[0],angles[1]);assert.equal(angles[1],angles[2]);
  if(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches))assert.ok(Math.abs(angles[0]-expected)<1e-8);
 }
 await page.locator('[data-instrument="vsi"]').click();await page.locator('#reset').click();
 await page.locator('#teaching-focus').check();await page.locator('#inside-instrument').click();
 assert.equal(await panel.isVisible(),true);assert.equal(await page.locator('#altimeter-internal').isVisible(),false);
 assert.equal(await page.locator('input[type=range]').count(),6);
 assert.equal(await page.locator('#inside-instrument').getAttribute('aria-controls'),'vsi-internal');
 for(const speed of [-2000,0,2000]){
  await set('verticalSpeed',speed);assert.equal(await diff(),speed/2000);await synchronized();
  const shell=await panel.locator('[data-diaphragm]').getAttribute('d');
  assert.equal(Number(shell.match(/H([^Q]+)/)[1]),260-32*speed/2000);
  assert.equal((await panel.locator('.fast-trend').getAttribute('d'))==='',speed===0);
 }

 const before=await diff();for(const [key,value] of [['altitude',9000],['pitch',15],['airspeed',180]])await set(key,value);
 assert.equal(await diff(),before);
 await page.locator('#vsi-tab-works').click();assert.equal(await panel.locator('[data-step]').count(),7);
 for(let i=0;i<7;i++){const step=panel.locator(`[data-step="${i}"]`);await step.click();assert.equal(await step.getAttribute('aria-pressed'),'true');assert.equal(await panel.locator('.component-active').count(),1);}
 for(const button of await panel.locator('[data-select-component]').all()){await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');}
 await page.locator('#vsi-tab-works').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#vsi-tab-face').getAttribute('aria-selected'),'true');
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#vsi-tab-cutaway').getAttribute('aria-selected'),'true');
 await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),false);await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),true);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#reset').click();
 for(const speed of [1000,-1000]){
  await page.locator('#reset').click();await set('verticalSpeed',speed);
  await page.waitForFunction(sign=>sign*Number(document.querySelector('#vsi-internal').dataset.differential)>0.05,Math.sign(speed));
  assert.ok(Math.abs(await diff())<0.5);await synchronized();
  await page.waitForFunction(sign=>sign*Number(document.querySelector('#vsi-internal').dataset.differential)>0.4,Math.sign(speed));
  const peak=Math.abs(await diff());await set('verticalSpeed',0);
  assert.ok(Math.abs(await diff())>0.1);
  await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#vsi-internal').dataset.differential))<0.01);
  assert.ok(Math.abs(await diff())<peak);await synchronized();
  assert.equal(await page.locator('#altitude').inputValue(),'3500');
 }
 await page.locator('#reset').click();assert.equal(await diff(),0);
 await page.emulateMedia({reducedMotion:'reduce'});await set('verticalSpeed',1000);assert.equal(await diff(),0.5);await set('verticalSpeed',0);assert.equal(await diff(),0);
 assert.match(await panel.locator('[data-motion-note]').textContent(),/Reduced motion/);
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]){
  await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`/tmp/phase3c-${scenario}-${name}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1280,height:900});await page.locator('#reset').click();
 console.log(`PASS Phase 3C ${scenario}: lag, signed response, recovery, synchronized pointers, Reset, focus, independence, keyboard, responsive and reduced motion`);
}
