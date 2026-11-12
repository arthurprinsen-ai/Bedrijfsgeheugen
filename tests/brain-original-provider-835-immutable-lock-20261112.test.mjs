import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const entries=lock.applied;
test('official 835th original provider migration appends one exact immutable identity after prior 834',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(entries.length>=835,'source lock must contain the original provider-verified 835th migration');
 assert.equal(new Set(entries.map(v=>v.version)).size,entries.length);
 assert.deepEqual(entries[832],{version:'20261112194500',name:'original_growth_source_revision_identity_fix_v1'});
 assert.deepEqual(entries[833],{version:'20261112203000',name:'original_seo_keyword_tenant_alignment_v1'});
 assert.deepEqual(entries[834],{version:'20261112211000',name:'original_skipped_provider_reference_readback_handoff_v1'});
 assert.ok(existsSync(new URL('../supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql',import.meta.url)));
 assert.ok(Number.isFinite(Date.parse(lock.captured_at)));
});
test('native original provider source remains an actual safe provider-ID handoff, not an empty migration',()=>{
 const source=readFileSync(new URL('../supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql',import.meta.url),'utf8');
 for(const t of ["CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1","OVERDUE_PROVIDER_READBACK","provider_readback_verified","ORIGINAL_EXACT_PROVIDER_OWNER_AND_POST_READBACK_REQUIRED","CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END"]) assert.ok(source.includes(t),t);
 assert.match(source,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role/);
 assert.doesNotMatch(source,/cron\.schedule|net\.http_post|INSTAGRAM_PUBLISH|GMAIL_SEND_EMAIL|DELETE FROM public\.brain_obligations/i);
});
