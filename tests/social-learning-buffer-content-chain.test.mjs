import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260912143000_content_calendar_learning_chain.sql','utf8');

test('published social posts inherit the canonical calendar experiment',()=>{
  assert.match(sql,/create trigger social_posts_content_chain/i);
  assert.match(sql,/source_campaign_id := coalesce\(new\.source_campaign_id, v_experiment\.experiment_id\)/i);
  assert.match(sql,/calendar_date = v_date/i);
});

test('the same bridge materializes measurable post features idempotently',()=>{
  assert.match(sql,/insert into public\.bg_post_kenmerken/i);
  assert.match(sql,/on conflict \(post_key\) do update/i);
  for(const field of ['hook_type','format','experiment_id','awareness_stage','behavioral_lever','category_entry_point']) assert.match(sql,new RegExp(field,'i'));
});

test('existing observed posts are backfilled through the same trigger',()=>{
  assert.match(sql,/update public\.social_posts/i);
  assert.match(sql,/exists \([\s\S]*public\.social_experiments/i);
  assert.match(sql,/Europe\/Amsterdam/i);
});
