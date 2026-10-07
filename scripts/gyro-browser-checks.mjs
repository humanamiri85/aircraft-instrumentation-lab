import assert from 'node:assert/strict';
import {Quaternion,Vector3} from '../vendor/three/three.core.js';
export async function checkGyroFoundation(page,scenario) {
  const panel=page.locator('#gyro-internal');
  for(const instrument of ['attitude','heading','turn']) {
    await page.locator(`[data-instrument="${instrument}"]`).click();
    assert.equal(await page.locator('#inside-instrument').count(),0,'unfinished internals remain placeholders');
    await page.locator('#gyro-fundamentals').click();
    assert.equal(await panel.isVisible(),true);
    assert.equal(await panel.locator('[role=tab][aria-selected=true]').textContent(),'Gyro Assembly');
  }
  assert.equal(await page.locator('input[type=range]').count(),6,'no duplicate flight controls');
  await page.waitForFunction(()=>document.querySelector('.gyro-status').hidden || document.querySelector('.gyro-status').textContent.includes('unavailable'));
  const available=scenario==='normal';
  const canvas=panel.locator('canvas');
  if(available)assert.equal(await canvas.count(),1);
  else assert.match(await panel.locator('.gyro-status').textContent(),/unavailable/);
  await page.locator('#gyro-tab-rigidity').click();
  const set=async(key,value)=>page.locator(`#${key}`).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await set('pitch',0);await set('bank',0);await set('heading',0);
  const identity=available?await canvas.getAttribute('data-body-quaternion'):null;
  for(const [key,values] of [['pitch',[-20,0,20]],['bank',[-45,0,45]],['heading',[0,90,180,270,359]]]) {
    for(const value of values) {
      await set(key,value);
      assert.match(await panel.locator('.gyro-reading').textContent(),/fixed world north/);
      if(available) {
        const axis=JSON.parse(await canvas.getAttribute('data-spin-axis'));
        axis.forEach((v,i)=>assert.ok(Math.abs(v-[0,0,-1][i])<1e-8,`${key} ${value}: actual rendered spin axis stable`));
        const q=await canvas.getAttribute('data-body-quaternion');
        const rotation=new Quaternion(...JSON.parse(q));
        const nose=new Vector3(0,0,-1).applyQuaternion(rotation),right=new Vector3(1,0,0).applyQuaternion(rotation);
        const radians=value*Math.PI/180,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
        if(key==='pitch')near(nose.y,Math.sin(radians));
        if(key==='bank')near(right.y,-Math.sin(radians));
        if(key==='heading'){near(nose.x,Math.sin(radians));near(nose.z,-Math.cos(radians));}
        if(value!==0)assert.notEqual(q,identity,`${key} moves aircraft frame`);
        assert.equal(await canvas.isVisible(),true);
      }
    }
    await set(key,0);
  }
  await set('pitch',20);await set('bank',45);await set('heading',270);
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]) {
    await page.setViewportSize({width,height});
    for(const mode of ['assembly','axes','rigidity']) {
      await page.locator(`#gyro-tab-${mode}`).click();
      assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} ${mode}: no overflow`);
      if(available)assert.ok((await canvas.boundingBox()).width>100);
    }
    await panel.screenshot({path:`/tmp/phase3d-${scenario}-${name}.png`});
  }
  await page.locator('#gyro-tab-assembly').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#gyro-tab-axes').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');assert.equal(await page.locator('#gyro-tab-rigidity').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Home');assert.equal(await page.locator('#gyro-tab-assembly').getAttribute('aria-selected'),'true');
  for(const id of ['rotor','spin','inner','outer','body','instrument']) {
    const button=panel.locator(`[data-gyro-component="${id}"]`);await button.focus();await page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-pressed'),'true');assert.ok(await panel.locator('.component-explanation').textContent());
  }
  for(let i=0;i<5;i++){await panel.locator(`[data-gyro-step="${i}"]`).click();assert.equal(await panel.locator(`[data-gyro-step="${i}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('#teaching-focus').uncheck();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),false);
  await page.locator('#teaching-focus').check();assert.equal(await panel.evaluate(p=>p.classList.contains('focus-linked')),true);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.match(await panel.locator('.gyro-motion').textContent(),/stationary rotor/);
  if(available){assert.equal(await canvas.getAttribute('data-phase'),'0');await page.waitForTimeout(100);assert.equal(await canvas.getAttribute('data-phase'),'0');}
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
  if(available){const before=await canvas.getAttribute('data-phase');await page.waitForTimeout(150);assert.notEqual(await canvas.getAttribute('data-phase'),before);}
  await page.locator('#reset').click();assert.equal(await panel.isVisible(),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-instrument="airspeed"]').click();assert.equal(await panel.isVisible(),false);
  await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS Phase 3D ${scenario}: ${available?'stable rendered spin axis and moving body':'textual WebGL fallback'}, all modes, components/steps, keyboard, responsive layouts, motion preferences and shared controls`);
}
