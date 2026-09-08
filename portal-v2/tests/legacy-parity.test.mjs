import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_CAPABILITY_MAP, OVERVIEW_CAPABILITIES, GLOBAL_CAPABILITIES } from '../legacy-parity.js';
import { allPageIds } from '../page-registry.js';
import { readFile } from 'node:fs/promises';

const oldTabs=['overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek','beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'];
const requiredGlobals=['identity-login-logout','export','import','print-permission','feedback','customer-branding','mobile-navigation'];
const requiredOverview=['maturity','manual-work-annual','fte','company-state','cmmi','adoption-curve','leakage','blockers','progress','advice'];

test('every protected old portal panel has a native V2 destination',()=>{
  const ids=new Set(allPageIds());
  assert.deepEqual(Object.keys(LEGACY_CAPABILITY_MAP).sort(),oldTabs.sort());
  for(const oldId of oldTabs){
    const target=LEGACY_CAPABILITY_MAP[oldId];
    assert.ok(ids.has(target),`${oldId} points to missing V2 page ${target}`);
  }
});

test('all protected global portal capabilities are present in V2',()=>{
  assert.deepEqual([...GLOBAL_CAPABILITIES].sort(),requiredGlobals.sort());
});

test('all protected legacy overview capabilities are present in V2',()=>{
  const ids=OVERVIEW_CAPABILITIES.map(item=>item[0]);
  assert.deepEqual(ids.sort(),requiredOverview.sort());
});

test('Strategy DNA is an interactive native V2 module',async()=>{
  const source=await readFile(new URL('../strategy-dna.js',import.meta.url),'utf8');
  assert.match(source,/data-dna-field/);
  assert.match(source,/localStorage/);
  assert.match(source,/strategie-naar-maandagochtend/);
  assert.doesNotMatch(source,/klantportaal|iframe|legacy-bridge/i);
});

test('legacy parity implementation never routes back to the old portal',async()=>{
  const source=await readFile(new URL('../legacy-parity.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/klantportaal\.html|\/klantportaal|iframe|legacy-bridge/i);
  for(const capability of requiredGlobals.filter(x=>x!=='mobile-navigation')) assert.match(source,new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
