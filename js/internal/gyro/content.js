export const gyroInstruments = ['attitude','heading','turn'];
export const modes = [['assembly','Gyro Assembly'],['axes','Axis View'],['rigidity','Rigidity Demo']];
export const components = [
 ['rotor','Rotor','The wheel spins to establish angular momentum along its spin axis.'],
 ['spin','Spin axis','The rotor axis stays pointed toward the fixed north reference in this ideal demonstration.'],
 ['inner','Inner gimbal','The inner ring pivots about its lateral bearing axis to let the rotor move relative to the outer ring.'],
 ['outer','Outer gimbal','The outer ring pivots about the body vertical bearing axis to support relative motion.'],
 ['body','Aircraft/body frame','The labeled nose, right-wing and up axes follow the existing aircraft Pitch, Bank and Heading controls.'],
 ['instrument','Instrument frame','The dashed mounting frame is attached to the aircraft and provides the reference for a future indication mechanism.']
];
export const steps = [
 ['rotor','The rotor spins at high speed.'],
 ['spin','The spinning rotor establishes an angular-momentum axis.'],
 ['spin','The gyro tends to maintain its orientation in inertial space.'],
 ['body','The aircraft moves relative to the stabilized gyro reference.'],
 ['instrument','Instrument mechanisms convert this relative motion into an indication.']
];
export const conceptNote = 'Gyroscope behavior is shown conceptually; detailed torque and precession dynamics are introduced later.';
