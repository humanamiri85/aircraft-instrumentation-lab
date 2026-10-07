import assert from 'node:assert/strict';

export async function checkAsiInternal(page, scenario) {
  await page.locator('[data-instrument="airspeed"]').click();
  await page.locator('#reset').click();
  await page.locator('#teaching-focus').check();
  await page.locator('#inside-instrument').click();
  const panel=page.locator('#asi-internal');
  assert.equal(await panel.isVisible(),true);
  assert.equal(await page.locator('#asi-tab-cutaway').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#asi-panel-cutaway .internal-mechanism').isVisible(),true);
  assert.equal(await page.locator('input[type=range]').count(),6);
  async function set(key,value) {
    await page.locator(`#${key}`).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  }
  async function snapshot(ias) {
    assert.equal(await page.locator('[data-instrument="airspeed"] .instrument-value').textContent(),`${ias} kt`);
    assert.equal(await panel.locator('[data-reading="pointer"]').textContent(),`${ias} kt`);
    const cockpit=await page.locator('[data-instrument="airspeed"] [data-part="pointer"]').getAttribute('transform');
    const cutaway=await panel.locator('.cutaway-pointer').getAttribute('transform');
    const angle=Number(cockpit.match(/rotate\(([^ ]+)/)[1]);
    assert.equal(Number(cutaway.match(/rotate\(([^ ]+)/)[1]),angle);
    const pressure=Number(await panel.getAttribute('data-pressure'));
    assert.ok(Math.abs(pressure-0.5*1.225*(ias*1852/3600)**2)<1e-8);
    return {pressure,deflection:Number(await panel.getAttribute('data-deflection')),link:await panel.locator('.connecting-link').getAttribute('d'),capsule:await panel.locator('.capsule-shell').getAttribute('d'),angle};
  }
  const middle=await snapshot(110);
  await set('airspeed',40);const low=await snapshot(40);
  await set('airspeed',180);const high=await snapshot(180);
  for(const key of ['pressure','deflection','angle'])assert.ok(low[key]<middle[key]&&middle[key]<high[key],key);
  assert.notEqual(low.link,high.link);assert.notEqual(low.capsule,high.capsule);
  await set('altitude',10000);assert.deepEqual(await snapshot(180),high);
  await page.locator('#asi-tab-face').click();
  assert.equal(await panel.locator('.internal-face').isVisible(),true);
  assert.equal(await panel.locator('[data-reading="face"]').textContent(),'180 kt');
  assert.equal(await panel.locator('.internal-face [data-part="pointer"]').getAttribute('transform'),`rotate(${high.angle} 100 100)`);
  assert.equal(await panel.locator('.internal-mechanism').isVisible(),false);
  await page.locator('#asi-tab-works').click();
  for(let step=0;step<6;step++){
    const button=panel.locator(`[data-step="${step}"]`);await button.click();
    const component=await button.getAttribute('data-step-component');
    assert.equal(await panel.locator(`[data-component="${component}"]`).getAttribute('class')?.then(value=>value?.includes('component-active')),true);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
  }
  await panel.locator('[data-select-component="capsule"]').focus();await page.keyboard.press('Enter');
  assert.match(await panel.locator('.component-explanation').textContent(),/pressure difference/);
  await page.locator('#asi-tab-works').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('#asi-tab-face').getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#asi-tab-cutaway').getAttribute('aria-selected'),'true');
  assert.equal(await panel.evaluate(node=>node.classList.contains('focus-linked')),true);
  assert.equal(await page.locator('[data-variable="airspeed"]').evaluate(node=>node.classList.contains('linked')),true);
  if(scenario==='normal')assert.equal(await page.locator('canvas').getAttribute('data-focused-cues'),'airspeed');
  await page.locator('#teaching-focus').uncheck();
  assert.equal(await panel.evaluate(node=>node.classList.contains('focus-linked')),false);
  await page.locator('#reset').click();await snapshot(110);
  assert.equal(await page.locator('#asi-tab-cutaway').getAttribute('aria-selected'),'true');
  for(const reducedMotion of ['no-preference','reduce']){
    await page.emulateMedia({reducedMotion});await set('airspeed',40);await snapshot(40);await set('airspeed',180);await snapshot(180);await page.locator('#reset').click();await snapshot(110);
  }
  await page.locator('#asi-tab-works').click();
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: internal panel overflow`);
    assert.equal(await panel.locator('[data-select-component="capsule"]').isVisible(),true);
    if(scenario==='normal')await page.screenshot({path:`/tmp/phase3a-${name}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-instrument="turn"]').click();
  assert.equal(await panel.isVisible(),false);
  assert.equal(await page.locator('#turn-internal').isVisible(),true);
  await page.locator('[data-instrument="airspeed"]').click();
  assert.equal(await panel.isVisible(),true);await snapshot(110);
  await page.locator('[data-instrument="attitude"]').click();
  console.log(`PASS Phase 3A ${scenario}: synchronized pressure/mechanism, tabs, steps, keyboard, focus, Reset, independent altitude, responsive and reduced-motion views`);
}
