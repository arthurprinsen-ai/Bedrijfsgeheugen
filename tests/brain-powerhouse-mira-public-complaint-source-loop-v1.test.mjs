import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20260929201000_powerhouse_mira_public_complaint_source_loop_v1.sql','utf8');
const fn=fs.readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
test('Mira public complaint source loop is one closed lineage',()=>{
 for(const s of ['powerhouse_mira_problem_signals_v1','powerhouse_materialize_mira_problem_recommendation_v1','powerhouse_mira_problem_lineage_v1','powerhouse_sync_mira_problem_lineage_v1','mira-public-complaint-source-loop-v1']) assert.ok(sql.includes(s));
 assert.ok(sql.includes("source_backed_first_then_priority"));
 assert.ok(fn.includes('reddit.com'));assert.ok(fn.includes('tweakers.net'));assert.ok(fn.includes('radar.avrotros.nl'));assert.ok(fn.includes('kassa.bnnvara.nl'));
 assert.ok(fn.includes('powerhouse_materialize_mira_problem_recommendation_v1'));
});
