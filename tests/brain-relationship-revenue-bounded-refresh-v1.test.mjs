import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20260929171000_relationship_revenue_bounded_refresh_v1.sql','utf8');

test('relationship revenue refresh avoids population-wide intelligence views',()=>{
  assert.doesNotMatch(migration,/powerhouse_relationship_revenue_intelligence_v1/);
  assert.doesNotMatch(migration,/powerhouse_person_intelligence_v1/);
  assert.doesNotMatch(migration,/powerhouse_company_intelligence_v1/);
  assert.match(migration,/candidate_people/);
  assert.match(migration,/bg_connecties/);
  assert.match(migration,/powerhouse_opportunities/);
  assert.match(migration,/powerhouse_runtime_events/);
});

test('bounded relationship refresh preserves research and activation actions',()=>{
  assert.match(migration,/research_enrichment/);
  assert.match(migration,/commercial_outreach_review/);
  assert.match(migration,/relationship_revenue_cycle/);
  assert.match(migration,/external_outreach_executed/);
});
