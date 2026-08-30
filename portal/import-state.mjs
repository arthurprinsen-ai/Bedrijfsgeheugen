const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const count=value=>Array.isArray(value)?value.length:0;

export function parsePortalBackup(raw){
 let parsed;
 try{parsed=JSON.parse(String(raw??''))}catch{throw new Error('Ongeldige JSON-back-up.')}
 if(!isObject(parsed))throw new Error('Ongeldige portaalback-up.');
 if(Number(parsed.version)===4&&isObject(parsed.state))return{kind:'canonical',version:4,exportedAt:parsed.exportedAt||'',state:clone(parsed.state)};
 const looksLegacy=Number(parsed.versie)===1&&isObject(parsed.niveaus)&&(['taken','besluiten','docs','log'].some(key=>Array.isArray(parsed[key]))||Object.keys(parsed.niveaus).length>0);
 if(looksLegacy)return{kind:'legacy-v1',version:1,exportedAt:parsed.opgeslagen||'',legacyState:clone(parsed)};
 throw new Error('Niet-ondersteunde portaalback-up.');
}

export function previewPortalImport(current={},next={}){
 const currentName=current?.company?.name||'';
 const nextName=next?.company?.name||'';
 return Object.freeze({
  companyChanged:currentName!==nextName,
  currentCompany:currentName,
  nextCompany:nextName,
  actionDelta:count(next.actions)-count(current.actions),
  decisionDelta:count(next.decisions)-count(current.decisions),
  memoryDelta:count(next.memories)-count(current.memories),
  roadmapDelta:count(next.roadmap)-count(current.roadmap)
 });
}
