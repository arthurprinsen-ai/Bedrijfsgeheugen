import { fieldMarkup, bindFields } from '../form-primitives.js';
import { calculateCompletion } from '../completion.js';

export const PROFILE_DIMENSIONS=Object.freeze([
 {id:'sturing',label:'Strategie en sturing',weeklyHours:1.6,top:4},
 {id:'commercie',label:'Commercie en klant',weeklyHours:2.8,top:4},
 {id:'operatie',label:'Operatie en levering',weeklyHours:3.4,top:4},
 {id:'finance',label:'Finance',weeklyHours:3.6,top:4},
 {id:'mensen',label:'Mensen en kennis',weeklyHours:1.5,top:4},
 {id:'analytics',label:'Stuurinformatie',weeklyHours:2.2,top:4},
 {id:'quality',label:'Datakwaliteit',weeklyHours:1.9,top:4},
 {id:'governance',label:'Governance',weeklyHours:1.2,top:3},
 {id:'tech',label:'Systemen en AI',weeklyHours:4.1,top:4},
 {id:'culture',label:'Organisatie en cultuur',weeklyHours:1.1,top:3},
 {id:'service',label:'Klantenservice',weeklyHours:2.4,top:4},
 {id:'security',label:'Beveiliging',weeklyHours:1.3,top:4},
 {id:'duurzaam',label:'Duurzaamheid en CSRD',weeklyHours:1.0,top:3}
]);

const FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
const profilePath=key=>`portal.profile.${key}`;
const maturityPath=id=>`portal.profile.maturity.${id}`;

const PROFILE_SCHEMA=Object.freeze([
 {id:'employees',legacyFieldId:'mw',label:'Medewerkers',type:'number',path:profilePath('employees'),min:1,max:250,required:true,help:'Aantal medewerkers in de organisatie.'},
 {id:'hourlyCost',legacyFieldId:'uur',label:'Uurkosten (€)',type:'currency',path:profilePath('hourlyCost'),min:20,max:200,required:true,help:'Gemiddelde interne uurkosten voor capaciteitsberekeningen.'},
 ...PROFILE_DIMENSIONS.map(item=>Object.freeze({id:item.id,legacyFieldId:`s-${item.id}`,label:item.label,type:'range',path:maturityPath(item.id),min:1,max:5,required:true,help:`Niveau 1–5 · referentiedoel ${item.top}.`}))
]);

export function companyInputSchema(pageId='profiel'){
 if(['profiel','gegevens-invullen','ingevulde-gegevens'].includes(pageId))return [...PROFILE_SCHEMA];
 return [];
}

function valueAt(state,path){return String(path).split('.').reduce((value,key)=>value==null?undefined:value[key],state)}
function safeLevel(value){const n=Math.round(Number(value)||1);return Math.max(1,Math.min(5,n))}

export function profileOverviewMetrics(state={}){
 const profile=state?.portal?.profile||{};
 const employees=Math.max(1,Number(profile.employees)||24);
 const hourlyCost=Math.max(0,Number(profile.hourlyCost)||52);
 let weeklyManualHours=0;let maturityTotal=0;
 for(const item of PROFILE_DIMENSIONS){
  const level=safeLevel(profile.maturity?.[item.id]);
  maturityTotal+=level;
  weeklyManualHours+=item.weeklyHours*FACTOR[level]*(employees/24);
 }
 const annualManualHours=weeklyManualHours*46;
 return Object.freeze({
  averageMaturity:maturityTotal/PROFILE_DIMENSIONS.length,
  weeklyManualHours,
  annualManualHours,
  annualManualCost:annualManualHours*hourlyCost,
  fteLost:annualManualHours/1600,
  weeksPerYear:46,
  capacityNotCash:true
 });
}

function euro(value){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0)}
function number(value,digits=0){return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value||0)}

function renderAnalysis(root,state){
 const metrics=profileOverviewMetrics(state);
 root.innerHTML=`<div class="v2profilemetrics"><article><small>Gemiddeld niveau</small><strong>${number(metrics.averageMaturity,1)}</strong><span>over 13 onderdelen</span></article><article><small>Handmatig werk per jaar</small><strong>${number(metrics.annualManualHours)} uur</strong><span>46 weken als conservatieve jaarbasis</span></article><article><small>Capaciteit</small><strong>${number(metrics.fteLost,1)} fte</strong><span>ruimte die je terugkrijgt, geen cashbesparing</span></article><article><small>Indicatieve uurwaarde</small><strong>${euro(metrics.annualManualCost)}</strong><span>capaciteitswaarde op basis van ingevoerde uurkosten</span></article></div>`;
}

function renderReview(root,state,schema){
 root.innerHTML=`<div class="v2reviewlist">${schema.map(field=>{const value=valueAt(state,field.path);return `<article><div><small>${field.legacyFieldId}</small><b>${field.label}</b></div><strong>${value==null||value===''?'Nog niet ingevuld':String(value)}</strong></article>`}).join('')}</div>`;
}

function renderForm(root,state,schema){
 root.innerHTML=`<div class="v2completion"></div><div class="v2formgrid">${schema.map(field=>fieldMarkup(field,valueAt(state,field.path)??(field.type==='range'?1:''))).join('')}</div><div class="v2formactions"><button type="button" class="pvprimary" data-save-company>Opslaan</button><span data-save-message>Wijzigingen worden in je beveiligde portaalstatus opgeslagen.</span></div>`;
 const completion=calculateCompletion(schema,state);const box=root.querySelector('.v2completion');if(box)box.innerHTML=`<strong>${completion.percentage}% compleet</strong><span>${completion.complete} van ${completion.total} verplichte velden ingevuld</span>`;
}

export function mountCompanyInput(root,{pageId='profiel',domainState,onSaveStatus}={}){
 if(!root?.querySelectorAll)throw new TypeError('COMPANY_INPUT_ROOT_REQUIRED');
 const schema=companyInputSchema(pageId);
 const state=domainState?.get?.()||{};
 if(pageId==='ingevulde-gegevens'){
  renderReview(root,state,schema);
  return Object.freeze({schema,refresh:()=>renderReview(root,domainState?.get?.()||{},schema)});
 }
 renderForm(root,state,schema);
 const unbind=bindFields(root,schema,{onChange:(field,value)=>{
  domainState?.set?.(field.path,value);
  onSaveStatus?.(domainState?.status?.()||'dirty');
  const completion=calculateCompletion(schema,domainState?.get?.()||{});const box=root.querySelector('.v2completion');if(box)box.innerHTML=`<strong>${completion.percentage}% compleet</strong><span>${completion.complete} van ${completion.total} verplichte velden ingevuld</span>`;
 }});
 const save=root.querySelector('[data-save-company]');
 save?.addEventListener('click',async()=>{
  const message=root.querySelector('[data-save-message]');
  try{onSaveStatus?.('saving');if(message)message.textContent='Opslaan…';await domainState?.flush?.();onSaveStatus?.('saved');if(message)message.textContent='Opgeslagen';}
  catch(error){onSaveStatus?.('error');if(message)message.textContent='Opslaan mislukt — je invoer blijft bewaard. Probeer opnieuw.';}
 });
 return Object.freeze({schema,destroy:unbind,refresh:()=>renderForm(root,domainState?.get?.()||{},schema)});
}

export function renderProfileAnalysis(root,{domainState}={}){renderAnalysis(root,domainState?.get?.()||{})}
