import {variables} from '../model.js';
import {instruments} from '../catalog.js';
import {instrumentLinks} from '../education.js';

const stage=(id,title,modules,required,focus)=>Object.freeze({id,title,modules:Object.freeze(modules),required:Object.freeze(required),focus});
export const stages=Object.freeze([
  stage('information','Flight Information',['information'],variables.map(v=>v.key),'airspeed'),
  stage('instruments','Meet the Six Instruments',['cockpit','controls'],instruments.map(i=>i.id),'airspeed'),
  stage('aircraft','Aircraft & Instruments',['cockpit','controls','aircraft'],variables.map(v=>v.key),'attitude'),
  stage('inside','Inside the Instruments',['cockpit','controls','internal'],['pressure','gyro'],'airspeed'),
  stage('chains','Measurement Chains',['cockpit','controls','chain'],['pressure','gyro'],'airspeed'),
  stage('comparison','Compare Measurement Principles',['comparison','controls'],['pressure','references','rate'],'airspeed'),
  stage('faults','When Measurement Goes Wrong',['cockpit','controls','faults'],['pressure','gyro'],'altimeter'),
  stage('diagnostics','Troubleshooting',['diagnostics','controls'],['attempt'],'airspeed'),
  stage('modern','Modern Aircraft Instrumentation',['modern','controls'],['comparison'],'airspeed')
]);
export const focusFor=id=>instrumentLinks[id];
export const familyFor=id=>['airspeed','altimeter','vsi'].includes(id)?'pressure':'gyro';
export function stageAt(index){if(!Number.isInteger(index)||index<0||index>=stages.length)throw new RangeError('Unknown Journey stage');return stages[index];}
export function transition(state,index){stageAt(index);return {...state,index};}
export function cleansTemporaryState(from,to){return from!==to&&['faults','diagnostics'].includes(from);}
