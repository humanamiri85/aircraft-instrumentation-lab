export const guided={
  normal:['The physical pressure sources are healthy.','Live Pt reaches the ASI.','Live Ps reaches ASI, Altimeter and VSI.','Existing sensing and conversion models produce normal indications.'],
  'blocked-pitot':['The total-pressure path becomes blocked.','The current Pt is captured and trapped.','Airspeed changes alter physical Pt but not delivered Pt.','Altitude changes still alter live Ps.','ASI compares trapped Pt with live Ps, so its indication can change incorrectly.','Healthy Altimeter and VSI suggest a fault upstream in the pitot path.'],
  'blocked-static':['The static system is initially healthy.','The static path becomes blocked.','The current Ps becomes trapped.','Ambient Ps changes with altitude, but trapped Ps does not.','ASI, Altimeter and VSI receive stale static information; VSI lag settles.','The shared symptom pattern suggests a common static-system fault.'],
  'pitot-leak':['A leak connects the delivered pitot signal toward ambient static pressure.','Severity controls the educational blend of Pt and Ps.','Effective q becomes (1 − severity) × healthy q.','ASI progressively under-reads.','Altimeter and VSI remain connected to healthy static pressure.','This models one specified leak, not every possible pressure leak.']
};
export const symptoms=[
 ['Normal','Normal','Normal','Normal','Live Pt / Ps','None'],
 ['Blocked Pitot — trapped Pt','Insensitive to subsequent airspeed-driven Pt changes; can vary with live Ps','Healthy','Healthy','Trapped Pt','Pitot source/path'],
 ['Blocked Static — trapped Ps','Live Pt against trapped Ps; not necessarily frozen','Near activation altitude','Existing lag settles toward zero','Shared trapped Ps','Static source/path'],
 ['Pitot Leak — toward Ps','Progressive under-reading','Healthy','Healthy','Reduced delivered Pt − Ps','Pitot path']
];
export const questions=[
 ['ASI abnormal, Altimeter and VSI normal: which shared path is unlikely to be the problem?','A shared static blockage is less likely; investigate the pitot signal in this simplified set of faults.'],
 ['ASI, Altimeter and VSI all show symptoms: what source do they share?','They share static pressure. An upstream fault can affect three healthy instruments.'],
 ['What distinguishes blocked pitot from blocked static?','Trapped Pt affects ASI only; trapped Ps affects all three instruments. Neither necessarily freezes the ASI pointer.']
];
