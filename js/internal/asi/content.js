export const components = [
  ['pitot', 'Pitot pressure inlet', 'Total pressure Pt enters the capsule through the pitot connection.'],
  ['static', 'Static pressure', 'Static pressure Ps fills the case around the capsule and provides the reference.'],
  ['capsule', 'Diaphragm / capsule', 'Deforms in response to the pressure difference between pitot and static pressure.'],
  ['linkage', 'Mechanical linkage', 'The connecting link transmits capsule displacement to the pivoted lever.'],
  ['gear', 'Gear / lever', 'A conceptual lever and sector gear transmit motion to the pointer mechanism.'],
  ['shaft', 'Pointer shaft', 'The shaft carries rotation from the mechanism to the front pointer.'],
  ['pointer', 'Pointer', 'Rotates to the same indicated airspeed as the cockpit ASI.'],
  ['dial', 'Dial', 'The calibrated teaching scale converts pointer position into an airspeed reading.']
];
export const steps = [
  ['pitot', 'Aircraft motion creates total pressure at the pitot tube.'],
  ['static', 'Static pressure acts as the reference pressure.'],
  ['capsule', 'The pressure difference acts across the diaphragm.'],
  ['capsule', 'The diaphragm deflects.'],
  ['linkage', 'Mechanical linkage amplifies/transmits motion.'],
  ['pointer', 'The pointer rotates over the calibrated airspeed scale.']
];
