import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace=fs.readFileSync(new URL('../modules/business-context-workspace.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../business-context.css',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../page-shell.js',import.meta.url),'utf8');

test('goal cockpit exposes lever what-if interactions and truth labeling',()=>{
  for(const token of ['Welke hefbomen brengen je dichter bij je doel?','data-scenario-effect','Verkleining doelgat','scenario-aannames, geen voorspellingen','Volgende beste acties'])assert.ok(workspace.includes(token),token);
});

test('scenario actions navigate into relevant portal modules',()=>{
  assert.ok(workspace.includes('data-scenario-open'));
  assert.ok(workspace.includes('openPage?.(button.dataset.scenarioOpen)'));
  assert.ok(shell.includes('openPage:openPortalPage'));
});

test('goal scenario cockpit is responsive',()=>{
  for(const selector of ['.v2scenariosection','.v2scenariogrid','.v2scenarioflow','.v2levergrid','.v2nextbest'])assert.ok(css.includes(selector),selector);
});
