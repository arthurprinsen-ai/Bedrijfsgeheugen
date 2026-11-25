import {resolveDesiredTenantModel} from '../policy/tenant-ai-default-model.mjs';
import {evaluateTenantModelChoice} from '../policy/tenant-model-choice.mjs';
import {verifySignedRuntimeProof} from '../runtime/attested-cloud-ai.mjs';
import {selectVerifiedAiRuntime} from '../brain/verified-ai-runtime.mjs';

const REQUIRED_SCOPES=['privacy','security','ai_governance','data_residency','supplier_risk','finance',
 'sustainability','csrd_esrs_scope','audit','customer_disclosure'];
const state=(key,label,ok,detail)=>Object.freeze({key,label,status:ok?'COMPLETE':'ACTION_REQUIRED',detail:ok?'Gecontroleerd':detail});
const truthy=v=>typeof v==='string'&&v.trim().length>0;
const withinEU=value=>['EU','NL','DE'].includes(value);

/**
 * Read-only, tenant-authenticated model-activation readiness. A verified public
 * supplier claim, customer checkbox or desire to use a model is never a proof.
 * This function does not produce signed receipts, credentials, approvals or egress.
 * "readyForTest" means the preflight is satisfied; no provider invocation occurs.
 */
export function evaluateTenantAiActivation({
 tenantId,portalRecord,catalog,supplierStatus,registryRecord,proofKey,sovereigntySnapshot,
 now=Date.now()
}={}){
 const items=[];
 const record=portalRecord?.tenantId===tenantId?portalRecord:null;
 const prefs=record?.data?.portal?.aiModelPreferences;
 const choice=resolveDesiredTenantModel(prefs,'brain');
 const id=choice.ok?choice.modelId:null;
 const model=id?catalog?.models?.find(m=>m.id===id):null;
 const supplierOkay=Boolean(model&&supplierStatus?.records?.[id]==='VERIFIED'&&
  model.status==='active'&&truthy(model.provider_api_id));
 const activation=record?.data?.portal?.aiModelActivationRequest;
 const requested=Boolean(choice.ok&&activation?.requestState==='REQUESTED'&&
  activation?.modelId===choice.modelId&&activation?.routeId===choice.routeId&&
  Number.isFinite(Date.parse(activation?.requestedAt)));
 items.push(state('model','Standaardmodel en verwerkingsroute',choice.ok,
  'Kies een standaardmodel, selecteer een providerroute en bewaar de instellingen.'));
 items.push(state('supplier','Modelidentiteit en leverancierbewijs',supplierOkay,
  'Het model is nog niet actueel en volledig geverifieerd. PARTIAL en CONFLICT zijn niet inzetbaar.'));
 items.push(state('request','Activering aangevraagd door de klant',requested,
  'Vraag de activering aan vanuit je aangemelde klantomgeving. Zonder aanvraag blijft het een wensenlijst.'));
 let profile=sovereigntySnapshot?.policy?.ai_deployment_profile;
 const policy=sovereigntySnapshot?.policy;
 const violations=sovereigntySnapshot?.violations;
 const preference=prefs?.policy||'eu-both';
 const profileEu=profile&&withinEU(profile.computeRegion)&&withinEU(profile.storageRegion)&&
   (withinEU(profile.ragRegion)||(profile.ragRegion==='SAME_AS_STORAGE'&&withinEU(profile.storageRegion)));
 const storageEu=profile&&withinEU(profile.storageRegion)&&
   (withinEU(profile.ragRegion)||(profile.ragRegion==='SAME_AS_STORAGE'&&withinEU(profile.storageRegion)));
 const sovereigntyOk=Boolean(policy&&profile&&Array.isArray(violations)&&violations.length===0&&
  policy.enforcement_mode!=='OFF'&&
  (preference==='eu-both'?policy.mode==='EU_ONLY'&&profileEu:
   preference==='eu-storage'?['EU_ONLY','EU_STORAGE'].includes(policy.mode)&&storageEu:
   preference==='review'?true:false));
 items.push(state('sovereignty','Opslag, verwerking en datasoevereiniteit',sovereigntyOk,
  'Een aantoonbare tenantpolicy en daadwerkelijk toegestane uitvoeringsregio zijn vereist. EU-marketingclaims zijn niet genoeg.'));
 const registryOk=Boolean(registryRecord&&typeof proofKey==='string'&&proofKey.length>=32&&
  registryRecord.signedProof&&registryRecord.config);
 items.push(state('provider','Beveiligde providerconfiguratie',registryOk,
  'Een bevoegde beheerder moet het provideraccount en de beveiligde runtimeverbinding onafhankelijk valideren.'));
 let receipt=null;
 if(registryOk&&Number.isSafeInteger(Number(policy?.policy_version))&&profile){
  try{receipt=verifySignedRuntimeProof({
   signed:registryRecord.signedProof,key:proofKey,tenantId,useCaseId:'portal-project-answer',
   policyVersion:Number(policy.policy_version),profile,now
  });}catch{}
 }
 let exactProof=false;
 if(receipt&&choice.ok&&supplierOkay&&sovereigntyOk){
  const modelChoice=evaluateTenantModelChoice({
   tenantId,portalRecord:record,sovereigntyPolicy:policy,registryRecord,catalog,supplierStatus
  });
  try{
   const route=selectVerifiedAiRuntime({tenantId,profile,receipt,now});
   exactProof=modelChoice.ok===true&&route.modelId===model.provider_api_id;
  }catch{}
 }
 items.push(state('proof','Ondertekend actueel runtime- en modelbewijs',exactProof,
  'Er ontbreekt een onafhankelijk gecontroleerd, niet-verlopen bewijs voor precies dit model en deze klant.'));
 const approval=registryRecord?.crossDomainApproval;
 const approvalOk=Boolean(receipt&&approval&&approval.tenantId===tenantId&&
  approval.changeId===receipt.changeId&&approval.policyVersion===receipt.policyVersion&&
  approval.customerConsentId===receipt.customerConsentId&&approval.status==='CLEARED'&&
  Number.isFinite(approval.validUntil)&&approval.validUntil>now&&
  Array.isArray(approval.approvedScopes)&&REQUIRED_SCOPES.every(x=>approval.approvedScopes.includes(x))&&
  Array.isArray(approval.evidenceIds)&&approval.evidenceIds.includes(receipt.evidenceId));
 items.push(state('approval','AVG, klanttoestemming, AI Act en contractgoedkeuring',approvalOk,
  'De onafhankelijke klant- en governancegoedkeuring is nog niet volledig aangetoond.'));
 const endpoint=receipt&&registryRecord?.approvedEndpoints?.find(e=>e.endpointId===receipt.endpointId);
 const provision=receipt&&registryRecord?.config?.[receipt.provider];
 const endpointOk=Boolean(receipt&&provision&&endpoint&&endpoint.enabled===true&&
  endpoint.tenantId===tenantId&&endpoint.provider===receipt.provider&&
  endpoint.networkMode===receipt.networkMode&&
  truthy(endpoint.region)&&
  provision.providerReadbackEvidenceId===receipt.providerReadbackEvidenceId&&
  provision.egressEvidenceId===receipt.egressEvidenceId&&
  (receipt.provider!=='MISTRAL_API'||receipt.computeRegion!=='EU'||
   (provision.processingRegion==='EU'&&
    provision.residencyEvidenceId===receipt.residencyEvidenceId))&&
  (receipt.computeRegion==='AUTO'||endpoint.region===receipt.computeRegion));
 items.push(state('endpoint','Endpoint- en accountbewijsregistratie',endpointOk,
  'De providerroute moet met echte accountrechten, endpoint en bewijsregistratie worden gevalideerd.'));
 const riskOk=prefs?.aiRisk==='standard'&&truthy(prefs.useCase)&&prefs.useCase.length>=8;
 items.push(state('application','Toepassingsdoel en eerste AI Act-classificatie',riskOk,
  'Omschrijf het gebruiksdoel en beoordeel het toepassingsrisico; mogelijke hoog-risicotoepassingen vereisen aparte beoordeling.'));
 return Object.freeze({
  status:items.every(x=>x.status==='COMPLETE')?'READY_FOR_AUTHORIZED_TEST':'REVIEW_REQUIRED',
  readyForTest:items.every(x=>x.status==='COMPLETE'),
  selectedModelId:id,
  selectedRouteId:choice.ok?choice.routeId:null,
  reviewRequested:requested,
  checks:items,
  note:'Dit is een read-only beveiligingscontrole, geen activatie of bewijs van een geslaagde provideroproep.'
 });
}
