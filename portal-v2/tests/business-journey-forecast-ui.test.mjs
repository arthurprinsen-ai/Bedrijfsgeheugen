import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace=fs.readFileSync(new URL('../portal-v2/modules/business-context-workspace.js',import.meta.url),'utf8');
const overview=fs.readFileSync(new URL('../portal-v2/modules/overview.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../portal-v2/business-context.css',import.meta.url),'utf8');

test('business context workspace exposes interactive destination and measurable goals',()=>{
  for(const token of ['data-context-target-stage','Waar sta je en waar wil je heen?','data-goal-current','data-goal-target','data-goal-date','Opslaan & Powerhouse bijwerken']) assert.ok(workspace.includes(token),token);
});

test('goal cockpit makes forecast evidence state explicit',()=>{
  for(const token of ['Nog geen betrouwbare forecast','3 historische meetpunten','Powerhouse verzint geen waarschijnlijkheid zonder trendbewijs.','Liggen je doelen op koers?','benodigd tempo']) assert.ok(workspace.includes(token),token);
});

test('overview surfaces company journey and goal progress',()=>{
  for(const token of ['data-business-journey-overview','Bedrijfsreis','Open reis','goalForecasts']) assert.ok(overview.includes(token),token);
});

test('journey and forecast cockpit has responsive visual contracts',()=>{
  for(const selector of ['.v2journeytrack','.v2forecastgrid','.v2forecastband','.v2milestones','.business-journey-overview']) assert.ok(css.includes(selector),selector);
  assert.ok(css.includes('@media(max-width:760px)'));
});