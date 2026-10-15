import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20261014190000_daily_connection_review_date_index.sql','utf8');
test('daily review count is indexed on the Brain decision date, with bounded DDL',()=>{
 assert.match(sql,/source_snapshot\s*#>>\s*'\{daily_decision,run_date\}'/);
 assert.match(sql,/create index if not exists powerhouse_connection_enrichment_state_review_date_idx/);
 assert.match(sql,/lock_timeout='2s'/);
 assert.match(sql,/statement_timeout='25s'/);
 assert.doesNotMatch(sql,/update\s+public\.powerhouse_connection_enrichment_state_v1/i);
});
