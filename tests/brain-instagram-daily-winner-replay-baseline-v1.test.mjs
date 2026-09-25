import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const early=fs.readFileSync('supabase/migrations/20260920102450_instagram_daily_winner_table_replay_baseline_v1.sql','utf8');
const canonical=fs.readFileSync('supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql','utf8');
const authority=fs.readFileSync('supabase/migrations/20260920102500_publication_authority_pgcrypto_qualification.sql','utf8');

test('daily winner rowtype exists before publication authority compiles',()=>{
  assert.match(early,/create table if not exists public\.powerhouse_instagram_daily_winners_v1/);
  assert.match(authority,/v_winner public\.powerhouse_instagram_daily_winners_v1%rowtype/);
});

test('early replay baseline uses the same canonical winner columns',()=>{
  for(const column of ['run_date date primary key','recommendation_id uuid not null','score_version text not null','selected_priority numeric not null','selected_format text not null','selector_evidence jsonb','outcome_evidence jsonb']){
    assert.ok(early.includes(column), column);
    assert.ok(canonical.includes(column), column);
  }
});
