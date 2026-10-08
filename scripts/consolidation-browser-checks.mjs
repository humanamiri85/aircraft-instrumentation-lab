import assert from 'node:assert/strict';
import {setControl,openInternal} from './internal-browser-helpers.mjs';
const lessons=[
  ['airspeed','asi','airspeed',160,'160 kt'],
  ['altimeter','altimeter','altitude',7500,'7,500 ft'],
  ['vsi','vsi','verticalSpeed',1200,'+1,200 ft/min'],
  ['attitude','attitude','pitch',15,'15'],
  ['heading','heading','heading',90,'090'],
  ['turn','turn','bank',30,'Right']
];
export async function checkConsolidation(page,scenario) {
  for(const motion of ['reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:motion});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      for(const [instrument,prefix,key,value,expected] of lessons) {
        await page.locator('#reset').click();
        // Select/open entirely by keyboard, including roving tab navigation.
        await page.locator(`[data-instrument="${instrument}"]`).focus();await page.keyboard.press('Enter');
        await page.locator('#inside-instrument').focus();await page.keyboard.press('Enter');
        const panel=page.locator(`#${prefix}-internal`);
        const hasChain=['airspeed','altimeter','vsi'].includes(instrument);
        const lastMode=hasChain?'chain':'works';
        assert.equal(await panel.getAttribute('data-view'),'cutaway');
        assert.deepEqual(await panel.locator('[role=tab]').allTextContents(),['Instrument Face','Internal Cutaway','How It Works',...(hasChain?['Measurement Chain']:[])]);
        assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
        assert.equal(await page.locator('.internal-panel:not(#gyro-internal):visible').count(),1);
        const before=await panel.locator('[data-reading="face"]').textContent();
        await setControl(page,key,value);
        if(instrument==='vsi'&&motion==='no-preference') {
          // Verify the dynamic indication builds, rather than assuming settled reduced-motion values.
          await page.waitForFunction(()=>Number(document.querySelector('#vsi-internal').dataset.indicated)>100);
        } else assert.ok((await panel.locator('[data-reading="face"]').textContent()).includes(expected),`${instrument}: live reading`);
        assert.notEqual(await panel.locator('[data-reading="face"]').textContent(),before);
        await panel.locator('[role=tab][aria-selected=true]').focus();await page.keyboard.press('ArrowRight');
        assert.equal(await panel.getAttribute('data-view'),'works');
        const step=panel.locator(`#${prefix}-panel-works [data-step]`).nth(1);
        await step.focus();await page.keyboard.press('Space');
        assert.equal(await step.getAttribute('aria-pressed'),'true');
        const component=await step.getAttribute('data-step-component');
        assert.equal(await panel.locator(`.internal-mechanism [data-select-component="${component}"]`).getAttribute('aria-pressed'),'true');
        const explanation=await panel.locator('.internal-mechanism .component-explanation').textContent();assert.ok(explanation.length>20);
        await panel.locator('.internal-mechanism [data-select-component]').first().focus();await page.keyboard.press('Enter');
        assert.equal(await panel.locator(`#${prefix}-panel-works [data-step][aria-pressed=true]`).count(),0);
        await step.focus();await page.keyboard.press('Enter');
        await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(el=>el.classList.contains('focus-linked')),true);
        await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(el=>el.classList.contains('focus-linked')),false);
        await page.locator('#teaching-focus').check();
        // Reset must retain lesson navigation and component/step selection.
        await page.locator('#reset').click();
        assert.equal(await panel.getAttribute('data-view'),'works');assert.equal(await step.getAttribute('aria-pressed'),'true');
        if(instrument==='vsi')assert.equal(await panel.getAttribute('data-indicated'),'0');
        if(instrument==='turn'){assert.equal(await panel.getAttribute('data-gimbal-angle'),'0');assert.equal(await panel.getAttribute('data-spring-load'),'0');}
        await panel.locator('[role=tab][aria-selected=true]').focus();await page.keyboard.press('Home');
        assert.equal(await panel.getAttribute('data-view'),'face');
        assert.equal(await panel.locator('[role=tab][tabindex="0"]').count(),1);
        await page.keyboard.press('End');assert.equal(await panel.getAttribute('data-view'),lastMode);
        await page.keyboard.press('ArrowRight');assert.equal(await panel.getAttribute('data-view'),'face');
        // Inspect every mode at every width, with readable, scrollable mechanism geometry.
        for(const mode of ['cutaway','works','face']) {
          await panel.locator(`#${prefix}-tab-${mode}`).click();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${instrument}/${mode}/${width}: overflow`);
          const body=panel.locator('[role=tabpanel]:visible');
          assert.equal(await body.getAttribute('tabindex'),'0');
          assert.equal(await body.getAttribute('aria-labelledby'),`${prefix}-tab-${mode}`);
          if(mode!=='face') {
            assert.equal(await panel.locator('.internal-mechanism .component-explanation').isVisible(),true);
            assert.equal(await panel.locator('.internal-mechanism .measurement-chain').isVisible(),true);
            const scroll=panel.locator('.internal-mechanism .diagram-scroll');
            assert.equal(await scroll.evaluate(el=>getComputedStyle(el).overflowX),'auto');
          }
        }
        // Shared diagram moves between panels: no duplicate SVG IDs after repeated visits.
        assert.deepEqual(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);}),[]);
      }
    }
  }
  console.log(`PASS Phase 3H ${scenario}: sequential six lessons, five widths, both motion modes, keyboard, semantics, components/steps, focus and Reset`);
}
export async function checkLessonIsolation(page,scenario) {
  await page.locator('[data-instrument="turn"]').click();
  await page.locator('#inside-instrument').click();
  const panel=page.locator('#turn-internal');
  if(scenario==='lesson-update-throws')await setControl(page,'bank',30);
  await panel.locator('[role=status]').waitFor({state:'visible'});
  assert.match(await panel.textContent(),/unavailable/);
  await setControl(page,'airspeed',160);
  assert.equal(await page.locator('[data-instrument="airspeed"] .instrument-value').textContent(),'160 kt');
  const asi=await openInternal(page,'airspeed','asi');
  assert.equal(await asi.locator('[data-reading="face"]').textContent(),'160 kt');
  assert.equal(await panel.isVisible(),false);
  await page.locator('#reset').click();
  assert.equal(await asi.locator('[data-reading="face"]').textContent(),'110 kt');
  console.log(`PASS ${scenario}: cockpit and another internal lesson survive isolated failure`);
}
