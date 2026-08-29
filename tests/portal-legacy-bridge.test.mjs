import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolvePortalRoute } from '../portal/legacy-map.mjs';
import { legacyWorkspaceFromRoute,renderLegacyBridge } from '../portal/render-legacy-bridge.mjs';

test('concrete old workspace hashes resolve into the integrated bridge',()=>{
 assert.deepEqual(resolvePortalRoute('profiel'),{route:'company/legacy/profiel',legacyId:'profiel'});
 assert.deepEqual(resolvePortalRoute('aiscan'),{route:'intelligence/legacy/aiscan',legacyId:'aiscan'});
 assert.deepEqual(resolvePortalRoute('offerte'),{route:'admin/legacy/offerte',legacyId:'offerte'});
});

test('native capability route wins when old workspace id overlaps',()=>{
 assert.deepEqual(resolvePortalRoute('roadmap'),{route:'execution/roadmap',legacyId:'roadmap'});
 assert.deepEqual(resolvePortalRoute('overzicht'),{route:'today',legacyId:'overzicht'});
});

test('bridge preserves customer context and exact legacy workspace id',()=>{
 const workspace=legacyWorkspaceFromRoute('company/legacy/profiel');
 assert.equal(workspace?.label,'Profiel per onderdeel');
 const html=renderLegacyBridge({route:'company/legacy/profiel',customerSlug:'demo klant'});
 assert.match(html,/iframe class="legacy-frame"/);
 assert.match(html,/data-legacy-workspace="profiel"/);
 assert.match(html,/\/klantportaal\.html\?klant=demo\+klant/);
});

test('runtime binds bridge iframe to the exact old portal tab',async()=>{
 const runtime=await readFile(new URL('../portal/legacy-frame.mjs',import.meta.url),'utf8');
 const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../portal/legacy-bridge.css',import.meta.url),'utf8');
 assert.match(runtime,/\.tab\[data-p=/);
 assert.match(runtime,/target\.click\(\)/);
 assert.match(app,/bindLegacyFrames\(document\)/);
 assert.match(css,/\.legacy-frame/);
 assert.match(css,/\.legacy-workspace-groups/);
});
