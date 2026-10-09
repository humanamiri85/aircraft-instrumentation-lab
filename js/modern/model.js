import {systemState as pressureState,routes} from '../measurement/pitot-static/model.js';
import {systemState as gyroState,referenceTypes} from '../measurement/gyro/model.js';
import {instruments as classical} from '../measurement/comparison/model.js';
import {wrapHeading} from '../math.js';

export const views=Object.freeze([['overview','Classical vs Modern'],['air-data','Air Data System'],['ahrs','Attitude / Heading System']]);
export const stages=Object.freeze(['world','sensor','electrical','computer','data','display']);
const mappings={
 airspeed:{system:'air-data',controls:['airspeed'],inputs:routes.airspeed,output:'Computed airspeed',modern:['Pt + Ps','Pressure transducers','Electrical representation → digital conversion','Air Data Computer: pressure-based inference','Digital airspeed value','PFD airspeed tape']},
 altimeter:{system:'air-data',controls:['altitude'],inputs:routes.altimeter,output:'Computed altitude',modern:['Ps only','Static-pressure transducer','Electrical representation → digital conversion','Air Data Computer: atmospheric pressure-to-altitude mapping','Digital altitude value','PFD altitude tape']},
 vsi:{system:'air-data',controls:['verticalSpeed'],inputs:routes.vsi,output:'Vertical-speed related information',modern:['Time-dependent Ps behavior','Static-pressure transducer','Time history of sensed pressure','Air-data processing: pressure trend interpretation','Digital vertical-speed information','PFD vertical-speed presentation']},
 attitude:{system:'ahrs',controls:['pitch','bank'],inputs:[],reference:referenceTypes.attitude,output:'Digital pitch / bank solution',modern:['Aircraft motion / acceleration','Electronic rate gyros + accelerometers','Electronic sensor data','AHRS: attitude solution / vertical-reference concept','Digital pitch / bank values','PFD horizon']},
 heading:{system:'ahrs',controls:['heading'],inputs:[],reference:referenceTypes.heading,output:'Digital heading solution',modern:['Aircraft yaw / heading reference','Inertial sensing + heading aiding concept','Electronic sensor / reference data','AHRS / heading processing: directional-reference concept','Digital heading value','PFD heading tape']},
 turn:{system:'ahrs',controls:['bank'],inputs:[],reference:referenceTypes.turn,output:'Rate-related information — conceptual only',modern:['Real measurand: angular rate; APP CONTROL: Bank proxy only','Electronic rate gyro','Electronic rate information — not simulated','Inertial processing: rate-related information concept','Conceptual rate-related avionics data','Turn information concept; no computed rate in this PFD']}
};
export const quantities=Object.freeze(Object.fromEntries(Object.entries(mappings).map(([id,m])=>[id,Object.freeze({...m,id,title:classical[id].title,targetQuantity:classical[id].targetQuantity,directInput:classical[id].directlySensedQuantity,controls:Object.freeze(m.controls),inputs:Object.freeze([...m.inputs]),reference:m.reference||null,classical:classical[id].chain,modern:Object.freeze(m.modern.map((label,i)=>Object.freeze({element:stages[i],label}))),classicalInferred:classical[id].isInferred,modernOutputKind:id==='turn'?'concept-only':'computed-solution'})])));
// Read-only healthy adapter. Sensor voltages, rate/acceleration streams and an
// AHRS estimator are deliberately NOT fabricated from controlled orientation.
// The application's existing healthy VSI lag is supplied; this module owns no clock or state.
export function systemState(state,lag){
 const air=pressureState(state,lag),gyro=gyroState(state);
 return {air,gyro,pfd:{airspeed:air.airspeed,altitude:air.altitude,verticalSpeed:air.vsiIndicated,pitch:gyro.attitude.pitch,bank:gyro.attitude.bank,heading:gyro.heading.heading},
  validity:{status:'HEALTHY TEACHING REFERENCE',scope:'Ideal source / solution assumed; validity is not simulated or certified.'}};
}
export function headingWindow(heading){return [-20,-10,0,10,20].map(offset=>wrapHeading(heading+offset));}
export function affectedQuantities(keys){return Object.keys(quantities).filter(id=>quantities[id].controls.some(key=>keys.includes(key)));}
