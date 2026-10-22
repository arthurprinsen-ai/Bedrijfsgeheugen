import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');

test('canonical direct DB adapter explicitly allows publication capability ledger',()=>{
  const admission=src.match(/const DIRECT_TABLES=new Set\((\[[^\n]+\])\)/);
  assert.ok(admission,'DIRECT_TABLES allowlist');
  const tables=JSON.parse(admission[1]);
  assert.ok(tables.includes('powerhouse_social_publish_capabilities_v1'),'consumed provider claim ledger admitted');
});
test('capability ledger is read only and fail-closed on errors',()=>{
  assert.match(src,/db\.from\('powerhouse_social_publish_capabilities_v1'\)\s*\.select\('channel,consumed_at,revoked_at'\)/);
  assert.match(src,/if\(capabilitiesResult\.error\) throw new Error\('SOCIAL_PUBLICATION_AUTHORITY_RECONCILIATION_READ_FAILED'\)/);
  assert.match(src,/consumedCapabilityChannels\.has\(channel\) && !clean\(row\.delivery_ref\)/);
  assert.doesNotMatch(src,/db\.from\('powerhouse_social_publish_capabilities_v1'\)\s*\.update\(/);
  assert.doesNotMatch(src,/db\.from\('powerhouse_social_publish_capabilities_v1'\)\s*\.delete\(/);
});
