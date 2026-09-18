import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const legacy=await readFile(new URL('../../klantportaal.html',import.meta.url),'utf8');
const strategy=await readFile(new URL('../strategic-models-core.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('../modules/strategic-model-workspace.js',import.meta.url),'utf8');

const entries=[...legacy.matchAll(/\{k:'(Model [^']+)',n:'([^']+)',soort:'(model|finance|functie)'\}/g)]
  .map(match=>({key:match[1],name:match[2],kind:match[3]}));

test('old portal source still defines exactly 28 protected model entries',()=>{
  assert.equal(entries.length,28);
  assert.equal(entries.filter(item=>item.kind==='finance').length,8);
  assert.equal(entries.filter(item=>item.kind!=='finance').length,20);
});

test('Portal V2 front end has twenty strategic and eight finance model destinations',()=>{
  const idsMatch=strategy.match(/STRATEGIC_MODEL_IDS=.*?\[([^\]]+)\]/s);
  assert.ok(idsMatch,'strategic registry missing');
  const strategicIds=[...idsMatch[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
  assert.equal(new Set(strategicIds).size,20);
  const financeIds=[...workspace.matchAll(/Object\.freeze\(\{id:'([^']+)',title:'[^']+',source:'[^']+'\}\)/g)].map(match=>match[1]);
  assert.deepEqual(financeIds.sort(),['altman-z','break-even','dscr','dupont','ebitda-margin','ebitda-multiple','solvency','working-capital-days'].sort());
  assert.match(workspace,/data-model-jump/);
  assert.match(workspace,/data-model-id/);
});

test('strategic model catalogue selection never uses canvassen as the destination',()=>{
  const start=workspace.indexOf('function modelCatalog');
  const end=workspace.indexOf('function bindModelNavigation');
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(workspace.slice(start,end),/canvassen/);
});
