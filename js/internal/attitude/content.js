export const components=[
  ['rotor','Rotor','The spinning rotor provides rigidity in space, idealized here as a stable vertical reference.'],
  ['spin','Spin axis','The vertical spin axis stays aligned with world up in this ideal attitude model.'],
  ['inner','Inner gimbal','The inner bearing lets the case pitch relative to the stabilized assembly.'],
  ['outer','Outer gimbal','The outer bearing lets the case bank relative to the stabilized assembly.'],
  ['case','Instrument case','The case is attached to the aircraft and moves with its pitch and bank.'],
  ['horizon','Horizon display','The horizon follows the stabilized reference relative to the moving case through a conceptual linkage.'],
  ['aircraft','Aircraft reference symbol','The fixed aircraft symbol belongs to the case and is compared with the moving horizon.'],
  ['bankScale','Bank scale','The case-fixed marks and moving roll index show bank relative to the horizon.'],
  ['ladder','Pitch ladder','The horizon-linked pitch ladder shows nose-up or nose-down attitude relative to the aircraft symbol.']
];
export const steps=[
  ['rotor','The gyro rotor spins and establishes a stabilized reference.'],
  ['inner','Gimbals allow the aircraft case to move around the rotor.'],
  ['case','In pitch, the aircraft case moves relative to the stabilized gyro.'],
  ['outer','In bank, the aircraft case rolls relative to the stabilized gyro.'],
  ['horizon','The horizon display follows the stabilized reference.'],
  ['aircraft','The fixed aircraft symbol shows attitude relative to that horizon.'],
  ['ladder','The pilot reads pitch and bank from the symbol and horizon relationship.']
];
