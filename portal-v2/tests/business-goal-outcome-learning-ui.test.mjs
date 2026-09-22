import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace=fs.readFileSync(new URL('../modules/business-context-workspace.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../business-context.css',import.meta.url),'utf8');

test('goal cockpit exposes verified outcome learning loop',()=>{
  for(const token of ['Wat werkte echt?','Open Outcomes & evidence','3 geverifieerde uitkomsten','data-outcome-open','verwacht ','werkelijk '])assert.ok(workspace.includes(token),token);
});

test('goal learning cockpit distinguishes calibrated and insufficient evidence states',()=>{
  for(const token of ['calibrationStatus','Gekalibreerd','Nog leren'])assert.ok(workspace.includes(token),token);
  for(const selector of ['.v2learningsection','.v2calibrationgrid','.v2calibrationcard','.v2outcomelist'])assert.ok(css.includes(selector),selector);
});
