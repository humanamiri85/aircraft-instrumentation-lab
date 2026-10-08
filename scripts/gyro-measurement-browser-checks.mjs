import assert from 'node:assert/strict';
import {setControl,openInternal} from './internal-browser-helpers.mjs';
const references={attitude:'vertical',heading:'directional',turn:'restrained-rate'};
async function openChain(page,id) {
  const panel=await openInternal(page,id,id);await panel.locator(`#${id}-tab-cutaway`).focus();await page.keyboard.press('End');
  const system=panel.locator('.gc-system');await system.waitFor({state:'visible'});
  return {panel,system};
}
export async function checkGyroChains(page,scenario) {
  // One session traverses all chains at non-default state: no stale reference/focus/value leakage.
  await setControl(page,'pitch',8);await setControl(page,'bank',-20);await setControl(page,'heading',275);
  for(const motion of ['reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:motion});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      for(const id of Object.keys(references)) {
        const {panel,system}=await openChain(page,id);
        assert.deepEqual(await panel.locator('[role=tab]').allTextContents(),['Instrument Face','Internal Cutaway','How It Works','Measurement Chain']);
        assert.equal(await system.getAttribute('data-selected-instrument'),id);assert.equal(await system.getAttribute('data-reference-type'),references[id]);
        assert.equal(await system.locator('.gc-selected').getAttribute('data-gyro-path'),id);assert.equal(await system.locator('.gc-dimmed').count(),2);
        assert.equal(await system.locator('[data-gyro-value="aiReference"]').textContent(),'Vertical gyro — ideal stabilized reference');
        assert.equal(await system.locator('[data-gyro-value="hiReference"]').textContent(),'Directional gyro — ideal heading reference');
        assert.equal(await system.locator('[data-gyro-value="tcResponse"]').textContent(),'Angular-rate sensing');
        assert.match(await system.locator('.gc-proxy-note').textContent(),/Bank.*proxy.*responds to angular rate, not bank angle/);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${id}/${width}: overflow`);
        assert.equal(await system.getAttribute('data-reduced-motion'),String(motion==='reduce'));
        // No animated cues are required: state geometry and static spin cue remain present.
        assert.equal(await system.evaluate(el=>el.getAnimations({subtree:true}).length),0);
        assert.ok(await system.locator('.internal-note').first().textContent());
        assert.ok(await system.locator('.gc-stages strong').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=12);
        assert.equal(await panel.locator('[role=tabpanel]:visible').count(),1);
        for(const key of ['pitch','bank','heading'])assert.equal(await system.locator(`[data-gyro-value="${key}"]`).textContent(),{pitch:'+8°',bank:'-20°',heading:'275°'}[key]);
        await page.locator('#teaching-focus').uncheck();assert.equal(await system.locator('.gc-dimmed,.gc-selected').count(),0);
        await page.locator('#teaching-focus').check();
        for(const button of await system.locator('[data-step],[data-select-component]').all()) {
          await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');
          assert.ok((await system.locator('.component-explanation').textContent()).length>35);
          assert.ok(await system.locator('.component-active').count()>0);
          assert.equal(await system.locator(`.gc-path:not([data-gyro-path="${id}"]) .component-active`).count(),0);
        }
        assert.deepEqual(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);}),[]);
        if(motion==='reduce')await system.screenshot({path:`/tmp/phase4b-${scenario}-${id}-${width}.png`});
      }
    }
  }
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
  let {panel,system}=await openChain(page,'attitude');
  for(const pitch of [-20,0,20])for(const bank of [-45,0,45]) {
    await setControl(page,'pitch',pitch);await setControl(page,'bank',bank);
    assert.equal(Number(await system.getAttribute('data-pitch-offset')),pitch*1.8);assert.equal(await system.getAttribute('data-horizon-roll'),String(-bank));
    assert.equal(await system.locator('[data-chain-face="attitude"] [data-part="pitch"]').getAttribute('transform'),`translate(0 ${pitch*1.8})`);
    assert.equal(await system.locator('[data-chain-face="attitude"] [data-part="bank"]').getAttribute('transform'),`rotate(${-bank} 100 100)`);
    for(const heading of [0,90,359]) {await setControl(page,'heading',heading);assert.equal(Number(await system.getAttribute('data-pitch-offset')),pitch*1.8);assert.equal(await system.getAttribute('data-horizon-roll'),String(-bank));}
  }
  ({panel,system}=await openChain(page,'heading'));
  let previous=Number(await system.getAttribute('data-case-angle'));
  for(const heading of [0,1,90,180,270,359,0,359]) {
    await setControl(page,'heading',heading);const angle=Number(await system.getAttribute('data-case-angle'));
    assert.ok(Math.abs(angle-previous)<=180);if(heading===0&&((previous%360)+360)%360===359)assert.equal(angle-previous,1);
    if(heading===359&&((previous%360)+360)%360===0)assert.equal(angle-previous,-1);
    assert.equal(await system.locator('[data-chain-face="heading"] [data-part="card"]').getAttribute('transform'),`rotate(${-angle} 100 100)`);
    for(const [key,value] of [['pitch',-20],['bank',-45],['pitch',20],['bank',45]]) {await setControl(page,key,value);assert.equal(Number(await system.getAttribute('data-case-angle')),angle);}
    previous=angle;
  }
  ({panel,system}=await openChain(page,'turn'));
  for(const bank of [-45,-20,0,20,45]) {
    await setControl(page,'bank',bank);assert.equal(Number(await system.getAttribute('data-rate-proxy')),bank/45);
    assert.equal(Number(await system.getAttribute('data-gimbal-angle')),bank/45*18);assert.equal(await system.getAttribute('data-ball-offset'),'0');
    assert.equal(await system.locator('[data-chain-face="turn"] [data-part="ball"]').getAttribute('cx'),'100');
    const response=await system.locator('[data-gyro-value="deflection"]').textContent();assert.match(response,new RegExp(bank>0?'Right':bank<0?'Left':'Neutral'));
    await setControl(page,'heading',90);await setControl(page,'pitch',0);assert.equal(Number(await system.getAttribute('data-rate-proxy')),bank/45);
  }
  await system.locator('[data-step="2"]').click();await page.locator('#reset').click();assert.equal(await panel.getAttribute('data-view'),'chain');
  assert.equal(await system.locator('[data-step="2"]').getAttribute('aria-pressed'),'true');assert.equal(await system.getAttribute('data-rate-proxy'),'0');
  await system.locator('[data-open-cutaway]').focus();await page.keyboard.press('Enter');assert.equal(await panel.getAttribute('data-view'),'cutaway');
  console.log(`PASS Phase 4B ${scenario}: three chains in one session, signs/wrap/independence, proxy and references, components, keyboard, Reset, focus, five widths and both motion preferences`);
}
export async function checkGyroIsolation(page,scenario) {
  const panel=await openInternal(page,'turn','turn');await panel.locator('#turn-tab-chain').click();
  if(scenario==='gyro-chain-update-throws'){await panel.locator('.gc-system').waitFor({state:'visible'});await setControl(page,'bank',20);}
  await panel.locator('#turn-panel-chain [role=status]').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#turn-panel-chain').textContent.includes('unavailable'));assert.match(await panel.locator('#turn-panel-chain').textContent(),/unavailable/);
  await panel.locator('#turn-tab-cutaway').click();await setControl(page,'bank',-20);assert.equal(Number(await panel.getAttribute('data-rate-proxy')),-20/45);
  assert.match(await page.locator('[data-instrument="turn"] .instrument-value').textContent(),/Left turn tendency/);
  const asi=await openInternal(page,'airspeed','asi');await asi.locator('#asi-tab-chain').click();await asi.locator('.ps-system').waitFor({state:'visible'});
  await setControl(page,'airspeed',160);assert.equal(await asi.locator('[data-system-value="airspeed"]').textContent(),'160 kt');
  const attitude=await openInternal(page,'attitude','attitude');await setControl(page,'pitch',20);assert.equal(await attitude.locator('[data-case="pitch"]').getAttribute('transform'),'rotate(-20)');
  console.log(`PASS ${scenario}: cockpit, pitot-static chain and original gyro lessons survive`);
}
