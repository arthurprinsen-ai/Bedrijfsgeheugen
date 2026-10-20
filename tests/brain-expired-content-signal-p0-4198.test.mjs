import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20261010090900_filter_expired_content_signals_v1.sql',import.meta.url),'utf8');
test('source-backed candidate selection excludes expired regulatory/sales deadlines',()=>{
  assert.match(sql,/powerhouse_materialize_source_backed_channel_candidates_v1/);
  assert.match(sql,/and \(deadline is null or deadline >= p_date\)/);
  assert.match(sql,/and opgehaald_op >= now\(\)-interval '10 days'/);
});
test('preserves canonical channels, dedupe and historical source records',()=>{
  assert.match(sql,/source-backed-linkedin-company:/);
  assert.match(sql,/source-backed-blog:/);
  assert.match(sql,/on conflict\(dedupe_key\)/);
  assert.doesNotMatch(sql,/delete from\s+public\.bg_externe_signalen/i);
});