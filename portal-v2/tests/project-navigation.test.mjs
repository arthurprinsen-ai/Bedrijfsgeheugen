import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_NAV_ITEMS, mobileTarget } from '../navigation-model.js';
import { PROJECT_GROUPS, hubDefinition, groupedHubPages } from '../hubs.js';

test('mobile navigation has exactly one Project entry between Overview and Data & AI',()=>{
  assert.deepEqual(PORTAL_NAV_ITEMS.map(({id,label})=>[id,label]),[
    ['overview','Overzicht'],
    ['project','Project'],
    ['data-ai','Data & AI'],
    ['tasks','Taken'],
    ['more','Meer']
  ]);
  assert.equal(mobileTarget('project'),'hub:project');
  assert.equal(PORTAL_NAV_ITEMS.some(item=>item.id==='portal'),false);
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
