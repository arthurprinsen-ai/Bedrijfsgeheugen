// Tenant-scoped projection of the original portal.deliveryPlan only.
// Customer completion is never a downstream Brain/Powerhouse/Heartbeat receipt.
export const PROCESS_TEMPLATES=Object.freeze([
 {id:'product-intro',label:'Nieuw product introduceren',steps:[
  ['intake','Doel en eigenaar vaststellen','task',35],
  ['requirements','Vereisten en bronnen verzamelen','task',28],
  ['review','Businesscase laten goedkeuren','approval',21],
  ['prepare','Teams en uitvoering voorbereiden','task',14],
  ['release','Introductie en resultaatmeting plannen','task',0]]},
 {id:'reorder',label:'Herhaalbestelling organiseren',steps:[
  ['demand','Behoefte en voorraad toetsen','task',21],
  ['source','Leverancier en broninformatie toetsen','task',14],
  ['approval','Bestelling laten goedkeuren','approval',10],
  ['fulfilment','Levering en ontvangst opvolgen','task',3],
  ['outcome','Afwijkingen en resultaat vastleggen','task',0]]},
 {id:'private-label',label:'Private-label ontwikkeling',steps:[
  ['brief','Productbrief en vereisten vastleggen','task',60],
  ['sourcing','Leveranciers en specificaties toetsen','task',45],
  ['approval','Design, kosten en risico laten goedkeuren','approval',30],
  ['production','Proefproductie en kwaliteit volgen','task',14],
  ['launch','Vrijgave en effectmeting voorbereiden','task',0]]},
 {id:'service-delivery',label:'Dienstverlening van aanvraag tot resultaat',steps:[
  ['discovery','Vraag, resultaat en eigenaar bevestigen','task',28],
  ['plan','Aanpak en afhankelijkheden bepalen','task',21],
  ['decision','Offerte of plan laten goedkeuren','approval',14],
  ['delivery','Geleverde werkzaamheden registreren','task',7],
  ['measure','Resultaat en vervolgactie beoordelen','task',0]]}
].map(x=>({id:x.id,label:x.label,steps:x.steps.map(s=>s.slice())})));
const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
const validDate=v=>{
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
 const ms=Date.parse(v+'T00:00:00Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===v;
};
const minus=(value,days)=>{
 if(!validDate(value))return null;
 const d=new Date(value+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-days);
 return d.toISOString().slice(0,10);
};
export const normalizeProcessPortfolio=state=>{
 const next=state&&typeof state==='object'&&!Array.isArray(state)?clone(state):{};
 next.processes=Array.isArray(next.processes)?next.processes.filter(x=>x&&typeof x==='object'):[];
 return next;
};
export function instantiateProcess(state,{id,templateId,title,owner='',targetDate=''}={}){
 const next=normalizeProcessPortfolio(state),tpl=PROCESS_TEMPLATES.find(x=>x.id===templateId);
 if(!tpl)throw new Error('PROCESS_TEMPLATE_UNKNOWN');
 if(typeof id!=='string'||!/^p-[a-zA-Z0-9-]{8,90}$/.test(id))throw new Error('PROCESS_ID_REQUIRED');
 if(next.processes.some(p=>p.id===id))return next; // retry without duplicate
 if(!String(title||'').trim()||String(title).trim().length>120)throw new Error('PROCESS_TITLE_REQUIRED');
 if(!String(owner||'').trim())throw new Error('PROCESS_OWNER_REQUIRED');
 if(String(owner).length>120)throw new Error('PROCESS_OWNER_TOO_LONG');
 if(targetDate&&!validDate(targetDate))throw new Error('PROCESS_TARGET_DATE_INVALID');
 const steps=tpl.steps.map(([key,label,kind,days],i)=>({
  id:key,label,kind,dependsOn:i?[tpl.steps[i-1][0]]:[],
  dueDate:targetDate?minus(targetDate,days):null,
  owner:String(owner).trim(),status:'not_started'
 }));
 next.processes.push({
  id,templateId,title:String(title).trim(),owner:String(owner).trim(),
  targetDate:targetDate||null,steps,progressSource:'customer_self_report',
  nextConsumerReceipt:'EVIDENCE_DUE'
 });
 return next;
}
// Customer-controlled owner and planning revision. Exact same source document;
// never manufactures a delivery, approval, Brain acknowledgement or outcome.
export function reviseProcessPlan(state,{processId,owner,targetDate=''}={}){
 const next=normalizeProcessPortfolio(state);
 const process=next.processes.find(item=>item.id===processId);
 if(!process)throw new Error('PROCESS_NOT_FOUND');
 const nextOwner=String(owner??'').trim();
 if(!nextOwner)throw new Error('PROCESS_OWNER_REQUIRED');
 if(nextOwner.length>120)throw new Error('PROCESS_OWNER_TOO_LONG');
 if(targetDate&&!validDate(targetDate))throw new Error('PROCESS_TARGET_DATE_INVALID');
 const nextDate=targetDate||null;
 const previousOwner=String(process.owner||'').trim();
 const changedOwner=nextOwner!==previousOwner;
 const changedDate=nextDate!==(process.targetDate||null);
 if(!changedOwner&&!changedDate)return next;
 const template=PROCESS_TEMPLATES.find(item=>item.id===process.templateId);
 if(changedDate&&!template)throw new Error('PROCESS_REPLAN_TEMPLATE_UNKNOWN');
 const offsets=new Map((template?.steps||[]).map(([key,,kind,days])=>[key,days]));
 process.owner=nextOwner;
 process.targetDate=nextDate;
 process.steps=(Array.isArray(process.steps)?process.steps:[]).map(step=>({
  ...step,
  owner:changedOwner&&(!String(step.owner||'').trim()||String(step.owner).trim()===previousOwner)
    ?nextOwner:step.owner,
  dueDate:changedDate&&offsets.has(step.id)
    ?(nextDate?minus(nextDate,offsets.get(step.id)):null):step.dueDate
 }));
 // Review, submitted intents and original evidence stay intact, not reassessed as approved.
 process.nextConsumerReceipt='EVIDENCE_DUE';
 return next;
}

export function processStepState(process,step,{today=null}={}){
 const dependencies=(step.dependsOn||[]).filter(key=>
  !process.steps.some(s=>s.id===key&&s.status==='submitted'));
 const awaitingApproval=step.kind==='approval'&&step.status==='approval_requested';
 const submitted=step.status==='submitted';
 const eligible=!submitted&&!awaitingApproval&&dependencies.length===0&&Boolean(step.owner||process.owner);
 const overdue=validDate(today)&&validDate(step.dueDate)&&step.dueDate<today&&!submitted;
 return Object.freeze({
  id:step.id,eligible,submitted,awaitingApproval,dependencies,overdue,
  status:submitted?'submitted_not_verified':awaitingApproval?'awaiting_authorized_approval':
   dependencies.length?'waiting_dependency':!step.owner&&!process.owner?'missing_owner':'ready_for_customer_input',
  evidenceVerified:false
 });
}
// Derived read-only inventory from the one original tenant-owned deliveryPlan.
// A client-supplied "verified" flag is never independent consumer evidence.
export function pendingProcessHandoffs(state){
 const pending=[];
 for(const process of normalizeProcessPortfolio(state).processes){
  for(const step of Array.isArray(process.steps)?process.steps:[]){
   if(step.status!=='submitted'&&step.status!=='approval_requested')continue;
   pending.push(Object.freeze({
    processId:String(process.id||''),stepId:String(step.id||''),
    intentId:typeof step.intentId==='string'?step.intentId:null,
    owner:String(step.owner||process.owner||''),
    evidenceState:step.status==='approval_requested'
     ?'AUTHORIZED_APPROVAL_RECEIPT_DUE':'INDEPENDENT_RESULT_DUE'
   }));
  }
 }
 return Object.freeze(pending);
}
export function processPortfolioOverview(state,{today=null}={}){
 const pendingHandoffs=pendingProcessHandoffs(state);
 const items=normalizeProcessPortfolio(state).processes.map(p=>{
  const steps=Array.isArray(p.steps)?p.steps:[];
  const stages=steps.map(s=>processStepState(p,s,{today}));
  return Object.freeze({
   ...p,steps,stages,completeByCustomer:stages.filter(x=>x.submitted).length,
   pendingHandoffs:pendingHandoffs.filter(h=>h.processId===p.id),
   next:stages.find(x=>x.eligible)||null,
   overdue:stages.filter(x=>x.overdue).length,
   pendingApprovals:stages.filter(x=>x.awaitingApproval).length,
   closedVerified:false
  });
 });
 return Object.freeze({
  items,open:items.length,overdue:items.reduce((n,p)=>n+p.overdue,0),
  pendingApprovals:items.reduce((n,p)=>n+p.pendingApprovals,0),
  pendingHandoffsCount:pendingHandoffs.length,
  fullyVerified:0
 });
}
export function recordProcessStepIntent(state,{processId,stepId,action,intentId,observedAt}={}){
 const next=normalizeProcessPortfolio(state),p=next.processes.find(x=>x.id===processId);
 if(!p)throw new Error('PROCESS_NOT_FOUND');
 const s=p.steps?.find(x=>x.id===stepId);
 if(!s)throw new Error('PROCESS_STEP_NOT_FOUND');
 if(!/^i-[a-zA-Z0-9-]{8,90}$/.test(String(intentId||'')))throw new Error('PROCESS_INTENT_ID_REQUIRED');
 if(!Number.isFinite(Date.parse(String(observedAt||''))))throw new Error('PROCESS_INTENT_TIME_REQUIRED');
 if(s.intentId===intentId)return next; // exactly-once client intent projection
 if(!processStepState(p,s).eligible)throw new Error('PROCESS_STEP_NOT_READY');
 if(s.kind==='approval'&&action!=='request')throw new Error('AUTHORIZED_APPROVAL_RECEIPT_REQUIRED');
 if(s.kind!=='approval'&&action!=='submit')throw new Error('PROCESS_ACTION_NOT_ALLOWED');
 s.status=s.kind==='approval'?'approval_requested':'submitted';
 s.intentId=intentId;s.observedAt=observedAt;
 s.evidence={origin:'portal.deliveryPlan',verified:false,downstream:'EVIDENCE_DUE'};
 p.nextConsumerReceipt='EVIDENCE_DUE';
 return next;
}

export function verifiedProcessBrainReceipt(detail,{scope,pending}={}){
 if(typeof scope!=='symbol'||detail?.receiptScope!==scope||pending?.pending!==false)return null;
 if(!Array.isArray(detail?.stored)||!Array.isArray(detail?.impacts))return null;
 const matches=detail.stored.filter(x=>x?.statePath==='portal.deliveryPlan');
 if(matches.length!==1)return null;
 const a=matches[0];
 if(a.stored!==true||a.stale===true||a.authorityStored!==true||a.powerhouseFeedStored!==true||
    a.organismImpactStored!==true||!Number.isSafeInteger(a.bindingGeneration)||a.bindingGeneration<1||
    ![a.sourceRevision,a.brainRecordId,a.currentStateRecordId,a.organismImpactRecordId].every(v=>typeof v==='string'&&v.length>0))return null;
 const impacts=detail.impacts.filter(x=>x?.path==='portal.deliveryPlan'&&
   Number.isSafeInteger(x.generation)&&x.generation>0&&x.evidenceStatus==='OBSERVED_NOT_VERIFIED');
 if(!impacts.length)return null;
 return Object.freeze({status:'BRAIN_INPUT_ACK',sourceRevision:a.sourceRevision,brainRecordId:a.brainRecordId,
  bindingGeneration:a.bindingGeneration,impactGenerations:impacts.map(x=>x.generation),
  providerExecutionVerified:false,measuredOutcomeVerified:false,learningVerified:false});
}
