import assert from 'node:assert/strict';
import {setControl,openInternal} from './internal-browser-helpers.mjs';
import {dynamicPressure} from '../js/internal/asi/model.js';
import {staticPressure} from '../js/internal/altimeter/model.js';
const lessons=[['airspeed','asi'],['altimeter','altimeter'],['vsi','vsi']];

export async function checkPitotStatic(page,scenario) {
  for(const motion of ['reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:motion});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.locator('#reset').click();
      await page.locator('#teaching-focus').check();
      for(const [instrument,prefix] of lessons) {
        const panel=await openInternal(page,instrument,prefix);
        await panel.locator(`#${prefix}-tab-cutaway`).focus();await page.keyboard.press('End');
        const system=panel.locator('.ps-system');await system.waitFor({state:'visible'});
        assert.equal(await panel.getAttribute('data-view'),'chain');
        assert.equal(await panel.locator('[role=tab][aria-selected=true]').getAttribute('id'),`${prefix}-tab-chain`);
        assert.equal(await panel.locator('[role=tabpanel]:visible').getAttribute('aria-labelledby'),`${prefix}-tab-chain`);
        assert.equal(await panel.locator('[role=tab][tabindex="0"]').count(),1);
        const svg=system.locator(width<=600?'.ps-vertical':'.ps-horizontal');
        assert.equal(await svg.isVisible(),true);
        assert.equal(await svg.locator('[data-component="pitot-line"]').evaluate(el=>el.classList.contains('ps-selected')),instrument==='airspeed');
        assert.equal(await svg.locator('[data-component="static-line"]').evaluate(el=>el.classList.contains('ps-selected')),true);
        for(const [destination] of lessons) {
          assert.equal(await svg.locator(`[data-component="${destination}-connection"]`).first().evaluate(el=>el.classList.contains('ps-selected')),destination===instrument);
        }
        // The topology itself, not just labels/focus, routes total pressure only to ASI.
        assert.equal(await svg.locator('.ps-total').count(),1);
        assert.equal(await svg.locator('[data-component="altimeter-connection"] .ps-total, [data-component="vsi-connection"] .ps-total').count(),0);
        const oldPs=Number(await system.getAttribute('data-ps'));
        await setControl(page,'airspeed',180);
        assert.equal(Number(await system.getAttribute('data-q')),dynamicPressure(180));
        assert.equal(Number(await system.getAttribute('data-ps')),oldPs);
        await setControl(page,'altitude',10000);
        assert.equal(Number(await system.getAttribute('data-ps')),staticPressure(10000));
        assert.equal(Number(await system.getAttribute('data-q')),dynamicPressure(180));
        const p=await system.evaluate(el=>({pt:Number(el.dataset.pt),ps:Number(el.dataset.ps),q:Number(el.dataset.q)}));
        assert.ok(Math.abs(p.pt-p.ps-p.q)<1e-9);
        for(const [speed,trend] of [[1000,'Decreasing'],[-1000,'Increasing'],[0,'Stable']]) {
          await setControl(page,'verticalSpeed',speed);
          assert.equal(await system.locator('[data-system-value="trend"]').textContent(),trend);
          assert.equal(Number(await system.getAttribute('data-ps')),p.ps);
          if(motion==='reduce')assert.equal(Number(await system.getAttribute('data-vsi-indicated')),speed);
        }
        if(instrument==='vsi'&&motion==='no-preference') {
          await setControl(page,'verticalSpeed',1000);
          await page.waitForFunction(()=>Number(document.querySelector('#vsi-internal .ps-system').dataset.vsiIndicated)>100);
          const differential=Number(await system.getAttribute('data-vsi-differential'));
          assert.ok(differential>0&&differential<0.5);
          assert.equal(await system.evaluate(el=>Number(el.dataset.vsiDifferential)===Number(el.closest('.internal-panel').dataset.differential)),true);
        }
        await page.locator('#teaching-focus').uncheck();
        assert.equal(await svg.locator('.ps-dimmed,.ps-selected').count(),0);
        await page.locator('#teaching-focus').check();
        await system.locator('[data-step="3"]').focus();await page.keyboard.press('Enter');
        assert.equal(await svg.locator('[data-component="static-line"]').evaluate(el=>el.classList.contains('component-active')),true);
        assert.equal(await svg.locator('[data-component="pitot-line"]').evaluate(el=>el.classList.contains('component-active')),true);
        await system.locator('[data-select-component="static-port"]').focus();await page.keyboard.press('Space');
        assert.equal(await system.locator('[data-select-component="static-port"]').getAttribute('aria-pressed'),'true');
        assert.match(await system.locator('.component-explanation').textContent(),/ambient static pressure/);
        if(width===1440&&motion==='reduce') {
          assert.equal(await system.locator('[data-step]').count(),6);
          assert.equal(await system.locator('[data-select-component]').count(),10);
          for(let step=0;step<6;step++) {
            await system.locator(`[data-step="${step}"]`).click();
            assert.equal(await system.locator(`[data-step="${step}"]`).getAttribute('aria-pressed'),'true');
            const id=await system.locator(`[data-step="${step}"]`).getAttribute('data-step-component');
            assert.equal(await svg.locator(`[data-component="${id}"]`).first().evaluate(el=>el.classList.contains('component-active')),true);
          }
          for(const component of await system.locator('[data-select-component]').all()) {
            await component.click();assert.equal(await component.getAttribute('aria-pressed'),'true');
            assert.ok((await system.locator('.component-explanation').textContent()).length>35);
          }
          await system.locator('[data-select-component="static-port"]').click();
        }
        await page.locator('#reset').click();
        assert.equal(await panel.getAttribute('data-view'),'chain');
        assert.equal(await system.locator('[data-select-component="static-port"]').getAttribute('aria-pressed'),'true');
        assert.equal(await system.locator('[data-system-value="airspeed"]').textContent(),'110 kt');
        assert.equal(await system.locator('[data-system-value="altitude"]').textContent(),'3,500 ft');
        assert.equal(await system.locator('[data-system-value="indicated"]').textContent(),'0 ft/min');
        assert.equal(await system.getAttribute('data-reduced-motion'),String(motion==='reduce'));
        const animation=await svg.locator('.ps-selected .ps-route').first().evaluate(el=>getComputedStyle(el).animationName);
        assert.equal(animation,motion==='reduce'?'none':'pressure-signal');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${instrument}/${width}: chain overflow`);
        const font=await svg.locator('text').first().evaluate(el=>{const scale=el.ownerSVGElement.getBoundingClientRect().width/el.ownerSVGElement.viewBox.baseVal.width;return parseFloat(getComputedStyle(el).fontSize)*scale;});
        assert.ok(font>=12,`${instrument}/${width}: readable diagram labels (${font})`);
        for(const mode of ['face','cutaway','works','chain']) {
          await panel.locator(`#${prefix}-tab-${mode}`).click();
          assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
          assert.equal(await panel.getAttribute('data-view'),mode);
        }
        await system.locator('[data-open-cutaway]').click();assert.equal(await panel.getAttribute('data-view'),'cutaway');
        await panel.locator(`#${prefix}-tab-chain`).click();
        if(scenario==='normal'&&motion==='reduce'&&instrument==='airspeed')await system.screenshot({path:`/tmp/phase4a-${width}.png`});
      }
      assert.deepEqual(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);}),[]);
    }
  }
  // Keep non-default values throughout a single ASI → Altimeter → VSI visit.
  await page.emulateMedia({reducedMotion:'reduce'});
  await setControl(page,'airspeed',180);await setControl(page,'altitude',5000);await setControl(page,'verticalSpeed',1000);
  for(const [instrument,prefix] of lessons) {
    const panel=await openInternal(page,instrument,prefix);await panel.locator(`#${prefix}-tab-chain`).click();
    const system=panel.locator('.ps-system');
    assert.equal(await system.getAttribute('data-selected-instrument'),instrument);
    assert.equal(Number(await system.getAttribute('data-q')),dynamicPressure(180));
    assert.equal(Number(await system.getAttribute('data-ps')),staticPressure(5000));
    assert.equal(Number(await system.getAttribute('data-vsi-indicated')),1000);
  }
  await page.locator('#reset').click();
  for(const prefix of ['attitude','heading','turn'])assert.equal(await page.locator(`#${prefix}-tab-chain`).count(),1);
  console.log(`PASS Phase 4A ${scenario}: shared routing, independent values/lag, four modes, cross-instrument focus, keyboard, Reset, five widths and both motion modes`);
}

export async function checkMeasurementIsolation(page,scenario) {
  const panel=await openInternal(page,'airspeed','asi');
  await panel.locator('#asi-tab-chain').click();
  if(scenario==='chain-update-throws') {
    await panel.locator('.ps-system').waitFor({state:'visible'});await setControl(page,'airspeed',160);
  }
  await panel.locator('#asi-panel-chain [role=status]').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#asi-panel-chain').textContent.includes('unavailable'));
  await panel.locator('#asi-tab-cutaway').click();await setControl(page,'airspeed',180);
  assert.equal(await panel.locator('[data-reading="face"]').textContent(),'180 kt');
  assert.equal(await page.locator('[data-instrument="airspeed"] .instrument-value').textContent(),'180 kt');
  const altimeter=await openInternal(page,'altimeter','altimeter');await setControl(page,'altitude',5000);
  assert.equal(await altimeter.locator('[data-reading="face"]').textContent(),'5,000 ft');
  console.log(`PASS ${scenario}: optional measurement failure preserves cockpit and internal lessons`);
}
