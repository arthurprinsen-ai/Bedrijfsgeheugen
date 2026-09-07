import { CONNECTOR_TEMPLATES, SOURCE_ADAPTERS, TARGET_ADAPTERS } from './connector-templates.js';

const clone=value=>structuredClone(value);
const SECRET_KEY=/password|secret|token|authorization|api[-_]?key|client[-_]?secret/i;
const SUPPORTED_TRANSFORMS=new Set(['none','trim','lowercase','uppercase','date-format','decimal','currency','lookup','concat','split','constant','default','conditional','formula']);

function templateById(id){return CONNECTOR_TEMPLATES.find(t=>t.id===id);}
function adapterExists(registry,id){return registry.some(a=>a.id===id);}
function walkSecretKeys(value,path='config',out=[]){
  if(!value||typeof value!=='object')return out;
  for(const [key,child] of Object.entries(value)){
    const next=`${path}.${key}`;
    if(SECRET_KEY.test(key))out.push(next);
    if(child&&typeof child==='object')walkSecretKeys(child,next,out);
  }
  return out;
}

export function createConnectorDraft(templateId='blank'){
  const template=templateById(templateId);
  if(!template)throw new Error(`UNKNOWN_CONNECTOR_TEMPLATE:${templateId}`);
  const draft=clone(template);
  return {
    id:null,
    version:1,
    name:draft.name,
    templateId:draft.id,
    state:'Draft',
    source:draft.source,
    documentSchema:draft.documentSchema,
    lookups:draft.lookups||[],
    mappings:draft.mappings||[],
    target:draft.target,
    reviewPolicy:draft.reviewPolicy||{requiredBelowConfidence:.8},
    dedupe:draft.dedupe||{strategy:'content-hash'},
    runtime:{configured:false,evidence:null},
    legacy:draft.legacy||null
  };
}

export function normalizeConnectorDraft(input){
  const draft=clone(input||{});
  draft.version=Number.isInteger(draft.version)&&draft.version>0?draft.version:1;
  draft.state=draft.state||'Draft';
  draft.source=draft.source||{type:'upload',config:{}};
  draft.source.config=draft.source.config||{};
  draft.documentSchema=draft.documentSchema||{id:'custom-document-schema',version:1,name:'Eigen documenttype',fields:[]};
  draft.documentSchema.fields=Array.isArray(draft.documentSchema.fields)?draft.documentSchema.fields:[];
  draft.lookups=Array.isArray(draft.lookups)?draft.lookups:[];
  draft.mappings=Array.isArray(draft.mappings)?draft.mappings:[];
  draft.target=draft.target||{type:'datahub',config:{}};
  draft.target.config=draft.target.config||{};
  draft.reviewPolicy=draft.reviewPolicy||{requiredBelowConfidence:.8};
  draft.dedupe=draft.dedupe||{strategy:'content-hash'};
  draft.runtime=draft.runtime||{configured:false,evidence:null};
  return draft;
}

export function validateConnectorDraft(input){
  const draft=normalizeConnectorDraft(input);
  const errors=[];
  const add=(code,path,message)=>errors.push({code,path,message});

  if(!adapterExists(SOURCE_ADAPTERS,draft.source.type))add('UNKNOWN_SOURCE_ADAPTER','source.type','Onbekende bronadapter.');
  if(!adapterExists(TARGET_ADAPTERS,draft.target.type))add('UNKNOWN_TARGET_ADAPTER','target.type','Onbekende doeladapter.');

  const seen=new Set();
  for(const [index,f] of draft.documentSchema.fields.entries()){
    const key=String(f?.key||'').trim();
    if(!key)add('FIELD_KEY_REQUIRED',`documentSchema.fields.${index}.key`,'Veldsleutel is verplicht.');
    else if(seen.has(key))add('DUPLICATE_FIELD_KEY',`documentSchema.fields.${index}.key`,`Dubbele veldsleutel: ${key}`);
    else seen.add(key);
  }

  for(const path of [...walkSecretKeys(draft.source.config,'source.config'),...walkSecretKeys(draft.target.config,'target.config'),...walkSecretKeys(draft.lookups,'lookups')]){
    add('CLIENT_SECRET_FORBIDDEN',path,'Secrets horen uitsluitend server-side.');
  }

  for(const [index,mapping] of draft.mappings.entries()){
    if(mapping?.required&&!String(mapping?.targetField||'').trim())add('MAPPING_TARGET_REQUIRED',`mappings.${index}.targetField`,'Verplichte mapping mist doelveld.');
    const transformType=mapping?.transformation?.type||'none';
    if(!SUPPORTED_TRANSFORMS.has(transformType))add('UNSUPPORTED_TRANSFORMATION',`mappings.${index}.transformation`,'Alleen gecontroleerde transformaties zijn toegestaan.');
  }

  return {valid:errors.length===0,errors,draft};
}

export function activationEligibility(input,evidence){
  const draft=normalizeConnectorDraft(input);
  if(!evidence)return {eligible:false,reason:'TEST_EVIDENCE_REQUIRED'};
  const complete=Boolean(
    evidence.configVersion===draft.version&&
    evidence.testExecutionId&&
    evidence.sourceReadSuccess===true&&
    evidence.extractionResult?.ok===true&&
    evidence.validationResult?.ok===true&&
    evidence.targetSafeTestResult?.ok===true&&
    evidence.activationTimestamp&&
    evidence.actor
  );
  return complete?{eligible:true,reason:'ELIGIBLE'}:{eligible:false,reason:'TEST_EVIDENCE_INCOMPLETE'};
}
