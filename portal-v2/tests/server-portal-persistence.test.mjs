import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePortalProjection, portalProjectionToState } from '../../platform/read-models/portal-server-state.mjs';

test('native Portal V2 functional state survives server sanitization and readback',()=>{
  const input={portal:{profile:{employees:31,hourlyCost:61,maturity:{sturing:4}},strategy:{horizon:3},roadmap:{items:[{id:'a1',title:'Borg kennis'}]}}};
  const record=sanitizePortalProjection(input,{tenantId:'tenant:1',userId:'user:1',now:()=> '2026-09-09T09:45:00.000Z'});
  assert.deepEqual(record.data.portal,input.portal);
  const state=portalProjectionToState(record,{id:'user:1',email:'a@example.com'});
  assert.deepEqual(state.portal,input.portal);
});
