import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allPageIds } from '../portal-v2/page-registry.js';
import { hubPages, groupedHubPages } from '../portal-v2/hubs.js';
import { DESKTOP_NAV_GROUPS } from '../portal-v2/navigation-model.js';

test('Portal V2 focused hubs retain Data & AI and Actions capability coverage', () => {
  const dataAi=new Set(hubPages('data-ai'));
  for(const id of ['data-ai','koppelingen','ai-scan','ai-capabilities']) assert.ok(dataAi.has(id), id);
  const tasks=new Set(hubPages('tasks'));
  for(const id of ['taken-werkstromen','actieve-acties','roadmap','outcomes-evidence']) assert.ok(tasks.has(id), id);
});

test('Portal V2 full menu and sidebar are projections of the same complete tree', () => {
  const menuPages=new Set(groupedHubPages('portal').flatMap(group=>group.pages.map(page=>page.target||page.id)));
  for(const id of allPageIds()) assert.ok(menuPages.has(id), id);
  const desktopPages=new Set(DESKTOP_NAV_GROUPS.flatMap(group=>group.pages.map(page=>page.target)));
  for(const id of allPageIds()) assert.ok(desktopPages.has(id), id);

  const app=fs.readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  const html=fs.readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
  assert.match(app,/DESKTOP_NAV_GROUPS/);
  assert.match(app,/portal-single-navigation/);
  assert.doesNotMatch(html,/class="mobilebar"/);
});
