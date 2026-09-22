import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('supabase/migrations/20260922073100_prevent_personal_linkedin_fallback_source_reuse_v1.sql','utf8');
test('personal LinkedIn fallback rejects previously used source content_id',()=>{
 assert.match(s,/prior\.target_channel='linkedin_personal'/);
 assert.match(s,/prior\.run_date < p_date/);
 assert.match(s,/prior\.evidence->>'content_id'/);
 assert.match(s,/not exists \(/);
});