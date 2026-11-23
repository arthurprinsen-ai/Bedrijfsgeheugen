import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original already-applied migration ledger preserves historical identities and exact native 833rd source',()=>{
 assert.ok(lock.applied.length>=834,'the original 833-provider prefix and independently applied 834th source must exist');
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.equal(lock.applied[832].version,'20261112194500','immutable original native 833rd version');
 assert.equal(lock.applied[832].name,'original_growth_source_revision_identity_fix_v1','immutable original 833rd name');
 assert.deepEqual(lock.applied[833],{version:'20261112203000',name:'original_seo_keyword_tenant_alignment_v1'},
  'new native 834th original DataForSEO/Brain source tenant repair');
 assert.ok(existsSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url)));
 assert.ok(existsSync(new URL('../supabase/migrations/20261112194500_original_growth_source_revision_identity_fix_v1.sql',import.meta.url)));
});
test('original P0 source correction preserves immutable BRAIN identity, current SHA consumer and heartbeat',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261112194500_original_growth_source_revision_identity_fix_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_archive_v1/i);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_consume_v1/i);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1/i);
 assert.doesNotMatch(sql,/^\s*payload_sha256\s*=\s*excluded\.payload_sha256\s*,/m);
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.brain_guard_obligation_identity/i);
 assert.match(sql,/evidence->>'source_revision'/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_daily_source_archive_v1\(date\) TO service_role/);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(/i);
});
