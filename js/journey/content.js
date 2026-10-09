export const introductions={
 information:['How does a pilot know what the aircraft is doing?','Inspect each question. Start with the information a pilot needs, before considering the instruments that provide it.','Pilots need instruments to turn aircraft states into usable information.'],
 instruments:['Meet one instrument at a time.','Follow ASI → Altimeter → VSI → AI → HI → TC. Move the highlighted control, observe, then choose Next Instrument.','Six instruments. One flight picture.'],
 aircraft:['Connect aircraft state to cockpit indications.','Follow the six experiments. Compare each control change with its instrument and the corresponding aircraft cue.','Flight variables are independently controlled in this teaching model. No flight dynamics are simulated.'],
 inside:['The pointer moves — but what makes it move?','Begin with the ASI cutaway: pressure → sensing element → mechanical displacement → linkage → pointer. Then inspect a gyro instrument.','The indication is the end of a mechanism, not a direct view of the physical world.'],
 chains:['What actually carries the information through the system?','Begin with the Altimeter pressure chain, then trace an AI vertical-reference chain. Free exploration follows.','Measured input is different from displayed quantity: static pressure is sensed; altitude is inferred.'],
 comparison:['What is shared? What differs?','Inspect the three guided pairs before choosing your own. Compare the actual input, source/reference, sensing element and inference.','Pressure-based, reference-based and rate-sensitive instruments solve different measurement problems.'],
 faults:['What if the indication looks normal, but the information reaching it is wrong?','Begin with Blocked Static. Activate it, change altitude, and compare healthy pressures with delivered signals. Then explore a gyro/reference fault.','Fault → signal/reference change → propagation → instrument symptom. An upstream fault does not mean every affected instrument failed.'],
 diagnostics:['You have seen how faults create symptoms. Now the fault will be hidden.','Start with the observed symptoms. Build a hypothesis, run a confirming experiment, and explain a diagnosis. The full workspace remains available.','Indication ≠ truth. A plausible, responsive display can still be wrong.'],
 modern:['Do modern aircraft solve these measurement problems the same way?','Compare classical and modern airspeed, then attitude. Ask what changed and what stayed the same; explore the complete system when ready.','Technology changed. The measurement problem did not.']
};
export const questions=[
 ['airspeed','How fast am I going?','Airspeed','The Airspeed Indicator helps a pilot manage speed through the air.'],
 ['altitude','How high am I?','Altitude','The Altimeter presents a pressure-based estimate of altitude.'],
 ['verticalSpeed','Am I climbing or descending?','Vertical Speed','The Vertical Speed Indicator shows a climb or descent indication.'],
 ['pitch','Is the nose up or down?','Pitch','The Attitude Indicator helps show nose-up or nose-down attitude.'],
 ['bank','Am I banking?','Bank','The Attitude Indicator helps show which wing is lower.'],
 ['heading','Which direction am I flying?','Heading','The Heading Indicator presents the direction the aircraft nose points. Heading is not necessarily ground track.']
];
export const aircraftExperiments=[
 ['pitch','attitude','Increase Pitch','Raise the nose and compare the opposite horizon motion with the aircraft pitch cue.'],
 ['bank','attitude','Apply right Bank','Compare the right wing lowering with the attitude indication. Bank is not an angular-rate measurement.'],
 ['heading','heading','Move Heading through north','Move from 359° to 0°. The fixed world compass and rotating card describe the same direction without a long spin.'],
 ['altitude','altimeter','Increase Altitude','Observe the altimeter and compressed height cue. The height visualization is not to scale.'],
 ['airspeed','airspeed','Increase Airspeed','Observe the ASI and faster relative-reference cue; the aircraft itself does not translate.'],
 ['verticalSpeed','vsi','Apply climb / descent','Observe the VSI lag and climb/descent arrow. Vertical speed does not integrate altitude.']
];
export const comparisons=[
 {id:'pressure',left:'airspeed',right:'altimeter',title:'ASI vs Altimeter',note:'Both use pressure, but ASI compares Pt with Ps; the Altimeter uses Ps only. Both displayed quantities are inferred.'},
 {id:'references',left:'attitude',right:'heading',title:'AI vs HI',note:'Both are reference-based. AI uses a vertical reference for pitch/bank; HI uses a directional reference for heading.'},
 {id:'rate',left:'heading',right:'turn',title:'HI vs TC',note:'HI compares orientation with a directional reference. A real TC responds to angular rate; Bank is only this app’s teaching proxy.'}
];
export const faultExercises=[
 ['blocked-static','Blocked Static','Activate at a known altitude, then change altitude. Compare shared static-path symptoms in ASI, ALT and VSI.'],
 ['blocked-pitot','Blocked Pitot — trapped Pt','Activate, then change airspeed at fixed altitude and afterwards change altitude. Pressure is trapped, not the pointer.'],
 ['pitot-leak','Pitot Leak — toward Ps','Hold the controls fixed and change educational leak severity. ASI under-reads; ALT and VSI remain healthy.'],
 ['gyro','Gyro drift / reference degradation','Choose HI drift or AI reference bias, activate, and compare the healthy and effective reference. Drift evolves with time even in reduced motion.']
];
