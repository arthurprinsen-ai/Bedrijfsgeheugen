import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=new URL('../supabase/functions/revenue-learning-store/index.ts',import.meta.url);

test('edge store is service-token protected and bridges existing social/growth sources',async()=>{
  const src=await readFile(path,'utf8');
  assert.match(src,/x-bg-service-token/);
  assert.match(src,/TOKEN_HASH/);
  for(const source of ['social_posts','social_metric_snapshots','growth_page_daily','growth_events','growth_outcomes']) assert.match(src,new RegExp(source));
  for(const action of ['list_projection_candidates','upsert_evidence','list_due_evidence','list_cohort','mark_evidence_evaluated','upsert_learning','list_current_learnings','record_application','reconcile_applications','record_decision','record_obligation','get_projection','put_projection']) assert.match(src,new RegExp(`action==='${action}'`));
});
