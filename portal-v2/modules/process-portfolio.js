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
].map(x=>Object.freeze({...x,steps:Object.freeze(x.steps.map(s=>Object.freeze(s.slice())))}))));
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
export function processPortfolioOverview(state,{today=null}={}){
 const items=normalizeProcessPortfolio(state).processes.map(p=>{
  const steps=Array.isArray(p.steps)?p.steps:[];
  const stages=steps.map(s=>processStepState(p,s,{today}));
  return Object.freeze({
   ...p,steps,stages,completeByCustomer:stages.filter(x=>x.submitted).length,
   next:stages.find(x=>x.eligible)||null,
   overdue:stages.filter(x=>x.overdue).length,
   pendingApprovals:stages.filter(x=>x.awaitingApproval).length,
   closedVerified:false
  });
 });
 return Object.freeze({
  items,open:items.length,overdue:items.reduce((n,p)=>n+p.overdue,0),
  pendingApprovals:items.reduce((n,p)=>n+p.pendingApprovals,0),
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
