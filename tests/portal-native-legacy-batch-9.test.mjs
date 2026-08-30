import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const utilities=await readFile(new URL('../portal/render-admin-utilities.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');
let importState=null;
try{importState=await import('../portal/import-state.mjs')}catch{}

test('Openen bypasses the iframe bridge only when native safe import exists',()=>{
 assert.match(runtime,/['\"]openen['\"]/);
 assert.match(utilities,/admin\/legacy\/openen/);
});

test('native import parser rejects malformed or unsupported backups',()=>{
 assert.equal(typeof importState?.parsePortalBackup,'function');
 assert.throws(()=>importState.parsePortalBackup('{oops'),/Ongeldig|JSON/i);
 assert.throws(()=>importState.parsePortalBackup(JSON.stringify({foo:'bar'})),/back-up|portal/i);
});

test('native import parser accepts canonical version 4 backup without mutating source',()=>{
 const source={version:4,exportedAt:'2026-08-30T08:00:00.000Z',state:{company:{name:'Voorbeeld BV'},actions:[{id:'a1',title:'Actie'}]}};
 const original=JSON.stringify(source);
 const parsed=importState.parsePortalBackup(original);
 assert.equal(parsed.kind,'canonical');
 assert.equal(parsed.state.company.name,'Voorbeeld BV');
 assert.equal(JSON.stringify(source),original);
});

test('native import parser preserves original version 1 legacy backups',()=>{
 const legacy={versie:1,opgeslagen:'2026-08-30T08:00:00.000Z',niveaus:{sturing:3},taken:[{id:'t1',titel:'Borg proces'}],besluiten:[],docs:[],log:[]};
 const parsed=importState.parsePortalBackup(JSON.stringify(legacy));
 assert.equal(parsed.kind,'legacy-v1');
 assert.equal(parsed.legacyState.niveaus.sturing,3);
});

test('preview summarizes changes before any commit action is exposed',()=>{
 assert.equal(typeof importState?.previewPortalImport,'function');
 const preview=importState.previewPortalImport({company:{name:'Oud'},actions:[]},{company:{name:'Nieuw'},actions:[{id:'a1'}]});
 assert.equal(preview.companyChanged,true);
 assert.equal(preview.actionDelta,1);
 assert.match(utilities,/data-portal-action="select-import"/);
 assert.match(utilities,/data-import-preview/);
 assert.match(utilities,/data-portal-action="confirm-import"/);
});

test('app stages import before confirmation and preserves last-known-good until server write succeeds',()=>{
 assert.match(app,/pendingImport/);
 assert.match(app,/stagePortalImport/);
 assert.match(app,/confirmPortalImport/);
 assert.match(app,/writeServerState/);
 assert.match(app,/lastKnownGood|previousState/);
 assert.match(app,/data-portal-action/);
});
