import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20260929165000_growth_swarm_bounded_refresh_v1.sql','utf8');

test('growth swarm refresh avoids population-wide person and company views',()=>{
  assert.doesNotMatch(migration,/powerhouse_person_intelligence_v1/);
  assert.doesNotMatch(migration,/powerhouse_company_intelligence_v1/);
  assert.match(migration,/candidate_companies/);
  assert.match(migration,/powerhouse_mkb_trigger_intelligence_v1/);
  assert.match(migration,/powerhouse_opportunities/);
  assert.match(migration,/powerhouse_predictive_signals/);
  assert.match(migration,/powerhouse_sales_outcomes/);
});

test('bounded refresh retains Growth Swarm commercial contracts',()=>{
  assert.match(migration,/powerhouse_growth_swarm_accounts_v1/);
  assert.match(migration,/growth_swarm_dossier/);
  assert.match(migration,/referral_activation/);
  assert.match(migration,/entry_offer_floor_eur/);
});
