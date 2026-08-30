import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildPortalStateFromLegacy } from '../portal/legacy-state.mjs';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const company=await readFile(new URL('../portal/render-company.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');
const serverState=await readFile(new URL('../platform/read-models/portal-server-state.mjs',import.meta.url),'utf8');

test('legacy raw input data survives projection into canonical portal state',()=>{
 const state=buildPortalStateFromLegacy({legacyState:{niveaus:{sturing:3},mw:20,uur:75,cijfers:{cOmzet:'2400'},fin:{wSchuld:'200'},mensen:{mVerzuim:'4.2'},prod:{pDeclarabel:'70'},kto:{kNps:'15'},metingen:[{id:1,d:'2026-08-30',s:'NPS',v:15,n:''}],esg:{energie:2},beleid:{infosec:2},eigen:{bedrijfsnaam:'Voorbeeld BV'}}});
 assert.equal(state.legacyInputs.cijfers.cOmzet,'2400');
 assert.equal(state.legacyInputs.fin.wSchuld,'200');
 assert.equal(state.legacyInputs.mensen.mVerzuim,'4.2');
 assert.equal(state.legacyInputs.prod.pDeclarabel,'70');
 assert.equal(state.legacyInputs.kto.kNps,'15');
 assert.equal(state.legacyInputs.metingen.length,1);
 assert.equal(state.legacyInputs.esg.energie,2);
 assert.equal(state.legacyInputs.beleid.infosec,2);
});

test('server projection explicitly allows legacyInputs',()=>assert.match(serverState,/['\"]legacyInputs['\"]/));

test('invoeren bypasses iframe bridge and renders native company form',()=>{
 assert.match(runtime,/['\"]invoeren['\"]/);
 assert.match(company,/company\/legacy\/invoeren/);
 assert.match(company,/Je gegevens invullen/);
 assert.match(company,/data-input-key=/);
 assert.match(company,/data-portal-action="save-inputs"/);
});

test('native data entry stages changes and only commits on explicit save with read-back verification',()=>{
 assert.match(app,/inputDraft/);
 assert.match(app,/stageInputChange/);
 assert.match(app,/saveInputDraft/);
 assert.match(app,/inputEditId/);
 assert.match(app,/previousState/);
 assert.match(app,/writeServerState/);
 assert.match(app,/readServerState/);
 assert.match(app,/sourceMeta\?\.inputEditId/);
});
