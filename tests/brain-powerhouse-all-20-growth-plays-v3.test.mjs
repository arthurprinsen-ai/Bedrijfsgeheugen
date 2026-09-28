import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928161000_powerhouse_all_20_growth_plays_v3.sql','utf8');
const scan=fs.readFileSync('pages/scan.html','utf8');
const scanJs=fs.readFileSync('assets/scan-workshop.js','utf8');
const ingest=fs.readFileSync('supabase/functions/powerhouse-scan-ingest/index.ts','utf8');
const frisse=fs.readFileSync('frisse-blik.html','utf8');

const formerlyMissing=[
 'mkb-friction-index','positive-public-teardown','anti-consultancy-challenge',
 'boardroom-fear-of-blindness','competitor-switch-pages',
 'data-contribution-flywheel','risk-reversal'
];

test('all formerly incomplete growth plays have executable paths',()=>{
  for(const k of formerlyMissing) assert.match(migration,new RegExp(k));
  assert.match(migration,/powerhouse_growth_play_execution_contract_v1/);
  assert.match(migration,/powerhouse_growth_play_build_status_v1/);
  assert.match(migration,/execution_complete/);
  assert.match(migration,/BUILT_ACTIVE/);
});

test('all growth plays reuse canonical persuasion and one commercial owner',()=>{
  assert.match(migration,/powerhouse_persuasion_next_best_action_v1/);
  assert.match(migration,/powerhouse_optimize_prepared_outreach_v1/);
  assert.match(migration,/powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
  assert.match(migration,/shared_daily_email_cap/);
  assert.match(migration,/greatest\(0,5-/);
});

test('noncanonical duplicate persuasion side path is explicitly removed',()=>{
  assert.match(migration,/drop function if exists public\.powerhouse_persuasion_revenue_optimizer_v1/);
  assert.match(migration,/drop table if exists public\.powerhouse_persuasion_decisions_v1/);
  assert.match(migration,/drop table if exists public\.powerhouse_persuasion_principles_v1/);
});

test('SEO switch play reuses canonical content/SEO owner and truth gates',()=>{
  assert.match(migration,/seo_first_mover_intent_gap/);
  assert.match(migration,/existing-owner\/cannibalization/i);
  assert.match(migration,/no_fake_comparison/);
  assert.match(migration,/competitor_claims_public_evidence_only/);
});

test('benchmark contribution requires explicit optional consent end to end',()=>{
  assert.match(scan,/id="benchmarkConsent"/);
  assert.match(scan,/Optioneel:/);
  assert.match(scanJs,/benchmark_consent/);
  assert.match(ingest,/benchmark_consent/);
  assert.match(migration,/benchmark_consent/);
  assert.match(migration,/minimum_public_group_size/);
});

test('Frisse Blik visibly carries anti-consultancy and bounded output contract',()=>{
  assert.match(frisse,/Anti-consultancy challenge/i);
  assert.match(frisse,/drie concrete observaties/i);
  assert.match(frisse,/Vooraf toetsbare scan-output/i);
  assert.match(frisse,/niet gerechtvaardigd/i);
});
