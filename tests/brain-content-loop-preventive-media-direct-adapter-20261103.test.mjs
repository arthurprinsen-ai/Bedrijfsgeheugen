import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');

test('original social preventive preflight can read canonical Mira media jobs through direct DB adapter',()=>{
 const allowed=source.match(/const DIRECT_TABLES=new Set\(\[([^\]]+)\]\);/);
 assert.ok(allowed,'Direct DB allowlist missing');
 assert.match(allowed[1],/"powerhouse_instagram_media_jobs_v1"/);
 assert.match(source,/\.from\('powerhouse_instagram_media_jobs_v1'\)\.select\('channel,status,last_error,asset_manifest,proof_manifest'\)/);
 assert.match(source,/assessPreventivePublicationReadiness\(\{runDate/);
});
test('original preflight media table remains strictly read only',()=>{
 assert.match(source,/this\.table==='powerhouse_instagram_media_jobs_v1'&&this\.op!=='select'/);
 assert.match(source,/DB_READ_ONLY_TABLE_REJECTED/);
 assert.doesNotMatch(source,/\.from\('powerhouse_instagram_media_jobs_v1'\)\.(?:update|insert|upsert|delete)\(/);
});
