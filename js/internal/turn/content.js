export const components=[
  ['rotor','Rotor','The spinning rotor responds to aircraft angular rate through gyroscopic precession.'],
  ['spin','Spin axis','The rotor spins about its shaft; this is distinct from the input and permitted deflection axes.'],
  ['gimbal','Restrained gimbal','One permitted axis allows bounded rate-driven deflection against a restoring spring.'],
  ['spring','Restoring spring','The spring resists deflection; its equilibrium load represents conceptual rate magnitude.'],
  ['case','Instrument case','The aircraft-fixed case supports the restrained gyro and spring anchor.'],
  ['linkage','Output linkage','A conceptual pickoff transmits gimbal deflection to the display shaft.'],
  ['shaft','Airplane-symbol shaft','The shaft moves the airplane symbol using the same mapping as the cockpit.'],
  ['marks','Standard-rate reference marks','Real marks indicate standard turn rate; this demo aligns at ±30° Bank only by a simplified teaching mapping.'],
  ['tube','Inclinometer tube','A separate curved tube allows a ball to respond to gravity and lateral acceleration.'],
  ['ball','Ball','Centered indicates coordination and displacement indicates slip/skid; this demo has no lateral-acceleration model.']
];
export const steps=[
  ['rotor','The gyro rotor spins.'],
  ['case','Aircraft rotational motion acts on the restrained gyro.'],
  ['gimbal','Gyroscopic precession produces gimbal deflection about a different permitted axis.'],
  ['spring','A spring resists the deflection.'],
  ['spring','The equilibrium deflection represents turn-rate magnitude and direction; zero input restores center.'],
  ['linkage','Linkage moves the airplane symbol toward the left or right reference mark.'],
  ['ball','The inclinometer ball is a separate device used to assess coordination.']
];
