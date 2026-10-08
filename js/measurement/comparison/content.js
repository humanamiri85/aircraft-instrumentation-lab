export const familyContent={
  'pitot-static':{title:'Pitot-static family',chain:['Physical environment','Pressure quantity','Pneumatic transmission','Pressure-sensitive element','Mechanical conversion','Cockpit indication'],note:'Pressure information reaches the mechanism through external ports and plumbing. Airspeed, altitude and vertical speed are inferred from pressure information.'},
  gyroscopic:{title:'Gyroscopic family',chain:['Aircraft motion / orientation','Inertial reference or rate response','Relative motion / gyroscopic response','Mechanical sensing / conversion','Cockpit indication'],note:'Vertical and directional references support orientation indication; a restrained rate gyro responds to angular rate. These instruments do not depend on pitot-static pressure-line transmission.'}
};
export const layers=[['directlySensedQuantity','Physical input / sensing concept'],['sourceOrReference','Source or reference'],['transmission','Transmission / relative motion'],['sensingElement','Sensing element'],['conversion','Transduction / conversion'],['output','Output / indication'],['inference','Directly sensed vs inferred'],['teachingSimplification','Educational simplification']];
export const presets=[
  {title:'Pressure vs orientation',left:'airspeed',right:'attitude',explanation:'ASI infers airspeed from differential pressure; AI indicates orientation relative to a vertical reference. Compare distinct sensing principles, not equivalent physics.'},
  {title:'Inferred altitude vs reference heading',left:'altimeter',right:'heading',explanation:'Altitude is inferred from static pressure; heading is indicated relative to a directional gyro reference. A displayed flight quantity need not be the directly sensed input.'},
  {title:'Dynamic response',left:'vsi',right:'turn',explanation:'VSI uses static-pressure history and calibrated lag. A real TC senses angular rate through precession and restraint. Their response mechanisms differ; Bank is only the TC app proxy.'}
];
export const terminology=[
  ['Measurand','The physical quantity intended to be determined. Distinguish the target flight quantity from the physical input sensed by the instrument.'],
  ['Sensing element','The component that responds to the physical input.'],
  ['Transmission','How measurement information reaches the sensing mechanism.'],
  ['Transduction / conversion','How one physical representation becomes another.'],
  ['Indication','The displayed result.'],
  ['Inference','A displayed quantity calculated or mapped from another measured physical quantity.'],
  ['Reference','A stable physical or conceptual basis used for comparison.']
];
export const questions=[
  ['Does the Altimeter directly sense altitude?','No. Its aneroid capsule responds to static pressure; altitude is inferred using the atmosphere relationship.'],
  ['Why does the ASI need both Pt and Ps?','The differential diaphragm responds to Pt − Ps. Dynamic pressure is then mapped to airspeed using the existing fixed-density relation.'],
  ['Why can the Heading Indicator work without the pitot-static system?','It uses a directional gyro reference and relative case rotation rather than pressure lines.'],
  ['What physical quantity does a real Turn Coordinator respond to?','Angular rate. Bank is only this app’s educational proxy; it is not the real measurand.'],
  ['Which instruments depend on a reference rather than pressure?','AI uses an ideal stabilized vertical reference; HI uses an ideal directional reference. TC instead uses restrained rate response.'],
  ['Which displayed quantities are inferred from another physical quantity?','ASI airspeed, Altimeter altitude and VSI vertical speed are inferred from pressure information. AI and HI use reference-based orientation; a real TC is rate-sensitive.']
];
export const teachingNote='Physical principle: pressure-sensitive mechanisms and gyroscopic rigidity / precession remain distinct. Educational model: all existing Phase 3–4B simplifications and independent controls are preserved. Visual mapping: these compact chains are conceptual teaching representations, not manufacturer-specific hardware. No new physics or formal assessment is introduced.';
