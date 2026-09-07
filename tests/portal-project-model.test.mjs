import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject,projectSprints,projectStories} from '../portal-next/portal-project-model.js';

const quote={nummer:'OF-IJS-001',titel:'Analytics en Power BI',bedrag:20000,inhoud:{onderdelen:[{id:'fase1',titel:'Fase 1',prijs:3900,weken:2,sprints:[{titel:'Meetplan',wat:'Meetplan maken',op:'Werkend meetplan'}],stories:[['marketeer','zien welke campagne converteert','budget sturen']],documenten:[{naam:'Meetplan',week:1}],koppelingen:[{naam:'GA4',wat:'Meet website',week:1}]}]}};

test('normaliseert offerte zonder verlies van relaties',()=>{
  const project=normalizePortalProject({customer:{name:'IJsselmonde'},quote,runtime:null});
  assert.equal(project.quote.number,'OF-IJS-001');
  assert.equal(project.parts.length,1);
  assert.equal(projectSprints(project)[0].partId,'fase1');
  assert.equal(projectStories(project)[0].partId,'fase1');
  assert.equal(project.documents[0].week,1);
  assert.equal(project.integrations[0].name,'GA4');
});
