import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCsv} from '../portal-v2/data-import-parser.js';
import {
  analyzeImportTable,confirmImportContext,
  IMPORT_DATA_KINDS,IMPORT_AREAS,IMPORT_GRAINS,IMPORT_ROLES
} from '../portal-v2/data-import-semantics.js';
import {buildImportRecord,validateImportCapacity} from '../portal-v2/data-import.js';

function confirmed(analysis,overrides={}){
  return {
    kind:analysis.suggestedKind,area:analysis.suggestedArea,grain:analysis.suggestedGrain,
    purpose:analysis.suggestedPurpose,sourceSystem:"Exact Online",
    mappings:analysis.columnMappings.map(({column,role})=>({column,role})),
    personalAuthorized:false,confirmed:true,...overrides
  };
}
test('invoice context is suggested from specific Dutch headers, with column roles and period',()=>{
  const t=parseCsv('Factuurnummer;Factuurdatum;Bedrag\nF-001;2026-11-01;125,00\nF-002;2026-11-20;99,00');
  const a=analyzeImportTable(t,{fileName:"export.csv"});
  assert.equal(a.suggestedKind,'invoices');
  assert.equal(a.confidence,'high');
  assert.equal(a.suggestedArea,'finance');
  assert.equal(a.suggestedGrain,'invoice');
  assert.deepEqual(a.columnMappings.map(x=>x.role),['identifier','date','amount']);
  assert.deepEqual(a.period?.from,'2026-11-01');
  assert.deepEqual(a.period?.to,'2026-11-20');
  assert.deepEqual(a.quality,{rows:2,columns:3,missingCells:0,duplicatedRows:0});
  const context=confirmImportContext(a,confirmed(a));
  assert.equal(context.usePolicy.automaticKpiWrite,false);
  assert.equal(context.usePolicy.automaticExternalAction,false);
  assert.equal(context.destinationStatus,'intended-area-not-automatically-mapped');
  assert.equal(context.sourceSystem,'Exact Online');
});
test('unknown datasets are not given a fabricated domain or a high confidence score',()=>{
  const t=parseCsv('alpha;beta\nx;y\nz;q');
  const a=analyzeImportTable(t,{fileName:"bestand.csv"});
  assert.equal(a.suggestedKind,'other');
  assert.equal(a.confidence,'unknown');
  assert.deepEqual(a.matchedColumns,[]);
  assert.equal(a.period,null);
  const context=confirmImportContext(a,confirmed(a,{
    kind:"projects",area:"projects",grain:"project",purpose:"Projectvoortgang in kwartaal vier analyseren"
  }));
  assert.equal(context.kind,'projects');
  assert.equal(context.area,'projects');
  assert.equal(context.detection.suggestedKind,'other');
  assert.equal(context.authorization.humanReviewed,true);
});
test('record semantics survive persisted source record without changing the raw source columns',()=>{
  const t=parseCsv('order_id,omzet,datum\n00012,100,2026-11-22\n00013,150,2026-11-23');
  const a=analyzeImportTable(t,{fileName:"sales.csv"});
  assert.equal(a.suggestedKind,'sales');
  const semantic=confirmImportContext(a,confirmed(a,{sourceSystem:"Salesforce"}));
  const rec=buildImportRecord({name:'omzet.csv',size:1024},t,'a'.repeat(64),semantic);
  assert.equal(rec.rows[0][0],'00012');
  assert.equal(rec.semantic.kind,'sales');
  assert.equal(rec.semantic.purpose,'Omzet, orders en verkooptrends onderzoeken');
  assert.equal(rec.semantic.sourceSystem,'Salesforce');
  assert.equal(rec.semantic.columnMappings[0].role,'identifier');
  assert.doesNotThrow(()=>validateImportCapacity([],rec));
});
test('human review and concrete business purpose are mandatory; unknown keys fail closed',()=>{
  const a=analyzeImportTable(parseCsv('id;omzet\n1;50\n2;70'));
  assert.throws(()=>confirmImportContext(a,confirmed(a,{confirmed:false})),/Controleer en bevestig/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{purpose:'kort'})),/zakelijke doel/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{kind:'secret_profile'})),/gegevenssoort/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{area:'portal.admin'})),/bestemming/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{grain:'unknown-row'})),/betekenis per rij/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{mappings:[{column:'hack',role:'text'}]})),/kolommen/);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{mappings:a.columnMappings.map(x=>({column:x.column,role:'execute'}))})),/kolomrol/);
});
test('personal fields require explicit lawful-purpose acknowledgment and cannot be downgraded',()=>{
  const t=parseCsv('Klantnummer;Klantnaam;Email\n1;Sara;sara@example.nl\n2;Joost;joost@example.nl');
  const a=analyzeImportTable(t,{fileName:'CRM-klanten.csv'});
  assert.equal(a.suggestedKind,'customers');
  assert.ok(a.personalColumns.includes('Klantnummer'));
  assert.ok(a.personalColumns.includes('Email'));
  assert.throws(()=>confirmImportContext(a,confirmed(a)),/persoonsgegevens/i);
  assert.throws(()=>confirmImportContext(a,confirmed(a,{
    personalAuthorized:true,mappings:a.columnMappings.map(x=>({column:x.column,role:'text'}))
  })),/Persoonsgegevens/);
  const approved=confirmImportContext(a,confirmed(a,{personalAuthorized:true}));
  assert.equal(approved.sensitivity,'personal');
  assert.equal(approved.authorization.personalProcessingConfirmed,true);
});
test('highly restricted fields block import even if customer ticks all approvals',()=>{
  for(const header of ['BSN','Paspoortnummer','password_hash','Medische diagnose']){
    const a=analyzeImportTable(parseCsv(header+',waarde\n123,10\n456,20'));
    assert.ok(a.restrictedColumns.length,header);
    assert.throws(()=>confirmImportContext(a,confirmed(a,{personalAuthorized:true})),/geblokkeerd/);
  }
});
test('column mapping is exact and period is dropped if user removes date role',()=>{
  const a=analyzeImportTable(parseCsv('datum;orders\n2026-11-01;1\n2026-11-08;2'),{fileName:'orders.csv'});
  const changed=a.columnMappings.map(({column,role})=>({column,role:role==='date'?'text':role}));
  const context=confirmImportContext(a,confirmed(a,{mappings:changed}));
  assert.equal(context.period,null);
  const reversed=[...a.columnMappings].reverse().map(({column,role})=>({column,role}));
  assert.throws(()=>confirmImportContext(a,confirmed(a,{mappings:reversed})),/Kolomvolgorde/);
});
test('data-quality caveats are surfaced, never cleaned invisibly',()=>{
  const a=analyzeImportTable(parseCsv('datum;omzet;omschrijving\n2026-01-01;100;\n2026-01-01;100;\n2026-01-02;200;ok'));
  assert.equal(a.quality.missingCells,2);
  assert.equal(a.quality.duplicatedRows,1);
});
test('frontend is the original one-writer UI with semantic readback, review and privacy gates',async()=>{
  const ui=await readFile(new URL('../portal-v2/data-import.js',import.meta.url),'utf8');
  const app=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../portal-v2/data-import.css',import.meta.url),'utf8');
  assert.match(app,/mountDataImport\(\{stateClient:portalStateClient,domainState:portalDomainState\}\)/);
  assert.match(ui,/confirmImportContext\(staged\.analysis,form\)/);
  assert.match(ui,/confirmedSemantic\(\)/);
  assert.match(ui,/JSON\.stringify\(found\?\.semantic\)!==JSON\.stringify\(record\.semantic\)/);
  assert.match(ui,/domainState\.patch\("portal\.dataImports"/);
  assert.match(ui,/domainState\.flush\(\)/);
  assert.match(ui,/bgImportPersonalAuthorized/);
  assert.match(ui,/bgImportReviewed/);
  assert.match(css,/\.bg-import-context-grid/);
  assert.doesNotMatch(ui,/localStorage|sessionStorage|service_role|new Worker|eval\(/);
  assert.ok(IMPORT_DATA_KINDS.length>=10);
  assert.ok(IMPORT_AREAS.length>=10);
  assert.ok(IMPORT_GRAINS.length>=8);
  assert.ok(IMPORT_ROLES.length>=8);
});
