import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');

test('frozen accepted Instagram daily winner remains eligible downstream',()=>{
  assert.match(source,/r\?\.evidence\?\.daily_winner===true/);
  assert.match(source,/\['suggested','accepted'\]\.includes\(clean\(r\?\.status\)\)/);
  assert.match(source,/clean\(instagramWinner\.recommendation_id\)===requiredRecommendationId/);
  assert.match(source,/INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED/);
});

test('generic recommendation eligibility remains strict',()=>{
  assert.match(source,/if \(!\['suggested',''\]\.includes\(clean\(row\?\.status\)\)\) return false;/);
});
