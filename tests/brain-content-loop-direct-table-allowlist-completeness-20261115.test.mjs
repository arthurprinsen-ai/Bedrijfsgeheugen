import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const loop=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
const match=loop.match(/const DIRECT_TABLES=new Set\(\[([^\]]+)\]\);/);
const allowed=match?new Set(JSON.parse('['+match[1]+']')):new Set();
const used=[...loop.matchAll(/\bdb\.from\(['"]([a-z_][a-z0-9_]*)['"]\)/g)].map(m=>m[1]);

test('every static table read or write in original content loop belongs to the same direct SQL allowlist',()=>{
 assert.ok(match,'original direct SQL allowlist exists');
 assert.ok(used.length>=6,'must inspect actual original table accesses, not a vacuous list');
 assert.deepEqual([...new Set(used)].filter(t=>!allowed.has(t)),[],
   'prevent DB_TABLE_REJECTED from a referenced but unallowlisted source');
});

test('original LinkedIn company recovery can read the actual canonical consumed writer-lease table',()=>{
 assert.ok(allowed.has('powerhouse_social_publish_capabilities_v1'));
 assert.match(loop,/db\.from\('powerhouse_social_publish_capabilities_v1'\)/);
 assert.match(loop,/\.select\('channel,consumed_at,revoked_at'\)/);
 assert.match(loop,/const consumed=Boolean\(capabilitySource\.data\?\.consumed_at&&!capabilitySource\.data\?\.revoked_at\)/);
 assert.match(loop,/planRejectedCompanyRegeneration\(\{/);
 assert.match(loop,/consumedCapability:consumed/);
});

test('original content loop is read-only for social publishing capability and preserves existing media read-only lane',()=>{
 assert.match(loop,/this\.table==='powerhouse_social_publish_capabilities_v1'&&this\.op!=='select'/);
 assert.match(loop,/this\.table==='powerhouse_instagram_media_jobs_v1'&&this\.op!=='select'/);
 assert.match(loop,/DB_READ_ONLY_TABLE_REJECTED/);
 assert.doesNotMatch(loop,/db\.from\('powerhouse_social_publish_capabilities_v1'\)\s*\.(?:update|insert|upsert|delete)\(/);
 assert.match(loop,/retryableCompanyEditorialBlock=regeneration\.eligible/);
});

test('one original loop keeps its exclusive publication owner, truthful provider proof and unchanged schedule',()=>{
 assert.match(loop,/providerSideEffectTerminal\(/);
 assert.match(loop,/obligationTerminal\(/);
 assert.match(loop,/TERMINAL_GREEN = new Set\(\['LIVE_PROVEN','MEASURED','LEARNED'\]\)/);
 assert.doesNotMatch(loop,/cron\.schedule\(/);
 assert.doesNotMatch(loop,/createParallelPublisher|secondPublisher/i);
});
