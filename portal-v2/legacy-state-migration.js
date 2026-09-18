import { migrateLegacyState } from './legacy-parity-engine.js';

const isObject=v=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
const clone=v=>v==null?v:structuredClone(v);
function mergeMissing(target,source){
 if(!isObject(source))return target;
 const out=isObject(target)?clone(target):{};
 for(const [key,value] of Object.entries(source)){
  if(out[key]===undefined)out[key]=clone(value);
  else if(isObject(out[key])&&isObject(value))out[key]=mergeMissing(out[key],value);
 }
 return out;
}
function setPath(root,path,value){const keys=path.split('.');let x=root;for(let i=0;i<keys.length-1;i++)x=x[keys[i]]??={};if(x[keys.at(-1)]===undefined)x[keys.at(-1)]=clone(value)}

const COLLECTIONS={
 asRijen:'portal.aiScan.tasks',inCijfers:'portal.inputs.financials',inFin:'portal.inputs.financing',inKlanten:'portal.inputs.customers',inMetingen:'portal.inputs.measurements',inBeleid:'portal.inputs.policies',inEsg:'portal.inputs.sustainability',antwLijst:'portal.inputs.answers',
 beleidLijst:'portal.compliance.policies',esgVelden:'portal.compliance.esg',aicap:'portal.aiCapabilities',aicapUitScan:'portal.aiCapabilitySources',canvasKaarten:'portal.canvases',ddInhoud:'portal.dueDiligence.findings',wijzigingen:'portal.changes.items',modelKeuze:'portal.advice.modelFilter',roadmapItems:'portal.roadmap.items',uitvoering:'portal.execution.completed'
};
const DNA={dnaVrij:'freeText',dnaZoek:'search',ecNaam:'name',ecDim:'dimension',ecAfd:'department',ecProc:'process',ecData:'data',ecSys:'system',ecAi:'ai',ecGov:'governance',ecKpi:'kpi',ecProj:'project',ecThema:'theme'};
const LEGACY_POLICY_KEYS=['infosec','toegang','incident','backup','avg','verwerker','aibeleid','datadef','rapport','leverancier','csrd','continu'];
const LEGACY_POLICY_STATUS=['ontbreekt','concept','vastgesteld','geoefend'];
const LEGACY_ESG_KEYS=['energie','co2','afval','water','vervoer','arbo','divers','opleiding','keten','ethiek','bestuur'];
const LEGACY_CANVAS_IDS=['bmc','vpc2','lean','merk','content','sales2'];
const LEGACY_ROOT_KEYS=Object.freeze(['legacy','niveaus','mw','uur','taken','start','branche','omzet','mensen','cijfers','bc','eigen','beleid','fin','modellen','uitvoering','kto','metingen','esg','eigenCaps','prod','beheer','besluiten','docs','log','dd','wijz','aicap','aicapDatum','aicapStempel','aicapUitScan','scanStempel','scanDatum','scanScore','medewerkers','uurkosten']);

function numericOrRaw(value){
 if(value===null||value===undefined||value==='')return value;
 const number=Number(value);return Number.isFinite(number)?number:value;
}
function mapObjectFields(target,source,mapping){
 if(!isObject(source))return;
 for(const [legacyKey,path] of Object.entries(mapping))if(source[legacyKey]!==undefined)setPath(target,path,numericOrRaw(source[legacyKey]));
}
function normalizeLegacyMeasurement(item,index){
 if(!isObject(item))return item;
 return {id:String(item.id??`legacy-measurement-${index+1}`),date:item.date??item.d??'',type:item.type??item.s??'',value:numericOrRaw(item.value??item.v),note:item.note??item.n??''};
}
function normalizeLegacyRoadmapItem(item,index){
 if(!isObject(item))return item;
 const done=Boolean(item.done??item.klaar);
 return {id:String(item.id??`legacy-roadmap-${index+1}`),title:item.title??item.t??item.naam??`Actie ${index+1}`,dimension:item.dimension??item.dim??'',start:numericOrRaw(item.start??item.s??1),duration:numericOrRaw(item.duration??item.d??1),owner:item.owner??item.eigenaar??'',progress:item.progress!==undefined?numericOrRaw(item.progress):(done?100:0),done};
}
function migrateRawLegacyCollections(upgraded,legacy){
 if(isObject(legacy.niveaus))setPath(upgraded,'portal.profile.maturity',legacy.niveaus);
 const employees=legacy.mw??legacy.medewerkers;if(employees!==undefined)setPath(upgraded,'portal.profile.employees',numericOrRaw(employees));
 const hourly=legacy.uur??legacy.uurkosten;if(hourly!==undefined)setPath(upgraded,'portal.profile.hourlyCost',numericOrRaw(hourly));
 if(legacy.branche!==undefined){setPath(upgraded,'portal.market.industry',legacy.branche);setPath(upgraded,'portal.profile.industry',legacy.branche);}
 if(legacy.omzet!==undefined)setPath(upgraded,'portal.profile.revenue',numericOrRaw(legacy.omzet));

 mapObjectFields(upgraded,legacy.mensen,{mVerzuim:'portal.people.absence',mVerloop:'portal.people.turnover',mEnps:'portal.people.enps',mMto:'portal.people.mto',mVac:'portal.people.vacancies'});
 mapObjectFields(upgraded,legacy.cijfers,{cOmzet:'portal.metrics.revenue',cBrutomarge:'portal.metrics.grossMargin',cEbitda:'portal.metrics.ebitda',cLoon:'portal.metrics.wages',cKlanten:'portal.metrics.customers',cGrootste:'portal.metrics.largestCustomer',cMarketing:'portal.metrics.marketing',cNieuw:'portal.metrics.newCustomers',cDso:'portal.metrics.dso',cIt:'portal.metrics.it'});
 mapObjectFields(upgraded,legacy.bc,{bDoel:'portal.businessCase.target',bUitstel:'portal.businessCase.delay'});
 if(isObject(legacy.bc)&&legacy.bc.bInvest!==undefined)setPath(upgraded,'portal.businessCase.investment',Number(legacy.bc.bInvest)*1000);
 mapObjectFields(upgraded,legacy.fin,{wSchuld:'portal.valueFinance.debt',wCash:'portal.valueFinance.cash',wEV:'portal.valueFinance.equity',wBalans:'portal.valueFinance.balance',wVast:'portal.valueFinance.fixed',wRente:'portal.valueFinance.interest',wMultiple:'portal.valueFinance.multiple',wWacc:'portal.valueFinance.wacc'});
 mapObjectFields(upgraded,legacy.prod,{pDeclarabel:'portal.metrics.performance.billable',pOtif:'portal.metrics.performance.onTime',pFout:'portal.metrics.performance.defects',pDoorloop:'portal.metrics.performance.leadTime',pOrders:'portal.metrics.performance.orders',pOfferte:'portal.metrics.performance.quoteConversion',pOpleiding:'portal.metrics.performance.training',pVerloopKlant:'portal.metrics.performance.churn'});
 mapObjectFields(upgraded,legacy.kto,{kNps:'portal.metrics.nps',kTevreden:'portal.metrics.satisfaction',kHerhaal:'portal.metrics.repeat',kKlacht:'portal.metrics.complaints'});

 if(Array.isArray(legacy.metingen)){
  const measurements=legacy.metingen.map(normalizeLegacyMeasurement);
  setPath(upgraded,'portal.metrics.measurements',measurements);
  setPath(upgraded,'portal.inputs.measurements',measurements);
 }
 if(Array.isArray(legacy.taken))setPath(upgraded,'portal.roadmap.items',legacy.taken.map(normalizeLegacyRoadmapItem));

 if(isObject(legacy.eigen)){
  for(const id of LEGACY_CANVAS_IDS)if(legacy.eigen[id]!==undefined)setPath(upgraded,`portal.canvases.${id}.answer`,legacy.eigen[id]);
  setPath(upgraded,'portal.migration.legacyOwnAnswers',legacy.eigen);
 }
 if(isObject(legacy.beleid)){
  setPath(upgraded,'portal.compliance.policies',LEGACY_POLICY_KEYS.map(key=>LEGACY_POLICY_STATUS[Math.max(0,Math.min(3,Number(legacy.beleid[key])||0))]));
  setPath(upgraded,'portal.compliance.policyByKey',legacy.beleid);
 }
 if(isObject(legacy.esg)){
  setPath(upgraded,'portal.compliance.esg',LEGACY_ESG_KEYS.map(key=>numericOrRaw(legacy.esg[key]??0)));
  setPath(upgraded,'portal.compliance.esgByKey',legacy.esg);
 }
 if(isObject(legacy.aicap))setPath(upgraded,'portal.aiCapabilities',legacy.aicap);
 if(isObject(legacy.aicapUitScan))setPath(upgraded,'portal.aiCapabilitySources',legacy.aicapUitScan);
 if(legacy.aicapStempel!==undefined)setPath(upgraded,'portal.aiCapabilityMeta.scanStamp',legacy.aicapStempel);
 if(legacy.aicapDatum!==undefined)setPath(upgraded,'portal.aiCapabilityMeta.scanDate',legacy.aicapDatum);

 if(isObject(legacy.modellen))setPath(upgraded,'portal.advice.modelFilter',legacy.modellen);
 if(isObject(legacy.uitvoering))setPath(upgraded,'portal.execution.completed',legacy.uitvoering);
 if(isObject(legacy.eigenCaps))setPath(upgraded,'portal.strategy.customCapabilities',legacy.eigenCaps);
 if(isObject(legacy.beheer))setPath(upgraded,'portal.freshness.byDimension',legacy.beheer);
 if(Array.isArray(legacy.besluiten))setPath(upgraded,'portal.freshness.decisions',legacy.besluiten);
 if(Array.isArray(legacy.docs))setPath(upgraded,'portal.freshness.documents',legacy.docs);
 if(Array.isArray(legacy.log))setPath(upgraded,'portal.changes.history',legacy.log);
 if(Array.isArray(legacy.wijz))setPath(upgraded,'portal.changes.items',legacy.wijz);
 if(isObject(legacy.dd)){setPath(upgraded,'portal.dueDiligence.dataRoomChecks',legacy.dd.vink||{});setPath(upgraded,'portal.dueDiligence.legacy',legacy.dd);}
 if(isObject(legacy.offerte))setPath(upgraded,'portal.offer',legacy.offerte);
 if(legacy.scanStempel!==undefined)setPath(upgraded,'portal.profile.scan.stamp',legacy.scanStempel);
 if(legacy.scanDatum!==undefined)setPath(upgraded,'portal.profile.scan.date',legacy.scanDatum);
 if(legacy.scanScore!==undefined)setPath(upgraded,'portal.profile.scan.score',legacy.scanScore);
}

export function readLegacyPortalStateForUser(storage=globalThis.localStorage,user=null){
 if(!storage||typeof storage.getItem!=='function')return null;
 const email=String(user?.email||'').trim().toLowerCase();
 if(!email)return null;
 const key=`bg_portaal_${email}`;
 try{
  const raw=storage.getItem(key);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  return isObject(parsed)?parsed:null;
 }catch{return null}
}

export function mergeLegacyPortalStateIntoCanonical(canonical={},legacy={}){
 const current=isObject(canonical)?clone(canonical):{};
 if(!isObject(legacy)||!hasLegacyPortalData(legacy))return current;
 return upgradeLegacyPortalState({...clone(legacy),...current,portal:mergeMissing(current.portal,legacy.portal)});
}

export function hasLegacyPortalData(input={}){
 const source=isObject(input?.legacy)?input.legacy:input;
 const keys=['mw','medewerkers','uur','uurkosten','niveaus','taken','branche','omzet','mensen','cijfers','bc','eigen','beleid','fin','modellen','uitvoering','kto','metingen','esg','eigenCaps','prod','beheer','besluiten','docs','log','dd','wijz','aicap','aicapUitScan','bDoel','bUitstel','bInvest','cOmzet','cEbitda','wWacc','asTarief','mVerzuim','nTitel','asRijen','ddInhoud','dnaVrij','beleidLijst','canvasKaarten','wijzigingen'];
 return keys.some(key=>source?.[key]!==undefined);
}

export function upgradeLegacyPortalState(input={}){
 const original=isObject(input)?clone(input):{};
 if(!hasLegacyPortalData(original))return original;
 const legacy=isObject(original.legacy)?original.legacy:original;
 const scalar=migrateLegacyState(legacy);
 let upgraded=mergeMissing(original,scalar);
 migrateRawLegacyCollections(upgraded,legacy);
 for(const [key,path] of Object.entries(COLLECTIONS))if(legacy[key]!==undefined)setPath(upgraded,path,legacy[key]);
 for(const [key,name] of Object.entries(DNA))if(legacy[key]!==undefined)setPath(upgraded,`portal.strategy.dna.${name}`,legacy[key]);

 upgraded.portal??={};
 upgraded.portal.migration={...(upgraded.portal.migration||{}),legacyV1Applied:true,version:'2026-09-18-v4'};
 for(const key of LEGACY_ROOT_KEYS)delete upgraded[key];
 return upgraded;
}
