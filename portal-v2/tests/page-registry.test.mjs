import test from 'node:test';
import assert from 'node:assert/strict';
import { allPageIds, buildLegacyUrl, findPage, listPortalGroups } from '../page-registry.js';

test('registry preserves the complete mapped portal surface',()=>{
  const ids=allPageIds();
  assert.ok(ids.length>=45,`expected at least 45 portal pages, got ${ids.length}`);
  for(const required of ['overzicht','ai-scan','canvassen','roadmap','taken-werkstromen','bronnenstatus','brain-verwerking','self-heal','audit']){
    assert.ok(ids.includes(required),`missing ${required}`);
  }
});

test('groups retain the Brain & Powerhouse area',()=>{
  const groups=listPortalGroups();
  const brain=groups.find(g=>g.id==='brein-powerhouse');
  assert.ok(brain);
  assert.ok(brain.pages.some(p=>p.id==='outcomes-evidence'));
  assert.ok(brain.pages.some(p=>p.id==='learning-writeback'));
});

test('legacy URLs preserve customer and mapped tab',()=>{
  const url=new URL(buildLegacyUrl('roadmap','demo-klant'));
  assert.equal(url.searchParams.get('klant'),'demo-klant');
  assert.equal(url.searchParams.get('tab'),'roadmap');
  assert.equal(findPage('roadmap').label,'Roadmap');
});

test('unknown page cannot generate a legacy URL',()=>{
  assert.equal(buildLegacyUrl('bestaat-niet','demo'),null);
});
