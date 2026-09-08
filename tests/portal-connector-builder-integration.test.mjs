import test from 'node:test';
import assert from 'node:assert/strict';
import {renderProjectPage} from '../portal-next/portal-project-views.js';

test('native koppelingen keeps offer planning and mounts runtime builder separately',()=>{
  const project={integrations:[{name:'GA4 + BigQuery',purpose:'Analytics',partId:'fase1',week:2}],parts:[{id:'fase1',title:'Meten opzetten'}]};
  const html=renderProjectPage('koppelingen',project);
  assert.match(html,/GA4 \+ BigQuery/);
  assert.match(html,/Gepland/);
  assert.match(html,/<connector-builder-app>/);
  assert.doesNotMatch(html,/GA4 \+ BigQuery[\s\S]{0,150}>Actief</);
});

test('other project pages remain unchanged by connector builder mount',()=>{
  const html=renderProjectPage('documenten',{documents:[],parts:[]});
  assert.doesNotMatch(html,/connector-builder-app/);
});
