const filled=v=>v!==undefined&&v!==null&&String(v).trim()!=='';
export const CANVAS_TRUTH_STATUSES=Object.freeze(['answered','not_answered','not_asked','not_applicable','derived','insufficient_evidence']);
export function canvasFieldTruth({value,asked=true,applicable=true,derived=false,evidence=false}={}){
 if(!applicable)return Object.freeze({status:'not_applicable',value:null,source:'rule'});
 if(!asked)return Object.freeze({status:'not_asked',value:null,source:'question-flow'});
 if(derived)return Object.freeze({status:evidence?'derived':'insufficient_evidence',value:filled(value)?value:null,source:'powerhouse'});
 return Object.freeze({status:filled(value)?'answered':'not_answered',value:filled(value)?value:null,source:filled(value)?'customer':'missing'});
}
export function normalizeModelTruth({modelId,schemaVersion=1,fields={},fieldRules={},sourcePortal='portal-v2'}={}){
 if(!modelId)throw new TypeError('MODEL_ID_REQUIRED');
 const normalized={};
 for(const [key,value] of Object.entries(fields||{}))normalized[key]=canvasFieldTruth({value,...(fieldRules[key]||{})});
 const answered=Object.values(normalized).filter(x=>x.status==='answered').length;
 const applicable=Object.values(normalized).filter(x=>!['not_applicable','not_asked'].includes(x.status)).length;
 return Object.freeze({modelId,schemaVersion,sourcePortal,fields:Object.freeze(normalized),completion:Object.freeze({answered,applicable,complete:applicable>0&&answered===applicable}),truthContract:'powerhouse-model-truth-v1'});
}
export function customerAnswersOnly(modelTruth={}){
 return Object.fromEntries(Object.entries(modelTruth.fields||{}).filter(([,x])=>x.status==='answered'&&x.source==='customer').map(([key,x])=>[key,x.value]));
}
