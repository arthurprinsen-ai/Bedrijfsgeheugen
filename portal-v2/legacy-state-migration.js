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
 beleidLijst:'portal.compliance.policies',esgVelden:'portal.compliance.esg',aicap:'portal.aiCapabilities',canvasKaarten:'portal.canvases',ddInhoud:'portal.dueDiligence.findings',wijzigingen:'portal.changes.items',modelKeuze:'portal.advice.modelFilter',roadmapItems:'portal.roadmap.items'
};
const DNA={dnaVrij:'freeText',dnaZoek:'search',ecNaam:'name',ecDim:'dimension',ecAfd:'department',ecProc:'process',ecData:'data',ecSys:'system',ecAi:'ai',ecGov:'governance',ecKpi:'kpi',ecProj:'project',ecThema:'theme'};

export function upgradeLegacyPortalState(input={}){
 const original=isObject(input)?clone(input):{};
 const legacy=isObject(original.legacy)?original.legacy:original;
 const scalar=migrateLegacyState(legacy);
 let upgraded=mergeMissing(original,scalar);
 for(const [key,path] of Object.entries(COLLECTIONS))if(legacy[key]!==undefined)setPath(upgraded,path,legacy[key]);
 for(const [key,name] of Object.entries(DNA))if(legacy[key]!==undefined)setPath(upgraded,`portal.strategy.dna.${name}`,legacy[key]);
 if(legacy.offerte&&isObject(legacy.offerte))setPath(upgraded,'portal.offer',legacy.offerte);
 upgraded.portal??={};
 upgraded.portal.migration={...(upgraded.portal.migration||{}),legacyV1Applied:true,version:'2026-09-09-v1'};
 return upgraded;
}

export function hasLegacyPortalData(input={}){
 const source=isObject(input?.legacy)?input.legacy:input;
 const keys=['mw','uur','bDoel','cOmzet','wWacc','asTarief','mVerzuim','nTitel','asRijen','ddInhoud','dnaVrij'];
 return keys.some(key=>source?.[key]!==undefined);
}
