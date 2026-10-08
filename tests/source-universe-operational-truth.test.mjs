import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('tools/assurance/source-universe-operational-truth.sql','utf8');
test('catalog capability is not reported as source ingestion',()=>{
 assert.match(sql,/last_observed_at is not null/);
 assert.match(sql,/last_observed_at >= now\(\)-interval '24 hours'/);
 assert.match(sql,/live_without_observation/);
 assert.match(sql,/NO_RECENT_SOURCE_EVIDENCE/);
});
test('company impact and monetary claims remain evidence-gated',()=>{
 assert.match(sql,/status='READY' and impact_score is not null/);
 assert.match(sql,/monetary_without_evidence/);
 assert.match(sql,/GUARD_FAILURE/);
 assert.doesNotMatch(sql,/insert\s+into|update\s+public|delete\s+from|cron\.schedule/i);
});
