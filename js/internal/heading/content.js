export const components=[
  ['rotor','Rotor','The spinning rotor provides directional rigidity, idealized here as a stable azimuth reference.'],
  ['spin','Spin axis','The horizontal spin axis maintains its world direction in this idealized yaw projection.'],
  ['inner','Inner gimbal','The inner bearing supports the rotor while allowing relative motion of the surrounding assembly.'],
  ['outer','Outer gimbal','The outer bearing allows the aircraft-mounted case to turn around the directional reference.'],
  ['case','Instrument case','The case is attached to the aircraft and turns with its heading.'],
  ['reference','Directional reference','The gold north reference stays fixed in the world while the case turns around it.'],
  ['drive','Card drive gear / linkage','A conceptual pickoff and gear transmit relative case-to-gyro rotation to the compass card.'],
  ['card','Compass card','The card counter-rotates relative to the case so the selected heading appears at the top.'],
  ['lubber','Lubber line','The fixed lubber line belongs to the case and marks the aircraft heading on the moving card.']
];
export const steps=[
  ['rotor','The gyro rotor spins and establishes a directional reference.'],
  ['outer','The gimbals allow the aircraft case to rotate around the gyro.'],
  ['case','When the aircraft changes heading, the case turns relative to the stabilized gyro.'],
  ['drive','The relative motion drives the compass card.'],
  ['card','The compass card rotates beneath the fixed lubber line.'],
  ['lubber','The number under the lubber line is the indicated heading.']
];
