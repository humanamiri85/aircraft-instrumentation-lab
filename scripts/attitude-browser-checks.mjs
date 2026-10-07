import {setControl} from './internal-browser-helpers.mjs';
import assert from 'node:assert/strict';
export async function checkAttitudeInternal(page,scenario) {
  const panel=page.locator('#attitude-internal');
  await page.locator('[data-instrument="attitude"]').click();
  await page.locator('#inside-instrument').click();
  assert.equal(await panel.isVisible(),true);
  const set=(key,value)=>setControl(page,key,value);
  const parts=async(root)=>root.locator('[data-part]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.part,n.getAttribute('transform')]));
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [pitch,bank] of [[15,0],[-15,0],[0,30],[0,-30],[10,30],[-10,-30]]) {
    await set('pitch',pitch);await set('bank',bank);
    const cockpit=page.locator('[data-instrument="attitude"]');
    const expected=await parts(cockpit);
    for(const face of ['.internal-face:not(.cutaway-face)','.cutaway-face'])assert.deepEqual(await parts(panel.locator(face)),expected);
    assert.equal(await panel.locator('[data-case="pitch"]').getAttribute('transform'),`rotate(${-pitch})`);
    assert.equal(await panel.locator('[data-case="bank"]').getAttribute('transform'),`rotate(${bank})`);
    assert.equal(await panel.locator('.cutaway-face [data-part="pitch"]').getAttribute('transform'),`translate(0 ${pitch*1.8})`);
    assert.equal(await panel.locator('.cutaway-face [data-part="bank"]').getAttribute('transform'),`rotate(${-bank} 100 100)`);
    assert.equal(await panel.getAttribute('data-reference'),'[0,1,0]');
    const relative=await panel.getAttribute('data-body-reference');
    for(const heading of [0,90,180,270,359]) {
      await set('heading',heading);
      assert.deepEqual(await parts(panel.locator('.cutaway-face')),expected);
      assert.equal(await panel.getAttribute('data-body-reference'),relative);
    }
    assert.equal(await panel.locator('[data-reading="input"]').textContent(),await panel.locator('[data-reading="display"]').textContent());
  }
  assert.equal(await page.locator('input[type=range]').count(),6);
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]) {
    await page.setViewportSize({width,height});
    for(const tab of ['face','cutaway','works']) {
      await panel.locator(`#attitude-tab-${tab}`).click();
      assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await panel.screenshot({path:`/tmp/phase3e-${scenario}-${name}.png`});
  }
  await panel.locator('#attitude-tab-face').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await panel.locator('#attitude-tab-cutaway').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');assert.equal(await panel.locator('#attitude-tab-works').getAttribute('aria-selected'),'true');
  for(const id of ['rotor','spin','inner','outer','case','horizon','aircraft','bankScale','ladder']) {
    const button=panel.locator(`[data-select-component="${id}"]`);await button.focus();await page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.ok(await panel.locator(`[data-component="${id}"].component-active`).count()>0);
    assert.ok(await panel.locator('.component-explanation').textContent());
  }
  for(let i=0;i<7;i++){await panel.locator(`[data-step="${i}"]`).click();assert.equal(await panel.locator(`[data-step="${i}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),false);
  await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),true);
  assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(r=>r.dataset.variable)),['pitch','bank']);
  await page.waitForTimeout(100);assert.equal(await panel.getAttribute('data-spin-phase'),'0');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
  const phase=await panel.getAttribute('data-spin-phase');await page.waitForTimeout(150);assert.notEqual(await panel.getAttribute('data-spin-phase'),phase);
  await page.locator('#reset').click();assert.equal(await panel.isVisible(),true);
  assert.equal(await panel.locator('#attitude-tab-works').getAttribute('aria-selected'),'true');
  assert.equal(await panel.locator('[data-case="pitch"]').getAttribute('transform'),'rotate(0)');
  assert.equal(await panel.locator('[data-case="bank"]').getAttribute('transform'),'rotate(0)');
  assert.equal(await panel.locator('[data-reading="display"]').textContent(),'Pitch 0° · Bank Wings Level');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-instrument="airspeed"]').click();assert.equal(await panel.isVisible(),false);
  await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS Phase 3E ${scenario}: pitch/bank signs, combined synchronization, stable vertical reference, heading independence, navigation, components, keyboard, focus, Reset, responsive and motion preferences`);
}
