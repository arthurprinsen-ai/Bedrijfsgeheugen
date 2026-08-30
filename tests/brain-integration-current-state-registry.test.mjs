import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntegrationCurrentStateInput, listIntegrationCurrentStateAdapters } from '../brain/operating-loop/integration-current-state-registry.mjs';

const expected=['dataforseo','github','make','netlify','notion','supabase'];

test('registry exposes exactly the six core integration CurrentState adapters',()=>{
  assert.deepEqual(listIntegrationCurrentStateAdapters(),expected);
});

test('registry dispatches every core source through one entrypoint',()=>{
  const cases={
    make:{tenantId:'t',executionId:'run-1',snapshotAt:'2026-08-30T18:50:00Z',item:{id:1,state:'active'}},
    github:{tenantId:'t',repository:'org/repo',sha:'abc',runId:'1',workflow:'CI',status:'completed',conclusion:'success',updatedAt:'2026-08-30T18:50:00Z'},
    netlify:{tenantId:'t',siteId:'site',deployId:'dep',commitRef:'abc',siteName:'site',deployState:'ready',publishedAt:'2026-08-30T18:50:00Z'},
    notion:{tenantId:'t',pageId:'page',databaseId:'db',title:'Page',lastEditedTime:'2026-08-30T18:50:00Z'},
    dataforseo:{tenantId:'t',taskId:'task',keyword:'seo',locationCode:'2528',taskState:'completed',observedAt:'2026-08-30T18:50:00Z'},
    supabase:{tenantId:'t',table:'events',rowId:'row',updatedAt:'2026-08-30T18:50:00Z',operationStatus:'success'}
  };
  for(const source of expected){
    const result=createIntegrationCurrentStateInput(source,cases[source]);
    assert.equal(result.source,source);
    assert.equal(result.verified,true);
  }
});

test('registry fails closed for an unknown integration source',()=>{
  assert.throws(()=>createIntegrationCurrentStateInput('future-platform',{tenantId:'t'}),/Unsupported integration CurrentState source/);
});
