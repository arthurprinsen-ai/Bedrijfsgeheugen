import test from 'node:test';
import assert from 'node:assert/strict';
import { allPageIds, findPage, listPortalGroups } from '../page-registry.js';

test('registry preserves the complete standalone portal surface',()=>{
  const ids=allPageIds();
  assert.equal(ids.length,46,`expected 46 mapped portal pages, got ${ids.length}`);
  for(const required of ['overzicht','ai-scan','csrd-impact','compliance-command-center','canvassen','roadmap','taken-werkstromen','bronnenstatus','brain-verwerking','self-heal','audit']){
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

test('registered pages are V2 metadata only and have no legacy routing contract',()=>{
  const roadmap=findPage('roadmap');
  assert.equal(roadmap.label,'Roadmap');
  assert.equal('legacyTab' in roadmap,false);
  assert.equal('href' in roadmap,false);
});

test('unknown page is not registered',()=>{
  assert.equal(findPage('bestaat-niet'),null);
});
