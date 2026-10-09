// Instructional state only: no aircraft, pressure, gyro or fault state.
export const instrumentOrder=Object.freeze(['airspeed','altimeter','vsi','attitude','heading','turn']);
export const instrumentTasks=Object.freeze({
 airspeed:['How fast through the air?','Increase Airspeed from 110 to about 150 kt.','airspeed',150,'Watch the pointer increase. Airspeed is inferred from Pt − Ps.'],
 altimeter:['How high?','Increase Altitude from 3500 to about 5500 ft.','altitude',5500,'Watch the altitude indication. Static pressure is sensed; altitude is inferred.'],
 vsi:['Climbing or descending?','Set Vertical Speed to about +1000 ft/min, then −1000.','verticalSpeed',1000,'Watch the lag before the indication settles. This control does not change altitude.'],
 attitude:['Nose up? Wings level?','Set Pitch to about +10°, then Bank to about +20°.','pitch',10,'The nose rises while the horizon moves oppositely. Right bank lowers the right wing.'],
 heading:['Which way is the nose pointing?','Change Heading from 270° to about 90°.','heading',90,'The card rotates beneath a fixed lubber line.'],
 turn:['What does a rate gyro indicate?','Set Bank proxy to about +20°, then −20°.','bank',20,'APP CONTROL: Bank proxy. REAL MEASURAND: Angular rate. The ball stays separate and centered.']
});
export const experimentDetails=Object.freeze({
 pitch:{start:0,target:10,action:'Set Pitch to about +10°.',observe:'Aircraft nose rises; the displayed horizon moves oppositely.',guard:'Heading does not change this attitude indication.'},
 bank:{start:0,target:20,action:'Set Bank to about +20° (right).',observe:'The right wing lowers; the AI agrees with the aircraft cue.',guard:'Bank is orientation, not angular rate.'},
 heading:{start:359,target:0,action:'Start at 359°, then move to 0° or 1°.',observe:'The card crosses north beneath the fixed lubber line without a long spin.',guard:'Pitch and Bank do not change heading.'},
 altitude:{start:3500,target:5500,action:'Increase Altitude from 3500 to about 5500 ft.',observe:'The Altimeter increases; the height cue rises.',guard:'Height visualization is compressed, not to scale. Altitude is inferred from Ps.'},
 airspeed:{start:110,target:150,action:'Increase Airspeed from 110 to about 150 kt.',observe:'The ASI pointer increases and the relative-reference cue speeds up.',guard:'The aircraft does not translate; no flight dynamics are simulated.'},
 verticalSpeed:{start:0,target:1000,action:'Set Vertical Speed to about +1000, then −1000 ft/min.',observe:'The VSI shows lag, then climb or descent; watch the matching arrow.',guard:'Vertical Speed does not integrate Altitude. These controls are independent.'}
});
export const asiWalkthrough=Object.freeze([
 ['pitot','Pressure reaches the mechanism','Pt enters the capsule; Ps surrounds it in the case.'],
 ['capsule','The sensing element responds','The diaphragm responds to Pt − Ps.'],
 ['gear','Pressure becomes mechanical motion','Capsule displacement drives the conceptual lever / gear.'],
 ['linkage','Linkage moves the pointer','The linkage transmits motion to the pointer shaft.'],
 ['pointer','The pilot reads the indication','The pointer presents inferred airspeed on the calibrated scale.']
]);
export const pressureWalkthrough=Object.freeze([
 ['free-stream','The atmosphere establishes pressure.'],['static-pressure','Static pressure Ps is the measured input.'],['static-line','The static line transmits Ps.'],['altimeter-connection','The aneroid capsule responds to Ps.'],['altimeter-connection','The gear train converts capsule displacement.'],['altimeter-connection','The pilot reads inferred altitude.']
]);
export const bridges=Object.freeze([
 'Now that we know the information a pilot needs, meet the instruments that provide it.',
 'Now connect those indications to visible changes in aircraft state.',
 'You have seen the indications respond. Next, look inside the mechanisms.',
 'The mechanism is one part of a larger chain. Follow the information from source to display.',
 'Compare the chains to see which measurement principles are shared and which differ.',
 'Valid indications depend on valid inputs and references. Now investigate what happens when they degrade.',
 'You have seen faults create symptoms. Next, infer a hidden fault from evidence.',
 'The same measurement problems remain in digital avionics. Compare how modern systems solve them.',
 'Technology changed. The measurement problem did not.'
]);
export const continueLabels=Object.freeze(['Meet the Instruments →','Continue to Aircraft & Instruments →','Continue to Inside the Instruments →','Continue to Measurement Chains →','Continue to Compare Measurement Principles →','Continue to Fault Propagation →','Continue to Troubleshooting →','Continue to Modern Aircraft Instrumentation →','Finish Journey →']);
export const reasoningQuestions=Object.freeze({
 pressure:['What pressure inputs are shared?','Why does the ASI need Pt as well as Ps?','Which displayed quantities are inferred?'],
 references:['Which instrument uses a vertical reference?','Which uses a directional reference?','Why must the two references stay distinct?'],
 rate:['Is heading orientation the same as angular rate?','What does a real TC respond to?','Why is Bank only a teaching proxy here?']
});
export const faultProtocols=Object.freeze({
 'blocked-static':['Set Altitude to 3000 ft.','Predict which instruments share the static path.','Activate Blocked Static — trapped Ps.','Increase Altitude to 7000 ft.','Observe ASI, ALT and VSI; allow the existing VSI lag to settle.','Compare healthy Ps with effective Ps. Explain the common static source.'],
 'blocked-pitot':['Set Airspeed to 110 kt and Altitude to 3000 ft.','Activate Blocked Pitot — trapped Pt.','Increase Airspeed to 150 kt at fixed altitude.','Then increase Altitude to 7000 ft.','Compare live Ps and trapped Pt: the pressure is trapped, not the pointer.','Confirm ALT and VSI still have live static inputs.'],
 'pitot-leak':['Set Airspeed to 110 kt; hold flight controls fixed.','Activate the educational Pitot Leak toward Ps.','Compare 0%, 50% and 100% leak severity.','Observe decreasing ASI response; ALT and VSI remain healthy.','Compare effective Pt with live Ps. This is not a generic leak model.'],
 gyro:['Set Heading to 270°.','Activate HI directional drift.','Observe the heading error grow with time.','Change Heading and compare healthy versus effective heading.','Explain why a smooth, responsive indication can still be wrong. AI and TC remain independent.']
});
export const predictions=Object.freeze({
 heading:{question:'Predict: what happens when Heading crosses north?',choices:['A short card movement','A full revolution','Pitch changes'],observe:'Observe the 359° → 0° / 1° transition. Compare your prediction with the short card movement.'},
 pressure:{question:'Predict: what does the Altimeter directly sense?',choices:['Static pressure','Geometric altitude','Pitot pressure'],observe:'Directly sensed: Static pressure Ps. Displayed / inferred: Altitude.'},
 static:{question:'Predict: which instruments share the blocked static signal?',choices:['ASI only','ASI, Altimeter and VSI','Gyro instruments only'],observe:'Compare the three pressure instruments and healthy / effective Ps after changing altitude.'},
 diagnostic:{question:'Predict before the confirming experiment: which response will help?',choices:['Altimeter response to altitude','Pitch response to heading','TC response to Bank proxy'],observe:'Observe the model-generated indications, then explain which candidate fits the evidence.'}
});
export function stepState(index,count){return {index:Math.max(0,Math.min(count-1,index)),last:index>=count-1};}
export function experimentComplete(key,start,value,northSeen){return key==='heading'?northSeen&&(value===0||value===1):Math.abs(value-start)>= (key==='altitude'?100:key==='airspeed'?5:key==='verticalSpeed'?100:1);}
export const diagnosticSteps=Object.freeze(['Observe','Compare','Hypothesize','Experiment','Diagnose','Explain']);
export function nextDiagnosticStep(index){return Math.min(diagnosticSteps.length-1,index+1);}
export function instrumentInteracted(id,key,before,value){return ['attitude'].includes(id)?['pitch','bank'].includes(key)&&before!==value:instrumentTasks[id][2]===key&&before!==value;}
