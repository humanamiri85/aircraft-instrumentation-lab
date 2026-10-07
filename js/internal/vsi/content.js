export const components=[
  ['static','Static pressure inlet','Ambient static pressure reaches the diaphragm directly and the case through a restriction.'],
  ['diaphragm','Diaphragm','The diaphragm follows static pressure quickly and flexes under the difference from surrounding case pressure.'],
  ['case','Instrument case','The case surrounds the diaphragm with pressure that responds more slowly.'],
  ['leak','Calibrated leak','The restriction delays case-pressure changes and allows eventual equalization when pressure stops changing.'],
  ['difference','Pressure difference','Case pressure minus diaphragm pressure is positive in climb and negative in descent.'],
  ['linkage','Mechanical linkage','The conceptual linkage transmits diaphragm displacement to the pointer mechanism.'],
  ['shaft','Pointer shaft','The shaft carries the mechanism rotation to the pointer.'],
  ['pointer','Pointer','The pointer uses the same climb and descent calibration as the cockpit VSI.'],
  ['dial','Dial','The scale reads vertical speed in thousands of feet per minute.']
];
export const steps=[
  ['static','Static pressure enters the VSI system.'],
  ['diaphragm','The diaphragm responds rapidly to pressure change.'],
  ['leak','Case pressure changes more slowly through the calibrated leak.'],
  ['difference','A temporary pressure difference develops.'],
  ['linkage','The diaphragm deflects and moves the linkage.'],
  ['pointer','The pointer indicates climb or descent rate.'],
  ['case','When altitude stops changing, pressures equalize and the pointer returns to zero.']
];
