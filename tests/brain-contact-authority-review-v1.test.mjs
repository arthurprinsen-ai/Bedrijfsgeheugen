import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const migration=readFileSync(new URL('../supabase/migrations/20261013160000_powerhouse_canonical_contact_authority_review_v1.sql',import.meta.url),'utf8');
const runner=readFileSync(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts',import.meta.url),'utf8');
test('authority review is integrated into original commercial heartbeat',()=>{
 assert.match(runner,/async function reviewContactAuthority\(/);
 assert.match(runner,/powerhouse_contact_authority_review_batch_v1/);
 assert.match(runner,/const contactAuthorityReview=await reviewContactAuthority\(\)/);
 assert.match(runner,/const outboundLanesResult=await runOutboundLanes\(\)/);
});
test('never turn unknown consent into outbound authorization',()=>{
 assert.match(migration,/AUTHORITY_REVIEW_REQUIRED/);
 assert.match(migration,/SUPPRESSED/);
 assert.match(migration,/CONTACT_PRESSURE_COOLDOWN/);
 assert.match(migration,/APPROVED_FURTHER_GATES_REQUIRED/);
 assert.match(migration,/direct_send_performed',false/);
 assert.match(migration,/consent_inferred',false/);
});
test('review is bounded, daily, and uses existing ledgers',()=>{
 assert.match(migration,/least\(coalesce\(p_limit,500\),500\)/);
 assert.match(migration,/email_authority,run_date/);
 assert.match(migration,/powerhouse_sales_actions/);
 assert.match(migration,/powerhouse_email_contact_suppressions/);
 assert.doesNotMatch(migration,/create table|cron\.schedule|http_post/i);
});
