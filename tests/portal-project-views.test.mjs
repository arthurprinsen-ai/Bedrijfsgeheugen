import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject} from '../portal-next/portal-project-model.js';
import {renderProjectPage} from '../portal-next/portal-project-views.js';

const project=normalizePortalProject({customer:{name:'IJsselmonde'},quote:{nummer:'OF-IJS-001',titel:'Analytics en Power BI',status:'concept',bedrag:20000,inhoud:{onderdelen:[{id:'fase1',titel:'Fase 1 — Meten opzetten',prijs:3900,weken:2,vast:true,sprints:[{titel:'Meetplan',wat:'Metingen ontwerpen',op:'Werkend meetplan'}],stories:[['marketeer','campagnes vergelijken','budget sturen']]}],planning:[['Week 1','Start meten']]}}});

test('offerte rendert quote, onderdelen, sprints en stories native',()=>{
  const html=renderProjectPage('offerte',project);
  for(const value of ['OF-IJS-001','Analytics en Power BI','Fase 1 — Meten opzetten','Meetplan','Metingen ontwerpen','Werkend meetplan','marketeer','campagnes vergelijken','budget sturen'])assert.match(html,new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('projectrenderer bevat geen zichtbare legacy bridge',()=>{
  const html=renderProjectPage('offerte',project);
  assert.doesNotMatch(html,/<iframe/i);
  assert.doesNotMatch(html,/data-open-legacy/i);
  assert.doesNotMatch(html,/klantportaal\.html/i);
});

test('roadmap en taken gebruiken dezelfde projectrelaties',()=>{
  assert.match(renderProjectPage('roadmap',project),/Start meten/);
  const tasks=renderProjectPage('taken-werkstromen',project);
  assert.match(tasks,/campagnes vergelijken/);
  assert.match(tasks,/Nog niet gestart|Gepland/);
});
