import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotionCurrentStateInput } from '../brain/operating-loop/notion-current-state-adapter.mjs';

test('maps active Notion page evidence into canonical CurrentState input',()=>{
  const input=createNotionCurrentStateInput({tenantId:'tenant-a',pageId:'page-123',databaseId:'db-456',title:'Content calendar',lastEditedTime:'2026-08-30T18:40:00Z',archived:false,inTrash:false});
  assert.equal(input.source,'notion');
  assert.equal(input.id,'notion-current-state:db-456:page-123');
  assert.equal(input.component,'notion:db-456:page-123');
  assert.equal(input.raw.page_id,'page-123');
  assert.equal(input.raw.database_id,'db-456');
  assert.equal(input.raw.last_edited_time,'2026-08-30T18:40:00Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.capacity,'available');
  assert.equal(input.executionStatus,'available');
  assert.equal(input.verified,true);
});

test('maps archived and trashed pages deterministically',()=>{
  const base={tenantId:'tenant-a',pageId:'page-1',databaseId:'db-1',title:'Page',lastEditedTime:'2026-08-30T18:40:00Z'};
  const archived=createNotionCurrentStateInput({...base,archived:true,inTrash:false});
  assert.equal(archived.health,'degraded');
  assert.equal(archived.capacity,'interrupted');
  assert.equal(archived.executionStatus,'archived');
  const trashed=createNotionCurrentStateInput({...base,pageId:'page-2',archived:false,inTrash:true});
  assert.equal(trashed.health,'unhealthy');
  assert.equal(trashed.capacity,'interrupted');
  assert.equal(trashed.executionStatus,'trashed');
  assert.equal(trashed.error,'NOTION_PAGE_TRASHED');
});

test('fails closed without registered Notion provenance fields',()=>{
  assert.throws(()=>createNotionCurrentStateInput({tenantId:'tenant-a'}),/pageId/);
  assert.throws(()=>createNotionCurrentStateInput({tenantId:'tenant-a',pageId:'page'}),/databaseId/);
  assert.throws(()=>createNotionCurrentStateInput({tenantId:'tenant-a',pageId:'page',databaseId:'db',title:'Page'}),/lastEditedTime/);
});
