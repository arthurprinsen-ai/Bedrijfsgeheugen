import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Reuse original source-authority fixtures. No customer tokens/provider writes.
await import('../portal-v2/tests/portal-server-handoff-restart.test.mjs');

test('P0 #4215 durable source journal uses only original customer-state writer and Brain saver',async()=>{
 const domain=await readFile(new URL('../portal-v2/domain-state.js',import.meta.url),'utf8');
 const state=await readFile(new URL('../portal-v2/portal-state.js',import.meta.url),'utf8');
 const skill=await readFile(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8');
 assert.match(domain,/HANDOFF_JOURNAL_PATH='portal\.__brainHandoffJournalV1'/);
 assert.match(domain,/persistJournalManifest\(\);[\s\S]*const stateResult=await domain\.flush\(\)/);
 assert.match(domain,/recoveredOnInit=recoverJournalManifest\(\)/);
 assert.match(domain,/queueMicrotask\(\(\)=>/);
 assert.match(domain,/journalCleanupPending/);
 assert.match(domain,/PORTAL_BRAIN_JOURNAL_INVALID_BINDING/);
 assert.match(domain,/app_metadata\?\.tenantId/);
 assert.match(domain,/bg:portal-brain-synced/);
 assert.match(state,/delete answers\.portal\.__brainHandoffJournalV1/);
 assert.match(skill,/server.*duurzame.*overdracht|server-persisted.*handoff/i);
 assert.doesNotMatch(domain,/pendingImpacts\.slice\(-50\)/);
});
