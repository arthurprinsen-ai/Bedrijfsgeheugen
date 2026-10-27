import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_NAV_ITEMS, mobileTarget, DESKTOP_NAV_GROUPS } from '../navigation-model.js';
import { PROJECT_GROUPS, hubDefinition, groupedHubPages } from '../hubs.js';

test('Project is exactly one item inside the canonical complete navigation tree',()=>{
  const projectItems=PORTAL_NAV_ITEMS.filter(item=>item.target==='hub:project');
  assert.equal(projectItems.length,1);
  assert.equal(projectItems[0].label,'Jouw project');
  assert.equal(mobileTarget('project'),'hub:project');
  assert.equal(DESKTOP_NAV_GROUPS.flatMap(group=>group.pages).filter(page=>page.target==='hub:project').length,1);
});

test('project hub exposes the approved five context groups',()=>{
  assert.equal(hubDefinition('project')?.label,'Jouw project');
  assert.deepEqual(PROJECT_GROUPS.map(group=>group.label),[
    'Overzicht','Commercieel','Bouwen & koppelen','Projectinformatie','Samenwerken'
  ]);
});

test('project groups surface all agreed project functions',()=>{
  const labels=groupedHubPages('project').flatMap(group=>group.pages.map(page=>page.label));
  for(const expected of ['Offerte','Uren & facturen','Koppelingen','Integraties','Taken & werkstromen','Documenten','Notities','Activiteit','Team & toegang']){
    assert.ok(labels.includes(expected),`missing ${expected}`);
  }
});
