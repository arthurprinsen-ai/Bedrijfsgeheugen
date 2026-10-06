import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('delivery publisher production parity', () => {
  const loop = fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  const publisher = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  const blog = fs.readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
  const migration = fs.readFileSync('docs/production-sql-history/20261006095958_normalize_publication_evidence_objects_v1.sql','utf8');
  assert.match(loop, /powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
  assert.match(publisher, /function jsonObject\(value:any\)/);
  assert.match(publisher, /LINKEDIN_COMPANY_CANONICAL_CONNECTION_NOT_PINNED|LINKEDIN_REAUTH_REQUIRED/);
  assert.match(blog, /const deliveryEvidence=jsonObject\(d\.delivery_evidence\)/);
  assert.match(migration, /powerhouse_jsonb_object_v1/);
  assert.match(migration, /record_content_publication_state/);
});
