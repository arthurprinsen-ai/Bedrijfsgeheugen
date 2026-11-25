import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts', import.meta.url),'utf8');

test('personal LinkedIn founder journey stays predictive and evidence bound',()=>{
  assert.match(source,/powerhouse_materialize_source_backed_channel_candidates_v2/);
  assert.match(source,/recent_personal_chapters/);
  assert.match(source,/predictive_forecasts/);
  assert.match(source,/Maak nooit van een forecast een feit/);
  assert.match(source,/software, bedrijfsdata, BI\/analytics en AI/);
  assert.match(source,/zien wat verandert → waarde\/prioriteit bepalen/);
});

test('personal LinkedIn language rotation is one original chapter, not duplicate translation',()=>{
  assert.match(source,/verified_personal_source\.evidence\.intended_language/);
  assert.match(source,/origineel volgend hoofdstuk/);
  assert.match(source,/Publiceer nooit twee talen in dezelfde persoonlijke LinkedIn-post/);
});
