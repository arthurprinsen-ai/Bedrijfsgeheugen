import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCsv,parseXlsx,tableFromRecords,IMPORT_LIMITS,readImportFile} from '../portal-v2/data-import-parser.js';
import {buildImportRecord,validateImportCapacity} from '../portal-v2/data-import.js';

const fakeFile=(name,size=200)=>({name,size});

test('Dutch CSV semicolon, BOM and quoted multiline fields are losslessly imported',()=>{
  const table=parseCsv('\uFEFFNaam;Aantal;Opmerking\r\n"Van Dijk";0;"eerste regel\nvolgende regel"\r\n"A";1;"heeft ""quotes"""');
  assert.deepEqual(table.columns,['Naam','Aantal','Opmerking']);
  assert.equal(table.rowCount,2);
  assert.deepEqual(table.rows[0],['Van Dijk','0','eerste regel\nvolgende regel']);
  assert.deepEqual(table.rows[1],['A','1','heeft "quotes"']);
});
test('CSV keeps leading zeros, formulas as plain text, dates and false-like strings',()=>{
  const t=parseCsv('postcode,formule,datum,vlag\n00123,=2+2,2026-11-22,false');
  assert.deepEqual(t.rows[0],['00123','=2+2','2026-11-22','false']);
});
test('duplicate headers become unique without losing values',()=>{
  const t=parseCsv('a,a,,b\na,b,c,d');
  assert.deepEqual(t.columns,['a','a (2)','Kolom 3','b']);
  assert.deepEqual(t.rows[0],['a','b','c','d']);
});
test('incomplete or too wide files fail closed',()=>{
  assert.throws(()=>parseCsv('a,b'),/kopregel/);
  assert.throws(()=>parseCsv('a,b\n1,2,3'),/meer kolommen/);
  assert.throws(()=>parseCsv('a,b\n"x,1'),/niet-afgesloten/);
  assert.throws(()=>tableFromRecords([Array.from({length:41},(_,i)=>'c'+i),['a']]),/kolommen/);
  assert.throws(()=>tableFromRecords([['a'],...Array.from({length:IMPORT_LIMITS.rows+1},()=>['x'])]),/1.000/);
});
test('size and unknown formats are rejected instead of silently truncated',async()=>{
  await assert.rejects(readImportFile({...fakeFile('massive.csv',IMPORT_LIMITS.fileBytes+1),text:async()=>''}),/4 MB/);
  await assert.rejects(readImportFile({...fakeFile('old.xls'),text:async()=>''}),/xlsx/);
  await assert.rejects(readImportFile({...fakeFile('archive.pdf'),text:async()=>''}),/csv/);
  await assert.rejects(parseXlsx(new Uint8Array([1,2,3]).buffer),/xlsx/);
});
test('import provenance and deduplication are deterministic',()=>{
  const hash='a'.repeat(64);
  const record=buildImportRecord(fakeFile('omzet.csv'),parseCsv('jaar,omzet\n2026,100'),hash);
  assert.equal(record.id,'file-'+hash.slice(0,32));
  assert.equal(record.provenance.automaticMapping,false);
  assert.equal(record.provenance.measuredOutcome,false);
  assert.throws(()=>validateImportCapacity([record],record),/al geïmporteerd/);
  assert.throws(()=>validateImportCapacity(Array.from({length:20},(_,i)=>({...record,fingerprint:String(i)})),{...record,fingerprint:'b'.repeat(64)}),/20 bestanden/);
});
test('real V2 mount reuses authenticated tenant portal domain and explicit write ACK',async()=>{
  const app=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  const ui=await readFile(new URL('../portal-v2/data-import.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../portal-v2/index.html',import.meta.url),'utf8');
  assert.match(app,/mountDataImport\(\{stateClient:portalStateClient,domainState:portalDomainState\}\)/);
  assert.match(html,/data-import\.css/);
  assert.match(ui,/domainState\.patch\("portal\.dataImports"/);
  assert.match(ui,/domainState\.flush\(\)/);
  assert.match(ui,/stateClient\.load\(\)/);
  assert.match(ui,/client\?\.isDemo/);
  assert.doesNotMatch(ui,/localStorage|sessionStorage|service_role|new Worker/);
});
