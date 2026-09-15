import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const manifest=JSON.parse(await readFile(new URL('../portal-v2/assurance/portal-v2-parity.json',import.meta.url),'utf8'));

test('Portal V2 assurance covers all protected legacy capabilities',()=>{
 assert.equal(manifest.capabilities.length,24);
 assert.equal(new Set(manifest.capabilities.map(x=>x.legacy_key)).size,24);
});

test('verified is impossible while production evidence is pending',()=>{
 for(const capability of manifest.capabilities){
  if(capability.status==='verified') assert.equal(capability.production_evidence_status,'verified',`${capability.legacy_key} is falsely verified`);
 }
 assert.equal(manifest.release_gate.allow_verified_without_production,false);
 assert.equal(manifest.release_gate.allow_route_presence_as_parity,false);
 assert.equal(manifest.release_gate.allow_inventory_only_as_parity,false);
});

test('strategy and canvas gaps have executable parity evidence',()=>{
 const strategy=manifest.capabilities.find(x=>x.legacy_key==='strategie');
 const canvases=manifest.capabilities.find(x=>x.legacy_key==='canvassen');
 assert.equal(strategy.status,'implemented');
 assert.equal(canvases.status,'implemented');
 assert.ok(strategy.evidence.some(x=>x.includes('strategic-models')));
 assert.ok(canvases.evidence.some(x=>x.includes('canvas')));
});
