import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject} from '../portal-next/portal-project-model.js';
import {renderProjectPage} from '../portal-next/portal-project-views.js';

const project=normalizePortalProject({quote:{inhoud:{onderdelen:[{id:'data',titel:'Dataplatform',documenten:[{naam:'Datamodel',week:2}],koppelingen:[{naam:'BigQuery',wat:'Brondata ontsluiten',week:1}]}]}}});

test('document behoudt onderdeel/week en blijft gepland',()=>{
  const [doc]=project.documents;
  assert.equal(doc.partId,'data');assert.equal(doc.week,2);assert.equal(doc.status,'planned');
  const html=renderProjectPage('documenten',project);
  assert.match(html,/Datamodel/);assert.match(html,/Week 2/);assert.match(html,/Gepland/);assert.doesNotMatch(html,/Voltooid/);
});

test('koppeling behoudt doel/onderdeel/week en is niet automatisch actief',()=>{
  const [integration]=project.integrations;
  assert.equal(integration.partId,'data');assert.equal(integration.purpose,'Brondata ontsluiten');assert.equal(integration.week,1);assert.equal(integration.status,'planned');
  const html=renderProjectPage('koppelingen',project);
  assert.match(html,/BigQuery/);assert.match(html,/Brondata ontsluiten/);assert.match(html,/Gepland/);assert.doesNotMatch(html,/>Actief</);
});
