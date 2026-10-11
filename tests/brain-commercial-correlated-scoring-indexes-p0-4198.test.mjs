import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20261011094454_powerhouse_commercial_correlated_lookup_indexes_p0_4198.sql','utf8');

test('canonical commercial scorer lookups have their own non-destructive supporting indexes',()=>{
  for(const [table,column] of [
    ['powerhouse_predictive_signals','entity_key'],
    ['powerhouse_forecasts','scope_key'],
    ['powerhouse_forecasts','topic_key'],
    ['powerhouse_sales_outcomes','opportunity_key'],
    ['powerhouse_sales_outcomes','content_key'],
    ['powerhouse_sales_outcomes','campaign_key'],
    ['powerhouse_sales_outcomes','topic_key']
  ]){
    assert.match(migration,new RegExp('CREATE INDEX IF NOT EXISTS [\\w]+\\s+ON public\\.'+table+' \\('+column+'\\)'));
  }
  assert.equal((migration.match(/CREATE INDEX IF NOT EXISTS/g)||[]).length,7);
  assert.match(migration,/SET LOCAL lock_timeout = '3s'/);
  assert.doesNotMatch(migration,/\\bDROP\\b|\\bTRUNCATE\\b|\\bDELETE\\b|\\bcron\\.schedule\\b|\\bnet\\.http_post\\b|\\bINSERT\\b|\\bUPDATE\\b/i);
  assert.match(migration,/ANALYZE public\.powerhouse_forecasts/);
});

test('forecast scope and topic paths filter only active claimed rows, not historical forecasts',()=>{
  assert.match(migration,/ON public\.powerhouse_forecasts \(scope_key\)\s+WHERE status IN \('active','claimed'\)/);
  assert.match(migration,/ON public\.powerhouse_forecasts \(topic_key\)\s+WHERE status IN \('active','claimed'\)/);
});
