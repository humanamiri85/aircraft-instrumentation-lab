import {setControl} from './internal-browser-helpers.mjs';
import assert from 'node:assert/strict';
export async function checkTurnInternal(page,scenario) {
  const panel=page.locator('#turn-internal');
  await page.locator('[data-instrument="turn"]').click();
  await page.locator('#inside-instrument').click();
  assert.equal(await panel.isVisible(),true);
  const set=(key,value)=>setControl(page,key,value);
  assert.equal(await panel.locator('.cutaway-face [data-part="references"] path').count(),2);
  const snapshot=async(bank)=>{
    await set('bank',bank);
    const angle=bank*2/3;
    for(const plane of [panel.locator('#turn-panel-face [data-part="plane"]'),panel.locator('.cutaway-face [data-part="plane"]'),page.locator('[data-instrument="turn"] [data-part="plane"]')]) {
      const transform=await plane.getAttribute('transform');
      assert.ok(Math.abs(Number(transform.match(/rotate\(([^ ]+)/)[1])-angle)<1e-8);
    }
    assert.equal(Number(await panel.getAttribute('data-gimbal-angle')),bank/45*18);
    assert.equal(await panel.locator('[data-gimbal]').getAttribute('transform'),`rotate(${bank/45*18})`);
    assert.equal(Number(await panel.getAttribute('data-spring-load')),Math.abs(bank/45));
    assert.equal(await panel.getAttribute('data-ball-offset'),'0');
    assert.equal(await panel.locator('.cutaway-face [data-part="ball"]').getAttribute('cx'),'100');
    assert.match(await panel.locator('[data-reading="output"]').textContent(),bank>0?/Right/:bank<0?/Left/:/Neutral/);
    return panel.locator('[data-spring]').getAttribute('d');
  };
  for(const motion of ['reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:motion});
    const neutral=await snapshot(0),right=await snapshot(20),left=await snapshot(-20);
    assert.notEqual(right,neutral);assert.notEqual(left,right);
    assert.match(await panel.locator('[data-spring-label]').textContent(),/Loaded/);
    for(const [key,value] of [['heading',359],['pitch',20],['airspeed',180],['altitude',10000],['verticalSpeed',-2000]]) {
      await set(key,value);assert.equal(await panel.getAttribute('data-gimbal-angle'),'-8');
      assert.equal(await panel.locator('[data-spring]').getAttribute('d'),left);
    }
    assert.equal(await snapshot(0),neutral);
    assert.match(await panel.locator('[data-spring-label]').textContent(),/Centered/);
    await snapshot(45);await snapshot(-45);
    if(motion==='reduce')assert.equal(await panel.getAttribute('data-spin-phase'),'0');
    else {const before=await panel.getAttribute('data-spin-phase');await page.waitForTimeout(150);assert.notEqual(await panel.getAttribute('data-spin-phase'),before);}
  }
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]) {
    await page.setViewportSize({width,height});
    for(const tab of ['face','cutaway','works']) {
      await panel.locator(`#turn-tab-${tab}`).click();
      assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await panel.screenshot({path:`/tmp/phase3g-${scenario}-${name}.png`});
  }
  await panel.locator('#turn-tab-face').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await panel.locator('#turn-tab-cutaway').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');assert.equal(await panel.locator('#turn-tab-chain').getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowLeft');assert.equal(await panel.locator('#turn-tab-works').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Home');assert.equal(await panel.locator('#turn-tab-face').getAttribute('aria-selected'),'true');
  await panel.locator('#turn-tab-works').click();
  for(const id of ['rotor','spin','gimbal','spring','case','linkage','shaft','marks','tube','ball']) {
    const button=panel.locator(`[data-select-component="${id}"]`);await button.focus();await page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.ok(await panel.locator(`[data-component="${id}"].component-active`).count()>0);
  }
  for(let i=0;i<7;i++) {await panel.locator(`#turn-panel-works [data-step="${i}"]`).click();assert.equal(await panel.locator(`#turn-panel-works [data-step="${i}"]`).getAttribute('aria-pressed'),'true');}
  await panel.locator('[data-select-component="marks"]').click();
  assert.equal(await panel.locator('.cutaway-face [data-part="references"]').evaluate(node=>node.classList.contains('component-active')),true);
  await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),false);
  await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),true);
  assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(r=>r.dataset.variable)),['bank']);
  await page.locator('#reset').click();assert.equal(await panel.isVisible(),true);
  assert.equal(await panel.getAttribute('data-gimbal-angle'),'0');assert.equal(await panel.getAttribute('data-spring-load'),'0');
  assert.equal(await panel.locator('#turn-tab-works').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('input[type=range]').count(),6);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS Phase 3G ${scenario}: signed restrained gyro, loaded spring and neutral return, shared symbols, independent variables/ball, navigation, focus, Reset, keyboard, responsive layouts and motion preferences`);
}
