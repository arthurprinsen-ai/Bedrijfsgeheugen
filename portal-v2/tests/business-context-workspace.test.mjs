import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('business context workspace lets entrepreneur confirm and correct context',async()=>{
  const source=await readFile(new URL('../modules/business-context-workspace.js',import.meta.url),'utf8');
  assert.match(source,/Dit klopt/);
  assert.match(source,/Pas situatie aan/);
  assert.match(source,/Primaire bedrijfsfase/);
  assert.match(source,/Wat speelt er tegelijk/);
  assert.match(source,/Wat wil je bereiken/);
  assert.match(source,/portal\.business_context\.stage/);
  assert.match(source,/portal\.business_context\.events/);
  assert.match(source,/portal\.business_context\.goals/);
  assert.match(source,/confirmation_source:'entrepreneur'/);
  assert.match(source,/domainState\?\.flush/);
});

test('page shell mounts business context as an interactive native workspace',async()=>{
  const source=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
  assert.match(source,/mountBusinessContextWorkspace/);
  assert.match(source,/pageId==='bedrijfssituatie'/);
  assert.match(source,/business-context\.css/);
});

test('business context controls are mobile responsive and touch friendly',async()=>{
  const css=await readFile(new URL('../business-context.css',import.meta.url),'utf8');
  assert.match(css,/min-height:44px/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/grid-template-columns:1fr/);
});
