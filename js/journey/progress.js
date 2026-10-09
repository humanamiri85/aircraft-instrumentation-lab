import {stages,stageAt} from './model.js';
export const storageKey='aircraft-guided-journey-v1';
export const initialProgress=()=>({version:1,index:0,interactions:{},skipped:[]});
export function record(progress,key){const s=stageAt(progress.index);if(!s.required.includes(key))return progress;const items=[...new Set([...(progress.interactions[s.id]||[]),key])];return {...progress,interactions:{...progress.interactions,[s.id]:items}};}
export function completion(progress,index=progress.index){const s=stageAt(index),seen=progress.interactions[s.id]||[];return {done:s.required.filter(x=>seen.includes(x)).length,total:s.required.length,complete:s.required.every(x=>seen.includes(x))};}
export function skip(progress){const id=stageAt(progress.index).id;return {...progress,skipped:[...new Set([...progress.skipped,id])]};}
export function readProgress(storage){
  try{const p=JSON.parse(storage.getItem(storageKey));if(p?.version!==1)return initialProgress();const clean=initialProgress();clean.index=Number.isInteger(p.index)&&p.index>=0&&p.index<stages.length?p.index:0;
    for(const s of stages)clean.interactions[s.id]=Array.isArray(p.interactions?.[s.id])?[...new Set(p.interactions[s.id].filter(x=>s.required.includes(x)))]:[];
    clean.skipped=Array.isArray(p.skipped)?p.skipped.filter(id=>stages.some(s=>s.id===id)):[];return clean;
  }catch{return initialProgress();}
}
export function saveProgress(storage,progress){try{storage.setItem(storageKey,JSON.stringify(progress));return true;}catch{return false;}}
