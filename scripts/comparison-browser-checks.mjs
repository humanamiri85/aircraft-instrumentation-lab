import assert from 'node:assert/strict';
import {setControl,openInternal} from './internal-browser-helpers.mjs';
import {instruments,families,liveState,liveValues} from '../js/measurement/comparison/model.js';
import {presets} from '../js/measurement/comparison/content.js';
import {initialState} from '../js/model.js';
const state={airspeed:160,altitude:7500,verticalSpeed:1200,pitch:8,bank:-20,heading:275};
async function assertPair(page,left,right) {
  const system=page.locator('.cmp-system');
  for(const [side,id] of [['left',left],['right',right]]) {
    const m=instruments[id],card=system.locator(`[data-comparison-side="${side}"]`);
    assert.equal(await card.getAttribute('data-selected-instrument'),id);
    assert.equal(await card.getAttribute('data-family'),m.family);
    assert.equal(await card.getAttribute('data-inferred'),String(m.isInferred));
    assert.equal(await card.getAttribute('data-reference'),m.referenceType||'none');
    assert.equal(await card.getAttribute('data-pressure-inputs'),m.pressureInputs.join(','));
    assert.deepEqual(await card.locator('.cmp-badges span').allTextContents(),m.badges);
    assert.equal(await card.locator('.cmp-layers>div').count(),8);
    const measured=system.locator(`[data-measured-pair] [data-measured="${side}"]`);
    assert.equal(await measured.getAttribute('data-measured-id'),id);
    assert.equal(await measured.locator('[data-direct-quantity]').textContent(),m.directlySensedQuantity);
    if(id==='turn')assert.match(await measured.textContent(),/Bank proxy.*not the actual measurand/);
    const expected=liveValues(id,liveState(state,{differential:.6}));
    // In normal motion the shared VSI may still be settling; compare it to the cockpit below.
    for(const [key,_label,value] of expected)if(!['lag','indicated'].includes(key))assert.equal(await card.locator(`[data-comparison-value="${key}"]`).textContent(),value,`${id}/${key}`);
  }
}
export async function checkComparison(page,scenario) {
  for(const [key,value] of Object.entries(state))await setControl(page,key,value);
  const button=page.locator('#measurement-comparison');await button.focus();await page.keyboard.press('Enter');
  const panel=page.locator('#comparison-internal'),system=panel.locator('.cmp-system');await system.waitFor({state:'visible'});
  assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#comparison-left').evaluate(el=>el===document.activeElement),true);
  assert.equal(await panel.locator('h2').textContent(),'Measurement Chain Comparison');
  assert.equal(await system.locator('[data-measured="overview"]').count(),6);
  assert.deepEqual(await system.locator('.cmp-family h3').allTextContents(),['Pitot-static family','Gyroscopic family']);
  for(const motion of ['reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:motion});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      // ASI vs AI → Altimeter vs HI → VSI vs TC in one session at every width.
      for(let i=0;i<presets.length;i++) {
        await system.locator(`[data-preset="${i}"]`).focus();await page.keyboard.press('Enter');
        const {left,right}=presets[i];assert.equal(await page.locator('#comparison-left').inputValue(),left);assert.equal(await page.locator('#comparison-right').inputValue(),right);
        await assertPair(page,left,right);assert.equal(await system.locator('[data-preset][aria-pressed=true]').count(),1);
        assert.equal(await system.locator('[data-preset-explanation]').textContent(),presets[i].explanation);
      }
      // All nine independent selector pairings must work without changing controls.
      const before=await page.locator('#controls input').evaluateAll(nodes=>nodes.map(n=>n.value));
      for(const left of families['pitot-static'])for(const right of families.gyroscopic) {
        await page.locator('#comparison-left').selectOption(left);await page.locator('#comparison-right').selectOption(right);await assertPair(page,left,right);
      }
      assert.deepEqual(await page.locator('#controls input').evaluateAll(nodes=>nodes.map(n=>n.value)),before);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${scenario}/${width}: overflow`);
      const left=await system.locator('[data-comparison-side="left"]').boundingBox(),right=await system.locator('[data-comparison-side="right"]').boundingBox();
      if(width>=1024)assert.ok(right.x>left.x&&Math.abs(left.y-right.y)<1);if(width<=390)assert.ok(right.y>left.y&&Math.abs(left.x-right.x)<1);
      assert.ok(await system.locator('.cmp-layers dd').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=12);
      assert.equal(await system.evaluate(el=>el.getAnimations({subtree:true}).length),0);
      assert.equal(await system.getAttribute('data-reduced-motion'),String(motion==='reduce'));
      await page.locator('#teaching-focus').uncheck();assert.equal(await system.locator('.cmp-focused').count(),0);assert.equal(await system.getAttribute('data-focus'),'false');
      await page.locator('#teaching-focus').check();assert.equal(await system.locator('.cmp-focused').count(),2);
      if(motion==='reduce')await system.locator('[data-measured-pair]').screenshot({path:`/tmp/phase4c-${scenario}-${width}.png`});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#comparison-left').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
  assert.equal(await page.locator('#comparison-left').inputValue(),'altimeter');
  await page.locator('#comparison-right').focus();await page.keyboard.press('End');await page.keyboard.press('Tab');assert.equal(await page.locator('#comparison-right').inputValue(),'turn');
  await system.locator('[data-preset="2"]').click();
  // Comparison must show the actual shared dynamic VSI indication, not its input or a second lag.
  await setControl(page,'verticalSpeed',-1200);
  await page.waitForFunction(()=>{
    const read=selector=>Number(document.querySelector(selector).textContent.replaceAll(',','').replace(' ft/min',''));
    return read('[data-comparison-value="indicated"]')===read('[data-instrument="vsi"] .instrument-value')&&read('[data-comparison-value="indicated"]')<0;
  });
  // Independent orientation changes do not alter the TC response.
  const response=await system.locator('[data-comparison-value="deflection"]').textContent();await setControl(page,'heading',359);await setControl(page,'pitch',20);
  assert.equal(await system.locator('[data-comparison-value="deflection"]').textContent(),response);
  await system.locator('[data-preset="0"]').click();
  const attitude=await system.locator('[data-comparison-side="right"] .ps-live').textContent();await setControl(page,'heading',0);assert.equal(await system.locator('[data-comparison-side="right"] .ps-live').textContent(),attitude);
  await system.locator('[data-preset="1"]').click();const heading=await system.locator('[data-comparison-value="heading"]').textContent();await setControl(page,'bank',45);await setControl(page,'pitch',-20);assert.equal(await system.locator('[data-comparison-value="heading"]').textContent(),heading);
  await system.locator('[data-preset="2"]').click();await page.locator('#reset').click();
  assert.equal(await page.locator('#comparison-left').inputValue(),'vsi');assert.equal(await page.locator('#comparison-right').inputValue(),'turn');
  const reset=liveState(initialState(),{differential:0});
  for(const id of ['vsi','turn'])for(const [key,_label,value] of liveValues(id,reset))assert.equal(await system.locator(`[data-comparison-value="${key}"]`).textContent(),value);
  const question=system.locator('section[aria-labelledby="comparison-think-title"] details').first();await question.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await question.getAttribute('open'),'');assert.match(await question.locator('p').textContent(),/static pressure.*altitude is inferred/);
  await panel.locator('[data-close-comparison]').focus();await page.keyboard.press('Enter');assert.equal(await panel.isVisible(),false);assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await button.evaluate(el=>el===document.activeElement),true);
  await button.click();await system.waitFor({state:'visible'});assert.equal(await page.locator('#comparison-left').inputValue(),'vsi');await button.click();assert.equal(await panel.isVisible(),false);
  console.log(`PASS Phase 4C ${scenario}: all nine pairs and presets, metadata/measurands, exact live values/shared lag, independence, keyboard, focus, Reset, five widths and both motion modes`);
}
export async function checkComparisonIsolation(page,scenario) {
  await page.locator('#measurement-comparison').click();const panel=page.locator('#comparison-internal');
  if(scenario==='comparison-update-throws'){await panel.locator('[data-comparison-injected]').waitFor({state:'visible'});await setControl(page,'airspeed',170);}
  await page.waitForFunction(()=>!document.querySelector('#comparison-internal').hidden&&document.querySelector('#comparison-internal').textContent.includes('unavailable'));
  assert.match(await panel.textContent(),/cockpit, controls and other lessons remain usable/);
  await page.locator('#measurement-comparison').click();assert.equal(await panel.isVisible(),false);
  const asi=await openInternal(page,'airspeed','asi');await asi.locator('#asi-tab-chain').click();await asi.locator('.ps-system').waitFor({state:'visible'});await setControl(page,'airspeed',160);assert.equal(await asi.locator('[data-system-value="airspeed"]').textContent(),'160 kt');
  const hi=await openInternal(page,'heading','heading');await hi.locator('#heading-tab-chain').click();await hi.locator('.gc-system').waitFor({state:'visible'});await setControl(page,'heading',359);assert.equal(await hi.locator('[data-gyro-value="heading"]').textContent(),'359°');
  const ai=await openInternal(page,'attitude','attitude');await setControl(page,'pitch',20);assert.equal(await ai.locator('[data-case="pitch"]').getAttribute('transform'),'rotate(-20)');
  console.log(`PASS ${scenario}: comparison fault preserves cockpit, both chain families and original internal lessons`);
}
