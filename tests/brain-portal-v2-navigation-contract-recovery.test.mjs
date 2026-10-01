import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allPageIds } from '../portal-v2/page-registry.js';
import { hubPages, groupedHubPages } from '../portal-v2/hubs.js';
import { DESKTOP_NAV_ITEMS } from '../portal-v2/navigation-model.js';

test('Portal V2 canonical hubs retain complete Data & AI and Actions capability coverage', () => {
  const dataAi=new Set(hubPages('data-ai'));
  for(const id of ['data-ai','koppelingen','ai-scan','ai-capabilities','datahubstatus','brain-verwerking','agentstatus','os:evidence-health','os:capability-graph']){
    assert.ok(dataAi.has(id), id);
  }

  const tasks=new Set(hubPages('tasks'));
  for(const id of ['taken-werkstromen','actieve-acties','roadmap','recovery-obligations','outcomes-evidence','os:next-best-actions','os:monitoring-learning']){
    assert.ok(tasks.has(id), id);
  }
});

test('Portal V2 full menu is complete and desktop navigation uses canonical routed items', () => {
  const menuPages=new Set(groupedHubPages('portal').flatMap(group=>group.pages.map(page=>page.id)));
  for(const id of allPageIds()) assert.ok(menuPages.has(id), id);

  assert.equal(DESKTOP_NAV_ITEMS.length,10);
  assert.ok(DESKTOP_NAV_ITEMS.every(item=>item.target));

  const app=fs.readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  assert.match(app,/DESKTOP_NAV_ITEMS/);
  assert.match(app,/dataset\.navTarget/);
});
