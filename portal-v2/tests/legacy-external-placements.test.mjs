import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
const mod=await readFile(new URL('../modules/legacy-external-placements.js',import.meta.url),'utf8');

test('old portal external-data placements are restored inside the original V2 domains',()=>{
  for(const page of ['mensen','branche-markt','onderzoek','compliance-governance']) assert.ok(mod.includes("'"+page+"'"),page);
  for(const title of ['Tegenover je branche','De cijfers waar je in opereert','Wat er voor jouw sector geldt','Hoe je deze cijfers moet lezen','Deadlines en boetes']) assert.ok(mod.includes(title),title);
});
test('old source families stay present on their contextual pages',()=>{
  for(const source of ['UWV','RVO','CBS','Eurostat','DNB','RaboResearch']) assert.ok(mod.includes(source),source);
});
test('portal shell mounts contextual external data after page rendering',()=>{
  assert.match(shell,/mountLegacyExternalPlacements/);
  assert.match(shell,/LEGACY_EXTERNAL_CONTEXT_PAGES/);
});
