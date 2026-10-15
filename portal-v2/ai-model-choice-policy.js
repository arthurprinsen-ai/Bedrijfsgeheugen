// Third-party AI directory policy. Informational claim scope is NEVER tenant execution approval.
// Client decisions control display/request UI only; the signed server-side runtime
// registry and tenant governance remain the sole authority for inference.
export const MODEL_CHOICE_CLASSES=Object.freeze({
 VERIFIED_RESEARCH:'verified-research',
 REVIEW_REQUIRED:'review-required',
 ENTERPRISE_ONLY:'enterprise-only',
 ARCHIVED:'archived',
 CONFLICT:'conflict'
});
const retired=new Set(['eol','deprecated','legacy','retired','shutdown','discontinued']);
const selfHost=new Set(['self-host','on-prem','on-premises','customer cloud','customer-cloud']);
export function classifyAiModelChoice(model={}){
 const id=String(model.id||'').trim();
 const status=String(model.status||'unknown').trim().toLowerCase();
 const deployment=Array.isArray(model.deployment)?model.deployment.map(x=>String(x).toLowerCase()):[];
 const sourceScope=String(model.verification_evidence?.claim_scope||'').toLowerCase();
 const conflict=id==='amazon-nova-premier'
  ||Boolean(model.supplier_audit?.aws_premier_cross_locale_lifecycle_conflict_20261015)
  ||String(model.supplier_audit?.verification_status||'').toUpperCase()==='CONFLICT';
 const purelySelfHost=deployment.length>0&&deployment.every(x=>selfHost.has(x));
 const category=conflict?MODEL_CHOICE_CLASSES.CONFLICT
  :retired.has(status)?MODEL_CHOICE_CLASSES.ARCHIVED
  :purelySelfHost?MODEL_CHOICE_CLASSES.ENTERPRISE_ONLY
  :status!=='active'||model.catalog_alias||model.record_kind==='model_family_placeholder'
   ?MODEL_CHOICE_CLASSES.REVIEW_REQUIRED
  :sourceScope==='full'?MODEL_CHOICE_CLASSES.VERIFIED_RESEARCH
  :MODEL_CHOICE_CLASSES.REVIEW_REQUIRED;
 const requestable=Boolean(id)&&status==='active'&&!conflict
   &&!model.catalog_alias&&model.record_kind!=='model_family_placeholder'
   &&(category===MODEL_CHOICE_CLASSES.VERIFIED_RESEARCH||category===MODEL_CHOICE_CLASSES.REVIEW_REQUIRED);
 const description={
  [MODEL_CHOICE_CLASSES.VERIFIED_RESEARCH]:'Leveranciersclaims geregistreerd; klant- en provideractivatie niet bewezen',
  [MODEL_CHOICE_CLASSES.REVIEW_REQUIRED]:'Aanvullende leverancier-, prijs- of regiocontrole vereist',
  [MODEL_CHOICE_CLASSES.ENTERPRISE_ONLY]:'Uitsluitend eigen hosting/Enterprise; infrastructuur en licentie vereist',
  [MODEL_CHOICE_CLASSES.ARCHIVED]:'Verouderd of beëindigd; alleen voor historie en migratie',
  [MODEL_CHOICE_CLASSES.CONFLICT]:'Tegenstrijdige leveranciersinformatie; niet selecteerbaar'
 }[category];
 return Object.freeze({id,category,requestable,description,autoExecutable:false});
}
export function validateAiModelPreference(ids,models,{maxSelected=5}={}){
 if(!Array.isArray(ids)||ids.length>maxSelected||new Set(ids).size!==ids.length)
  return {ok:false,reason:'INVALID_SELECTION'};
 const byId=new Map(models.map(m=>[m.id,m]));
 for(const id of ids){
  if(typeof id!=='string'||id.length>120||!byId.has(id)||!classifyAiModelChoice(byId.get(id)).requestable)
   return {ok:false,reason:'MODEL_NOT_REQUESTABLE'};
 }
 return {ok:true,selectedIds:[...ids]};
}
export function tallyAiModelChoices(models=[]){
 const counts=Object.fromEntries(Object.values(MODEL_CHOICE_CLASSES).map(k=>[k,0]));
 for(const model of models)counts[classifyAiModelChoice(model).category]++;
 return Object.freeze({total:models.length,...counts});
}
