import assert from 'node:assert/strict';
export async function checkHeadingInternal(page,scenario) {
  const panel=page.locator('#heading-internal');
  await page.locator('[data-instrument="heading"]').click();
  await page.locator('#inside-instrument').click();
  assert.equal(await panel.isVisible(),true);
  const set=async(key,value)=>page.locator(`#${key}`).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.emulateMedia({reducedMotion:'reduce'});
  const card=panel.locator('.cutaway-face [data-part="card"]');
  for(const heading of [0,90,180,270,358,359,0,1,2]) {
    const before=Number(await panel.getAttribute('data-case-angle'));
    await set('heading',heading);
    const expected=`rotate(${-heading} 100 100)`;
    assert.equal(await card.getAttribute('transform'),expected);
    assert.equal(await panel.locator('#heading-panel-face [data-part="card"]').getAttribute('transform'),expected);
    assert.equal(await page.locator('[data-instrument="heading"] [data-part="card"]').getAttribute('transform'),expected);
    assert.equal(await panel.locator('[data-reading="display"]').textContent(),`Compass card = ${String(heading).padStart(3,'0')}° under lubber line`);
    assert.equal(await page.locator('[data-flight="heading"]').textContent(),`${String(heading).padStart(3,'0')}°`);
    assert.equal(await panel.getAttribute('data-reference'),'[0,0,-1]');
    if([0,90,180,270].includes(heading)) {
      const label={0:'N',90:'E',180:'S',270:'W'}[heading];
      // Transform the actual rendered cardinal anchor into SVG coordinates.
      const position=await card.locator('text').filter({hasText:new RegExp(`^${label}$`)}).evaluate(node=>{
        const svg=node.ownerSVGElement,point=svg.createSVGPoint();
        point.x=Number(node.getAttribute('x'));point.y=Number(node.getAttribute('y'))-5;
        const p=point.matrixTransform(svg.getScreenCTM().inverse().multiply(node.getScreenCTM()));
        return {x:p.x,y:p.y};
      });
      assert.ok(Math.abs(position.x-100)<.01&&Math.abs(position.y-42)<.01,`${label} is under top lubber line`);
    }
    const after=Number(await panel.getAttribute('data-case-angle'));
    assert.ok(Math.abs(after-before)<=180);
    if(heading===0&&before%360===359)assert.equal(after-before,1);
    for(const [key,value] of [['pitch',20],['bank',45],['pitch',-20],['bank',-45]]) {
      await set(key,value);assert.equal(await card.getAttribute('transform'),expected);
      assert.equal(Number(await panel.getAttribute('data-case-angle')),after);
    }
  }
  await set('heading',0);const before=Number(await panel.getAttribute('data-case-angle'));
  await set('heading',359);assert.equal(Number(await panel.getAttribute('data-case-angle'))-before,-1);
  assert.equal(await page.locator('input[type=range]').count(),6);
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]) {
    await page.setViewportSize({width,height});
    for(const tab of ['face','cutaway','works']) {
      await panel.locator(`#heading-tab-${tab}`).click();
      assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await panel.screenshot({path:`/tmp/phase3f-${scenario}-${name}.png`});
  }
  await panel.locator('#heading-tab-face').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await panel.locator('#heading-tab-cutaway').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');assert.equal(await panel.locator('#heading-tab-works').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Home');assert.equal(await panel.locator('#heading-tab-face').getAttribute('aria-selected'),'true');
  await panel.locator('#heading-tab-works').click();
  for(const id of ['rotor','spin','inner','outer','case','reference','drive','card','lubber']) {
    const button=panel.locator(`[data-select-component="${id}"]`);await button.focus();await page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.ok(await panel.locator(`[data-component="${id}"].component-active`).count()>0);
  }
  for(let i=0;i<6;i++) {
    await panel.locator(`[data-step="${i}"]`).click();
    assert.equal(await panel.locator(`[data-step="${i}"]`).getAttribute('aria-pressed'),'true');
  }
  await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),false);
  await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),true);
  assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(r=>r.dataset.variable)),['heading']);
  assert.equal(await panel.getAttribute('data-spin-phase'),'0');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
  const phase=await panel.getAttribute('data-spin-phase');await page.waitForTimeout(150);
  assert.notEqual(await panel.getAttribute('data-spin-phase'),phase);
  await page.locator('#reset').click();
  assert.equal(await panel.isVisible(),true);
  assert.equal(await panel.locator('#heading-tab-works').getAttribute('aria-selected'),'true');
  assert.equal(await card.getAttribute('transform'),'rotate(-270 100 100)');
  assert.equal(await panel.locator('[data-reading="display"]').textContent(),'Compass card = 270° under lubber line');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-instrument="turn"]').click();assert.equal(await panel.isVisible(),false);
  assert.equal(await page.locator('#inside-instrument').count(),1);
  await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS Phase 3F ${scenario}: actual cardinal alignment, shared card/heading synchronization, north crossings, pitch/bank independence, navigation, components/steps, focus, Reset, responsive layouts and motion preferences`);
}
