import assert from 'node:assert/strict';
const input=(page,id,value)=>page.locator('#'+id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const jump=async(page,index)=>{await page.waitForFunction(()=>Boolean(document.querySelector('#journey-root')?.dataset.stage));await page.locator('.journey-overview').evaluate(el=>el.open=true);await page.locator(`[data-journey-stage="${index}"]`).click();await page.waitForFunction(index=>document.querySelector('#journey-position').textContent.startsWith(String(index+1).padStart(2,'0')),index);};

export async function checkLegacyBaseline(page){
 assert.equal(await page.title(),'Aircraft Instrumentation Lab');assert.equal(await page.locator('h1').textContent(),'Six instruments. One flight picture.');
 assert.equal(await page.locator('#instruments [data-instrument]').count(),6);assert.equal(await page.locator('#controls input[type=range]').count(),6);
 assert.deepEqual(await page.locator('.educational-navigation button').evaluateAll(els=>els.map(el=>el.id)),['measurement-comparison','pitot-static-faults','gyro-faults','diagnostic-scenarios','modern-instrumentation']);
 assert.equal(await page.locator('#teaching-focus').isChecked(),true);assert.equal(await page.locator('#journey-root').count(),0);assert.equal(await page.locator('a[href="guided.html"]').count(),0);assert.ok((await page.locator('script[type=module]').getAttribute('src'))==='js/app.js');
 console.log('PASS legacy-index-baseline: validated hero, DOM, navigation, six instruments/controls and original startup; full legacy feature checks follow');
}

async function completeJourney(page){
 await page.locator('#journey-title').filter({hasText:'Flight Information'}).waitFor();await page.locator('#instruments [data-instrument=airspeed] svg').waitFor({state:'attached'});
 assert.equal(await page.locator('#journey-continue').isDisabled(),true);assert.equal(await page.locator('#diagnostics-internal').isVisible(),false);assert.equal(await page.locator('#modern-internal').isVisible(),false);
 for(const key of ['airspeed','altitude','verticalSpeed','pitch','bank','heading'])await page.locator(`[data-quantity="${key}"]`).click();assert.match(await page.locator('#journey-completion').textContent(),/complete/);await page.locator('#journey-continue').click();
 assert.equal(await page.locator('#journey-synthesis').isVisible(),false);
 for(const [index,id] of ['airspeed','altimeter','vsi','attitude','heading','turn'].entries()){
  assert.match(await page.locator('#journey-interaction').textContent(),new RegExp(`Instrument ${index+1} of 6`));
  const visible=await page.locator('#controls [data-variable]:visible').evaluateAll(els=>els.map(el=>el.dataset.variable));assert.deepEqual(visible,{airspeed:['airspeed'],attitude:['pitch','bank'],altimeter:['altitude'],turn:['bank'],heading:['heading'],vsi:['verticalSpeed']}[id]);
  await input(page,visible[0],{airspeed:150,altimeter:5500,vsi:1000,attitude:10,heading:90,turn:20}[id]);
  if(index<5)await page.locator('[data-instrument-next]').click();
 }
 assert.match(await page.locator('#journey-detail').textContent(),/Turn Coordinator/);assert.equal(await page.locator('#journey-synthesis').isVisible(),true);
 await page.locator('[data-instrument-previous]').click();assert.match(await page.locator('#journey-interaction').textContent(),/Instrument 5 of 6/);await page.locator('#journey-continue').click();
 for(const [key,value] of [['pitch',10],['bank',30],['heading',0],['altitude',5000],['airspeed',150],['verticalSpeed',1000]]){
  await page.locator(`[data-aircraft-experiment="${key}"]`).click();await page.locator('[data-experiment-start]').click();
  if(key==='heading'){await page.locator('input[name=prediction-heading]').first().check();assert.equal(await page.locator('#heading').inputValue(),'359');}
  await input(page,key,value);if(key==='heading')assert.equal(await page.locator('[data-prediction-observation=heading]').isVisible(),true);assert.ok((await page.locator(`#${key}-value`).textContent()).length);
 }
 assert.equal(await page.locator('[data-prediction-observation=heading]').count(),0);
 assert.match(await page.locator('.aircraft-panel').textContent(),/independently controlled/);
 for(const [key,value] of [['pitch','+10°'],['bank','R 30°'],['heading','000°'],['altitude','5000 ft'],['airspeed','150 kt'],['verticalSpeed','+1000 fpm']])assert.equal(await page.locator(`[data-flight="${key}"]`).textContent(),value);
 assert.match(await page.locator('[data-cue=verticalSpeed]').textContent(),/CLIMB \+1000/);
 if(await page.locator('.aircraft-viewport canvas').count())assert.equal(await page.locator('.aircraft-viewport canvas').isVisible(),true);else assert.match(await page.locator('.aircraft-status').textContent(),/unavailable/);
 assert.match(await page.locator('#journey-completion').textContent(),/complete/);await page.locator('#journey-continue').click();
 assert.equal(await page.locator('#journey-continue').isDisabled(),true);for(let step=0;step<5;step++){assert.ok(await page.locator('#asi-internal .component-active').count());assert.match(await page.locator('#journey-walk').textContent(),new RegExp(`Step ${step+1} of 5`));await page.locator('[data-walk-next]').click();}
 await page.locator('[data-instrument=attitude]').click();await page.locator('#attitude-tab-cutaway').click();assert.match(await page.locator('#journey-completion').textContent(),/complete/);await page.locator('#journey-fundamentals').click();await page.locator('#gyro-internal').waitFor();await page.locator('#journey-continue').click();
 await page.locator('input[name=prediction-pressure]').first().check();
 for(let step=0;step<6;step++)await page.locator('[data-chain-next]').click();
 await page.locator('[data-instrument=heading]').click();for(let step=0;step<5;step++)await page.locator('[data-chain-next]').click();
 assert.match(await page.locator('#journey-completion').textContent(),/complete/);await page.locator('#journey-continue').click();
 assert.equal(await page.locator('#journey-pair details').first().evaluate(el=>el.open),false);await page.locator('#journey-pair summary').first().click();assert.equal(await page.locator('#journey-pair details').first().evaluate(el=>el.open),true);
 for(const id of ['pressure','references','rate']){await page.locator(`[data-journey-pair="${id}"]`).click();assert.equal(await page.locator('[data-journey-comparison]').count(),2);}
 assert.match(await page.locator('#journey-pair').textContent(),/Angular rate/);await page.locator('#journey-continue').click();
 await page.locator('[data-fault-start]').click();assert.equal(await page.locator('#altitude').inputValue(),'3000');await page.locator('input[name=prediction-static]').nth(1).check();await input(page,'altitude',5000);await page.locator('#faults-internal [data-activate]').click();assert.equal(await page.locator('[data-prediction-observation=static]').isVisible(),false);const trapped=await page.locator('#faults-internal').getAttribute('data-altimeter-ps');await input(page,'altitude',7000);assert.equal(await page.locator('[data-prediction-observation=static]').isVisible(),true);assert.equal(await page.locator('#faults-internal').getAttribute('data-altimeter-ps'),trapped);assert.match(await page.locator('[data-instrument=altimeter] .instrument-value').textContent(),/5,000/);
 for(const id of ['blocked-pitot','pitot-leak']){await page.locator(`[data-journey-fault="${id}"]`).click();await page.locator('#faults-internal [data-activate]').click();assert.equal(await page.locator('#faults-internal').getAttribute('data-fault-type'),id);}
 await page.locator('[data-journey-fault=gyro]').click();await page.locator('#gyro-faults-internal [data-gf-activate]').click();await page.waitForFunction(()=>Number(document.querySelector('#gyro-faults-internal').dataset.error)>.01);assert.match(await page.locator('#journey-completion').textContent(),/complete/);await page.locator('#journey-continue').click();
 assert.equal(await page.locator('#faults-internal').getAttribute('data-fault-type'),'normal');assert.equal(await page.locator('#gyro-faults-internal').getAttribute('data-fault-type'),'normal');
 assert.equal(await page.locator('#diagnostics-internal').isVisible(),false);assert.match(await page.locator('#journey-simple-diagnostic').textContent(),/Observe/);
 for(let step=0;step<3;step++)await page.locator('[data-case-next]').click();
 await page.locator('input[name=prediction-diagnostic]').first().check();await page.locator('[data-case-experiment]').click();assert.equal(await page.locator('[data-prediction-observation=diagnostic]').isVisible(),true);
 await page.locator('[data-case-next]').click();await page.locator('#journey-case-diagnosis').selectOption('blocked-static');await page.locator('[data-case-submit]').click();assert.match(await page.locator('#journey-case-result').textContent(),/CORRECT/);
 await page.locator('[data-diagnostic-full]').click();assert.equal(await page.locator('#diagnostics-internal').isVisible(),true);
 for(const mode of ['mixed','challenge','guided']){await page.locator('#dx-mode').selectOption(mode);assert.equal(await page.locator('#diagnostics-internal').getAttribute('data-diagnostic-mode'),mode);}
 await page.locator('#journey-continue').click();assert.equal(await page.locator('#dx-running').isChecked(),false);assert.equal(await page.locator('#diagnostics-internal').getAttribute('data-scenario-id'),null);
 assert.equal(await page.locator('#modern-internal').isVisible(),false);assert.match(await page.locator('#journey-interaction').textContent(),/What changed/);assert.doesNotMatch(await page.locator('#journey-interaction').textContent(),/object Object/);await page.locator('[data-modern-full]').click();
 for(const mode of ['classical','modern','both'])await page.locator('#modern-presentation').selectOption(mode);await input(page,'pitch',10);assert.equal(await page.locator('[data-pfd-value=pitch]').textContent(),'Pitch +10°');assert.equal(await page.locator('[data-pfd-value=airspeed]').textContent(),'110');await page.locator('#journey-continue').click();assert.match(await page.locator('#journey-announcement').textContent(),/Technology changed/);
 await page.locator('#journey-previous').click();assert.match(await page.locator('#journey-title').textContent(),/Troubleshooting/);await page.locator('#journey-continue').click();
 await page.reload();await page.locator('[data-modern-full]').waitFor();assert.equal(await page.locator('#journey-position').textContent(),'09 / 09');assert.match(await page.locator('#journey-completion').textContent(),/complete/);
}

async function layouts(page){
 for(const motion of ['reduce','no-preference']){await page.emulateMedia({reducedMotion:motion});for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});for(let index=0;index<9;index++){await jump(page,index);await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Journey stage ${index+1}, ${width}, ${motion}: overflow`);assert.equal(await page.locator('#journey-title').isVisible(),true);assert.equal(await page.locator('#journey-title').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=26),true);assert.equal(await page.locator('#lab-host nav').isVisible(),false);if(index<6){assert.equal(await page.locator('#faults-internal').isVisible(),false);assert.equal(await page.locator('#diagnostics-internal').isVisible(),false);assert.equal(await page.locator('#modern-internal').isVisible(),false);}}}
 }
 await page.setViewportSize({width:390,height:900});await jump(page,2);await page.locator('[data-aircraft-experiment=pitch]').click();await page.locator('#pitch').focus();const before=Number(await page.locator('#pitch').inputValue());await page.keyboard.press('ArrowRight');assert.equal(Number(await page.locator('#pitch').inputValue()),before+1);assert.equal(await page.locator('#pitch').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await page.screenshot({path:'/tmp/guided-journey-390.png',fullPage:true});
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});for(const index of [1,5,7,8]){await jump(page,index);await page.waitForTimeout(100);await page.locator('.journey-overview').evaluate(el=>el.open=false);await page.screenshot({path:`/tmp/polish-review-${index+1}-${width}.png`,fullPage:true});}}
 await page.locator('.journey-overview').evaluate(el=>el.open=true);await page.locator('#restart-journey').click();assert.equal(await page.locator('#journey-position').textContent(),'01 / 09');await page.locator('#journey-anyway').click();assert.equal(await page.locator('#journey-position').textContent(),'02 / 09');assert.match(await page.locator('#journey-progress li').first().getAttribute('aria-label'),/Skipped/);await page.locator('#journey-previous').click();assert.equal(await page.locator('#journey-anyway').isVisible(),true);
}

export async function runJourneyChecks({chromium,base,executablePath}){
 const results=[];
 for(const scenario of ['guided-journey','guided-reduced-motion','guided-webgl-disabled','missing-journey','guided-missing-chain']){
  const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox',...(scenario==='guided-webgl-disabled'?['--disable-webgl']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'])]});
  try{const page=await browser.newPage({reducedMotion:scenario==='guided-journey'?'no-preference':'reduce'}),errors=[],network=[];page.on('pageerror',error=>errors.push('uncaught: '+error.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>network.push(r.url()));page.on('response',r=>{if(r.status()>=400)network.push(r.url());});
   if(scenario==='missing-journey')await page.route('**/js/journey/view.js',r=>r.fulfill({status:404,contentType:'text/javascript',body:'// injected optional Journey import failure'}));
   if(scenario==='guided-missing-chain')await page.route('**/js/measurement/pitot-static/view.js',r=>r.fulfill({status:404,contentType:'text/javascript',body:'// injected optional chain failure'}));
   await page.goto(base+'guided.html');
   if(scenario==='missing-journey'){await page.locator('h1').filter({hasText:'unavailable'}).waitFor();assert.equal(await page.locator('a[href="./"]').last().isVisible(),true);await page.goto(base);await page.locator('#instruments svg').first().waitFor();await checkLegacyBaseline(page);await input(page,'airspeed',160);assert.equal(await page.locator('[data-instrument=airspeed] .instrument-value').textContent(),'160 kt');}
   else if(scenario==='guided-missing-chain'){await jump(page,4);await page.locator('#altimeter-panel-chain [role=status]').filter({hasText:'unavailable'}).waitFor();await page.locator('#journey-anyway').click();assert.match(await page.locator('#journey-title').textContent(),/Compare/);await jump(page,7);await page.locator('#journey-interaction [role=status]').filter({hasText:'unavailable'}).waitFor();await page.locator('#journey-anyway').click();await page.locator('[data-modern-full]').click();await page.locator('[data-pfd-value=airspeed]').waitFor();assert.equal(await page.locator('[data-pfd-value=airspeed]').textContent(),'110');}
   else{await completeJourney(page);if(scenario==='guided-journey')await layouts(page);assert.equal(await page.locator('header a[href="./"]').getAttribute('href'),'./');if(scenario!=='guided-webgl-disabled'){assert.deepEqual(errors,[]);assert.deepEqual(network,[]);}else{assert.ok(errors.some(x=>x.includes('WebGL')));assert.deepEqual(network,[]);}await page.goto(base);await page.locator('#instruments svg').first().waitFor();assert.equal(await page.locator('[data-instrument=airspeed] .instrument-value').textContent(),'110 kt');assert.equal(await page.locator('#journey-root').count(),0);}
   assert.ok(!errors.some(x=>x.startsWith('uncaught:')),errors.join('\n'));results.push({scenario,passed:true,consoleErrors:errors,failedRequests:network});console.log(`PASS ${scenario}: parallel entry, progressive stages / real-model reuse / state isolation and local fallback`);
  }finally{await browser.close();}
 }
 return results;
}
