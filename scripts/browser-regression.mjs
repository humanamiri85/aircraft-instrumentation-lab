import {checkVsiInternal} from './vsi-browser-checks.mjs';
import {checkAltimeterInternal} from './altimeter-browser-checks.mjs';
import {checkAsiInternal} from './asi-browser-checks.mjs';
// Optional browser tooling: see README. Application dependencies remain unchanged.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, resolve} from 'node:path';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viewSource = await readFile(resolve(root, 'js/aircraft/view.js'), 'utf8');
// Serve the checkout from its parent: imports must resolve beneath the Pages subdirectory.
const server = spawn('python3', ['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', dirname(root)], {env:{...process.env, PYTHONUNBUFFERED:'1'}, stdio:['ignore','pipe','pipe']});
const port = await new Promise((resolvePort, reject) => {
  let output='';
  const parse = chunk => {output+=chunk; const match=output.match(/port (\d+)/); if(match) resolvePort(match[1]);};
  server.stdout.on('data',parse); server.stderr.on('data',parse); server.on('error',reject); server.on('exit',code=>reject(new Error(`Static server exited: ${code}`)));
});
const base = `http://127.0.0.1:${port}/${encodeURIComponent(root.split('/').at(-1))}/`;
let browser;
const results=[];
try {
  for (const scenario of ['normal','missing-view','missing-cues','missing-three','missing-three-core','init-throws','update-throws','frame-throws','input-throws','webgl-disabled']) {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox',...(scenario==='webgl-disabled'?['--disable-webgl']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'])]});
    const page=await browser.newPage({reducedMotion:'reduce'});
    const errors=[],network=[];
    page.on('pageerror',error=>errors.push(`uncaught: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('requestfailed',request=>network.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response',response=>{if(response.status()>=400)network.push(`${response.status()} ${response.url()}`);});
    await page.addInitScript(()=>{
      window.__frames=0;
      const raf=window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame=callback=>raf(time=>{window.__frames++;callback(time);});
    });
    const missing={ 'missing-view':'js/aircraft/view.js','missing-cues':'js/aircraft/flight-cues.js','missing-three':'vendor/three/three.module.js','missing-three-core':'vendor/three/three.core.js'}[scenario];
    if(missing)await page.route(`**/${missing}`,route=>route.fulfill({status:404,contentType:'text/javascript',body:'// Deliberately missing dependency'}));
    if(scenario==='init-throws')await page.route('**/js/aircraft/view.js',route=>route.fulfill({contentType:'text/javascript',body:'export function createAircraftView(){throw new Error("Injected aircraft initialization failure");}'}));
    if(scenario==='update-throws')await page.route('**/js/aircraft/view.js',route=>route.fulfill({contentType:'text/javascript',body:viewSource.replace('export async function createAircraftView(', 'async function originalCreateAircraftView(')+ '\nexport async function createAircraftView(panel){const view=await originalCreateAircraftView(panel);return {...view,update(){throw new Error("Injected aircraft update failure");}};}'}));
    if(['frame-throws','input-throws'].includes(scenario)) {
      const condition=scenario==='frame-throws'?'dt > 0':'state.airspeed === 160';
      await page.route('**/js/aircraft/view.js',route=>route.fulfill({contentType:'text/javascript',body:viewSource.replace('export async function createAircraftView(', 'async function originalCreateAircraftView(')+`\nexport async function createAircraftView(panel){const view=await originalCreateAircraftView(panel);return {...view,update(state,dt=0,reducedMotion){if(${condition})throw new Error("Injected ${scenario} failure");view.update(state,dt,reducedMotion);}};}`}));
    }
    await page.goto(base);
    await page.waitForFunction(()=>document.querySelectorAll('input[type=range]').length===6);
    if(scenario==='normal' || scenario==='input-throws') {
      await page.waitForFunction(()=>document.querySelector('.aircraft-status').hidden);
      for(const resource of ['js/app.js','js/model.js','js/catalog.js','js/aircraft/view.js','js/aircraft/orientation.js','js/aircraft/flight-cues.js','vendor/three/three.module.js','vendor/three/three.core.js']){
        const response=await page.request.get(base+resource);assert.equal(response.status(),200,resource);assert.match(response.headers()['content-type'],/javascript/,resource);
      }
    }else await page.waitForFunction(()=>document.querySelector('.aircraft-status').textContent.includes('unavailable'));
    const changes=[['airspeed',160,['airspeed'],'160 kt'],['altitude',7000,['altimeter'],'7,000 ft'],['pitch',15,['attitude'],'15°'],['bank',30,['attitude','turn'],'30°'],['heading',45,['heading'],'45°'],['verticalSpeed',1200,['vsi'],'1,200 ft/min']];
    for(const [key,value,instruments,output] of changes){
      await page.locator('#reset').click();
      const before=await Promise.all(instruments.map(id=>page.locator(`[data-instrument="${id}"] svg`).innerHTML()));
      const canvas=page.locator('.aircraft-viewport canvas');
      const before3D=scenario==='normal' && ['pitch','bank'].includes(key)?await canvas.screenshot():null;
      await page.evaluate(({key,value})=>{const input=document.getElementById(key);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},{key,value});
      assert.equal(await page.locator(`#${key}-value`).textContent(),output,`${scenario}: ${key} control`);
      for(let i=0;i<instruments.length;i++)assert.notEqual(await page.locator(`[data-instrument="${instruments[i]}"] svg`).innerHTML(),before[i],`${scenario}: ${key} pointer/attitude`);
      // Check settled readings against shared model/catalog; confirms the input target
      // and frame-updated current state agree, including uncoupled variables.
      await page.waitForTimeout(80);
      const expected=await page.evaluate(async ({key,value,base})=>{const [{initialState,setVariable},{instruments}]=await Promise.all([import(base+'js/model.js'),import(base+'js/catalog.js')]);const state=initialState();setVariable(state,key,value);return instruments.map(instrument=>instrument.read(state));},{key,value,base});
      assert.deepEqual(await page.locator('.instrument-value').allTextContents(),expected,`${scenario}: ${key} shared state`);
      if(scenario==='normal'){
        const hud={airspeed:'160 kt',altitude:'7000 ft',pitch:'+15°',bank:'R 30°',heading:'045°',verticalSpeed:'+1200 fpm'};
        assert.equal(await page.locator(`[data-flight="${key}"]`).textContent(),hud[key]);
        if(before3D)assert.equal(before3D.equals(await canvas.screenshot()),false,`${key} changes 3D canvas`);
      }
    }
    // Phase 2C: real DOM emphasis, Reset persistence and keyboard interaction.
    const links={airspeed:['airspeed'],attitude:['pitch','bank'],altimeter:['altitude'],turn:['bank'],heading:['heading'],vsi:['verticalSpeed']};
    const cues={airspeed:'airspeed',attitude:'attitude',altimeter:'altitude',turn:'attitude',heading:'heading',vsi:'verticalSpeed'};
    for(const [id,keys] of Object.entries(links)) {
      await page.locator(`[data-instrument="${id}"]`).click();
      assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(row=>row.dataset.variable)),keys);
      assert.deepEqual((await page.locator('#flight-data .linked dd').evaluateAll(fields=>fields.map(field=>field.dataset.flight))).sort(),[...keys].sort());
      assert.equal(await page.locator(`[data-instrument="${id}"]`).getAttribute('aria-pressed'),'true');
      assert.ok(await page.locator('#relationship').textContent());
      if(scenario==='normal') await page.waitForFunction(cue=>document.querySelector('canvas').dataset.focusedCues===cue,cues[id]);
      // Exercise every linked input with its focus active; existing assertions above
      // cover the resulting instrument readings, independence and 3D transforms.
      for(const key of keys) {
        const [,value,instrumentIds]=changes.find(change=>change[0]===key);
        await page.locator('#reset').click();
        const before=await page.locator(`[data-instrument="${instrumentIds[0]}"] svg`).innerHTML();
        await page.locator(`#${key}`).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
        assert.notEqual(await page.locator(`[data-instrument="${instrumentIds[0]}"] svg`).innerHTML(),before);
        if(scenario==='normal') assert.equal(await page.locator(`[data-flight="${key}"]`).textContent(),{airspeed:'160 kt',altitude:'7000 ft',pitch:'+15°',bank:'R 30°',heading:'045°',verticalSpeed:'+1200 fpm'}[key]);
      }
      await page.locator('#reset').click();
      assert.equal(await page.locator(`[data-instrument="${id}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#teaching-focus').isChecked(),true);
      assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(row=>row.dataset.variable)),keys);
    }
    await page.locator('#teaching-focus').uncheck();
    assert.equal(await page.locator('.control.linked, #flight-data .linked').count(),0);
    assert.equal(await page.locator('.teaching-focus').count(),0);
    await page.locator('#reset').click();
    assert.equal(await page.locator('#teaching-focus').isChecked(),false);
    await page.locator('[data-instrument="attitude"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-instrument="attitude"]').getAttribute('aria-pressed'),'true');
    await page.locator('#teaching-focus').focus();
    await page.keyboard.press('Space');
    assert.deepEqual(await page.locator('.control.linked').evaluateAll(rows=>rows.map(row=>row.dataset.variable)),['pitch','bank']);
    if(['normal','webgl-disabled'].includes(scenario)){
      await checkAsiInternal(page,scenario);
      await checkAltimeterInternal(page,scenario);
      await checkVsiInternal(page,scenario);
    }
    if(scenario==='normal') {
      for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,700]]) {
        await page.setViewportSize({width,height});
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: horizontal overflow`);
        const bounds=await page.locator('#flight-data').boundingBox();
        const canvasBounds=await page.locator('canvas').boundingBox();
        assert.ok(bounds.y+bounds.height<=canvasBounds.y+1,`${name}: HUD overlaps canvas`);
        await page.screenshot({path:`/tmp/phase2c-${name}.png`,fullPage:true});
      }
    }
    const frames=await page.evaluate(()=>window.__frames);
    await page.waitForFunction(previous=>window.__frames>previous,frames,{timeout:5000});
    assert.ok(!errors.some(e=>e.startsWith('uncaught:')),errors.join('\n'));
    if(scenario==='normal'){assert.deepEqual(errors,[]);assert.deepEqual(network,[]);}
    else assert.ok(errors.length>0,`${scenario}: failure must be reported`);
    results.push({scenario,passed:true,consoleErrors:errors,failedRequests:network});
    console.log(`PASS ${scenario}: all six controls, SVG updates, Reset and continuing animation`);
    await browser.close();browser=undefined;
  }
  console.log(JSON.stringify({basePath:'/'+root.split('/').at(-1)+'/',results},null,2));
} finally {await browser?.close();server.kill();}
