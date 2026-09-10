import test from 'node:test';
import assert from 'node:assert/strict';
import { allPageIds, findPage, listPortalGroups } from '../page-registry.js';

/* Dit was een hard getal (47). Dat vangt het verdwijnen van een pagina, maar
   blokkeert ook het toevoegen van een pagina zonder dat er iets mis is - het
   dwong bij elke uitbreiding een aanpassing af zonder inhoudelijke controle.
   Nu: het aantal mag groeien maar niet krimpen, en elke pagina die er hoort te
   zijn wordt bij naam gecontroleerd. Dat vangt precies wat het moest vangen. */
const MINIMAAL_AANTAL_PAGINAS=49;

test('registry preserves the complete standalone portal surface',()=>{
  const ids=allPageIds();
  assert.ok(ids.length>=MINIMAAL_AANTAL_PAGINAS,
    `het portaal is gekrompen: ${ids.length} paginas, minimaal ${MINIMAAL_AANTAL_PAGINAS} verwacht`);
  assert.equal(new Set(ids).size,ids.length,'er staat een dubbele pagina-id in de registry');
  for(const required of ['overzicht','ai-scan','csrd-impact','compliance-command-center','strategy-dna','canvassen','roadmap','taken-werkstromen','bronnenstatus','brain-verwerking','self-heal','audit','data-ai-passport','eu-ai-act-audit']){
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
