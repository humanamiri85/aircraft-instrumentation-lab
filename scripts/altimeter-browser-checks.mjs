import {setControl} from './internal-browser-helpers.mjs';
import assert from 'node:assert/strict';

export async function checkAltimeterInternal(page,scenario) {
  await page.locator('[data-instrument="altimeter"]').click();
  await page.locator('#reset').click();
  await page.locator('#teaching-focus').check();
  await page.locator('#inside-instrument').click();
  const panel=page.locator('#altimeter-internal');
  assert.equal(await panel.isVisible(),true);
  assert.equal(await page.locator('#asi-internal').isVisible(),false);
  assert.equal(await page.locator('#inside-instrument').getAttribute('aria-controls'),'altimeter-internal');
  assert.equal(await page.locator('input[type=range]').count(),6);
  const set=(key,value)=>setControl(page,key,value);
  async function snapshot(feet){
    const label=`${feet.toLocaleString('en-US')} ft`;
    assert.equal(await page.locator('[data-instrument="altimeter"] .instrument-value').textContent(),label);
    for(const key of ['face','altitude','pointer'])assert.equal(await panel.locator(`[data-reading="${key}"]`).textContent(),label);
    const angles={hundreds:feet/1000*360,thousands:feet/10000*360,tenThousands:feet/100000*360};
    for(const [key,angle] of Object.entries(angles)){
      assert.equal(await page.locator(`[data-instrument="altimeter"] [data-part="${key}"]`).getAttribute('transform'),`rotate(${angle} 100 100)`);
      assert.equal(await panel.locator(`.internal-face [data-part="${key}"]`).getAttribute('transform'),`rotate(${angle} 100 100)`);
      assert.equal(await panel.locator(`[data-cutaway-pointer="${key}"]`).getAttribute('transform'),`rotate(${angle} 620 190)`);
      assert.equal(Number(await panel.locator(`[data-output-shaft="${key}"]`).getAttribute('data-angle')),angle);
      assert.equal(Number((await panel.locator(`[data-output-gear="${key}"]`).getAttribute('transform')).match(/rotate\(([^ ]+)/)[1]),angle);
    }
    const pressure=Number(await panel.getAttribute('data-pressure'));
    assert.ok(Math.abs(pressure-101325*(1-0.0065*(feet*0.3048)/288.15)**(9.80665/(287.05*0.0065)))<1e-8);
    assert.equal(await panel.locator('[data-reading="pressure"]').textContent(),`${(pressure/1000).toFixed(1)} kPa`);
    const expansion=Number(await panel.getAttribute('data-expansion'));
    assert.equal(await panel.locator('[data-reading="expansion"]').textContent(),`${Math.round(expansion*100)}% visual scale`);
    return {pressure,expansion,wafer:await panel.locator('[data-wafer="2"]').getAttribute('d'),link:await panel.locator('.connecting-link').getAttribute('d'),lever:await panel.locator('.lever').getAttribute('d')};
  }
  assert.equal(await page.locator('#altimeter-tab-cutaway').getAttribute('aria-selected'),'true');
  await set('altitude',0);const low=await snapshot(0);
  await set('altitude',5000);const middle=await snapshot(5000);
  await set('altitude',10000);const high=await snapshot(10000);
  assert.ok(low.pressure>middle.pressure&&middle.pressure>high.pressure);
  assert.equal(low.expansion,0);assert.equal(high.expansion,1);
  assert.ok(low.expansion<middle.expansion&&middle.expansion<high.expansion);
  for(const key of ['wafer','link','lever']){assert.notEqual(low[key],middle[key]);assert.notEqual(middle[key],high[key]);}
  // Decreasing altitude reverses the same mechanism, without lag or hysteresis.
  await set('altitude',0);assert.deepEqual(await snapshot(0),low);
  await set('altitude',5000);
  for(const [key,value] of [['verticalSpeed',2000],['pitch',20],['airspeed',180],['bank',45],['heading',359]]){
    await set(key,value);assert.deepEqual(await snapshot(5000),middle);
  }
  // Altitude must not change the fixed-density ASI mechanism.
  const asi=page.locator('#asi-internal');
  const asiBefore=await asi.evaluate(node=>({pressure:node.dataset.pressure,deflection:node.dataset.deflection,pointer:node.querySelector('.cutaway-pointer').getAttribute('transform')}));
  await set('altitude',10000);await snapshot(10000);
  assert.deepEqual(await asi.evaluate(node=>({pressure:node.dataset.pressure,deflection:node.dataset.deflection,pointer:node.querySelector('.cutaway-pointer').getAttribute('transform')})),asiBefore);
  await page.locator('#altimeter-tab-face').click();
  assert.equal(await panel.locator('.internal-face').isVisible(),true);
  assert.equal(await panel.locator('.internal-mechanism').isVisible(),false);
  await page.locator('#altimeter-tab-works').click();
  assert.equal(await panel.locator('#altimeter-panel-works .internal-mechanism').isVisible(),true);
  assert.equal(await panel.locator('svg.altimeter-diagram').count(),1);
  for(let step=0;step<6;step++){
    const button=panel.locator(`[data-step="${step}"]`);await button.click();
    const id=await button.getAttribute('data-step-component');
    assert.equal(await panel.locator(`[data-component="${id}"]`).evaluate(node=>node.classList.contains('component-active')),true);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
  }
  for(const id of ['static','case','capsule','stack','linkage','gear','shaft','pointer','dial']){
    await panel.locator(`[data-select-component="${id}"]`).focus();await page.keyboard.press('Enter');
    assert.equal(await panel.locator(`[data-select-component="${id}"]`).getAttribute('aria-pressed'),'true');
    assert.ok((await panel.locator('.component-explanation').textContent()).length>20);
    assert.equal(await panel.locator('[data-step][aria-pressed="true"]').count(),0);
  }
  await page.locator('#altimeter-tab-works').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('#altimeter-tab-face').getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#altimeter-tab-cutaway').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#altimeter-tab-works').getAttribute('aria-selected'),'true');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#altimeter-tab-cutaway').getAttribute('aria-selected'),'true');
  assert.equal(await panel.evaluate(node=>node.classList.contains('focus-linked')),true);
  assert.equal(await page.locator('[data-variable="altitude"]').evaluate(node=>node.classList.contains('linked')),true);
  assert.equal(await page.locator('[data-flight="altitude"]').evaluate(node=>node.parentElement.classList.contains('linked')),true);
  if(scenario==='normal')assert.equal(await page.locator('canvas').getAttribute('data-focused-cues'),'altitude');
  await page.locator('#teaching-focus').uncheck();
  assert.equal(await panel.evaluate(node=>node.classList.contains('focus-linked')),false);
  await page.locator('#reset').click();await snapshot(3500);
  assert.equal(await page.locator('#altimeter-tab-cutaway').getAttribute('aria-selected'),'true');
  for(const reducedMotion of ['no-preference','reduce']){
    await page.emulateMedia({reducedMotion});
    for(const feet of [0,5000,10000]){await set('altitude',feet);await snapshot(feet);}
    await page.locator('#reset').click();await snapshot(3500);
  }
  await page.locator('#altimeter-tab-works').click();
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: altimeter page overflow`);
    assert.equal(await panel.locator('[data-select-component="capsule"]').isVisible(),true);
    if(width<=390){
      assert.equal(await panel.locator('.diagram-scroll').evaluate(node=>node.scrollWidth>node.clientWidth),true);
      await panel.locator('.diagram-scroll').focus();await page.keyboard.press('ArrowRight');
      await page.waitForFunction(()=>document.querySelector('#altimeter-internal .diagram-scroll').scrollLeft>0);
    }
    if(scenario==='normal')await page.screenshot({path:`/tmp/phase3b-${name}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const id of ['attitude','turn','heading']){
    await page.locator(`[data-instrument="${id}"]`).click();
    assert.equal(await panel.isVisible(),false);
    assert.equal(await page.locator('#asi-internal').isVisible(),false);
    assert.equal(await page.locator(`#${id}-internal`).isVisible(),true);
  }
  await page.locator('[data-instrument="airspeed"]').click();
  assert.equal(await panel.isVisible(),false);assert.equal(await asi.isVisible(),true);
  await page.locator('[data-instrument="altimeter"]').click();
  assert.equal(await panel.isVisible(),true);await snapshot(3500);
  await page.locator('[data-instrument="attitude"]').click();
  console.log(`PASS Phase 3B ${scenario}: pressure, sealed stack/linkage, three synchronized pointers, independent controls, tabs/keyboard, focus, Reset, responsive and reduced-motion views`);
}
