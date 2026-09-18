import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918110000_legacy_growth_outcome_reconciler_v1.sql','utf8');

test('24h evaluation can close only from observed impressions evidence',()=>{
  assert.match(sql,/24h_impressions_gte/);
  assert.match(sql,/social_metric_snapshots/);
  assert.match(sql,/observed_at<=v_published\+interval '24 hours'/);
  assert.match(sql,/v_actual>=v_expected/);
});

test('72h substantive interactions use the canonical comments plus shares plus saves definition',()=>{
  assert.match(sql,/72h_substantive_interactions_gte/);
  assert.match(sql,/metrics \? 'comments'/);
  assert.match(sql,/metrics \? 'shares'/);
  assert.match(sql,/metrics \? 'saves'/);
  assert.match(sql,/comments[\s\S]*shares[\s\S]*saves/);
});

test('insufficient metric evidence stays open rather than being guessed',()=>{
  assert.match(sql,/v_deferred := v_deferred \+ 1/);
  assert.doesNotMatch(sql,/coalesce\([^\n]*saves[^\n]*,0\)[\s\S]*without/i);
});

test('bootstrap closes only after its declared child obligation is truly closed',()=>{
  assert.match(sql,/c\.obligation_id=b\.payload->>'next_due_obligation'/);
  assert.match(sql,/c\.status='CLOSED'/);
  assert.match(sql,/CLOSED_FIRST_REAL_OUTCOME_OBSERVED/);
});

test('reconciler is recurring and browser roles cannot execute it',()=>{
  assert.match(sql,/powerhouse-legacy-growth-outcome-reconcile-v1/);
  assert.match(sql,/'17 \* \* \* \*'/);
  assert.match(sql,/revoke execute on function public\.powerhouse_reconcile_legacy_growth_outcomes_v1\(timestamptz\) from public,anon,authenticated/i);
});
