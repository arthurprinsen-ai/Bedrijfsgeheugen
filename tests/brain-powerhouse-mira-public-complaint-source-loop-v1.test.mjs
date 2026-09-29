import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20260929201000_powerhouse_mira_public_complaint_source_loop_v1.sql','utf8');
const fn=fs.readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
test('Mira public complaint source loop is one closed lineage',()=>{
 for(const s of ['powerhouse_mira_problem_signals_v1','powerhouse_materialize_mira_problem_recommendation_v1','powerhouse_mira_problem_lineage_v1','powerhouse_sync_mira_problem_lineage_v1','mira-public-complaint-source-loop-v1']) assert.ok(sql.includes(s));
 assert.ok(sql.includes('source_backed_first_then_priority'));
 assert.ok(fn.includes('klacht irritant app account wachtwoord'));
 assert.ok(fn.includes('schoolapp ouderportaal'));
 assert.ok(fn.includes('parkeerapp'));
 assert.ok(fn.includes('pakket bezorger'));
 assert.ok(fn.includes('abonnement opzeggen'));
 assert.ok(fn.includes('digitale frustratie'));
 assert.ok(fn.includes('api.dataforseo.com/v3/serp/google/organic/live/advanced'));
 assert.ok(fn.includes('powerhouse_materialize_mira_problem_recommendation_v1'));
});
