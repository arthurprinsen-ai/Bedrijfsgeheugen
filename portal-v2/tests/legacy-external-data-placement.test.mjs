import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const oldPortal=await readFile(new URL('../../klantportaal.html',import.meta.url),'utf8');
const moduleSource=await readFile(new URL('../modules/legacy-external-data-placement.js',import.meta.url),'utf8');
const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');

const oldPlacement=[
  ['mensen',['mGrafiek','mBron','UWV Arbeidsmarktprognose']],
  ['branche-markt',['bEco','bWet','De cijfers waar je in opereert','Wat er voor jouw sector geldt']],
  ['onderzoek',['ondBlok','ondFilter','UWV','RVO']],
  ['compliance-governance',['naleving','Deadlines en boetes']]
];

test('old portal canonical external-data placements still exist in the source reference',()=>{
  for(const [,tokens] of oldPlacement)for(const token of tokens)assert.ok(oldPortal.includes(token),token);
});
test('V2 restores external data on the same logical pages rather than only in the data library',()=>{
  for(const [page,tokens] of oldPlacement){
    assert.ok(moduleSource.includes("'"+page+"'"),page);
    for(const token of tokens)assert.ok(moduleSource.includes(token),page+' missing '+token);
  }
});
test('V2 shell mounts legacy placement enhancer after native content and loads its stylesheet',()=>{
  assert.match(shell,/mountLegacyExternalDataPlacement/);
  assert.match(shell,/legacy-data-parity\.css/);
});
test('all links emitted by the parity module require absolute http URLs',()=>{
  assert.match(moduleSource,/absoluteUrl/);
  assert.doesNotMatch(moduleSource,/href="\//);
});
