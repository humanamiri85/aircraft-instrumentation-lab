export const components=[
  ['free-stream','Free stream','Atmosphere supplies ambient static pressure Ps. Airspeed relative to the free stream supplies the dynamic-pressure reference q.'],
  ['pitot-tube','Pitot tube','The forward-facing opening senses stagnation / total pressure Pt, not dynamic pressure alone.'],
  ['total-pressure','Total pressure Pt','Pt = Ps + q in the incompressible teaching reference. q = ½ρV² uses the existing fixed representative density, not an altitude-dependent density.'],
  ['static-port','Static port','The conceptual side port senses ambient static pressure. Local fuselage pressure coefficients and position error are not modeled.'],
  ['static-pressure','Static pressure Ps','The existing standard-troposphere reference gives decreasing ambient pressure as altitude increases. Altitude is inferred from pressure, not directly sensed.'],
  ['pitot-line','Pitot line','A separate total-pressure signal reaches only the ASI diaphragm interior. This is signal transmission, not continuous bulk airflow through plumbing.'],
  ['static-line','Static line','A separate static-pressure signal reaches the ASI case, altimeter case and VSI static input. The calibrated VSI leak belongs inside the instrument.'],
  ['airspeed-connection','ASI connection','Pt acts inside the differential diaphragm; Ps surrounds it in the case. Their difference is q, converted by the existing linkage into an airspeed indication.'],
  ['altimeter-connection','Altimeter connection','Only Ps reaches the case around the sealed aneroid stack. Capsule motion and gearing produce the altitude indication; the capsules do not directly sense altitude.'],
  ['vsi-connection','VSI connection','Only Ps reaches the direct diaphragm connection and delayed case system. The internal calibrated leak creates the existing normalized pressure lag and vertical-speed indication.']
];
export const steps=[
  ['free-stream','The surrounding atmosphere establishes static pressure.'],
  ['pitot-tube','The pitot tube faces the airflow and senses total pressure.'],
  ['static-port','The static port senses ambient static pressure.'],
  ['static-line','Separate pitot and static lines transmit pressure signals into the aircraft.'],
  ['airspeed-connection','Each instrument receives the pressure inputs required by its sensing mechanism.'],
  ['airspeed-connection','The internal mechanism converts pressure information into a cockpit indication.']
];
export const chains={
  airspeed:[['Measurand / input','Airspeed'],['Pressure source','Pt and Ps'],['Transmission','Pitot + static lines'],['Sensing element','Differential diaphragm'],['Conversion','Mechanical linkage'],['Output','Airspeed indication']],
  altimeter:[['Input condition','Altitude / atmospheric pressure condition'],['Measured physical quantity','Static pressure Ps'],['Transmission','Static line only'],['Sensing element','Sealed aneroid capsule stack'],['Conversion','Gear train'],['Output','Altitude indication']],
  vsi:[['Input condition','Vertical speed / pressure-change trend'],['Measured effect','Rate of static-pressure change'],['Transmission','Static line only'],['Sensing element','Diaphragm + internal calibrated pressure lag'],['Conversion','Mechanical linkage'],['Output','Vertical-speed indication']]
};
export const titles={airspeed:'Airspeed Indicator',altimeter:'Altimeter',vsi:'Vertical Speed Indicator'};
