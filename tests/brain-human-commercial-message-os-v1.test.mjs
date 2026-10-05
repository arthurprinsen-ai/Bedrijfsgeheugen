import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20261005122000_powerhouse_human_commercial_message_os_v1.sql','utf8');
const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
const email=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const linkedin=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');

test('human commercial message OS carries explicit sales/psychology plays',()=>{
  for(const key of ['value_first','spin_diagnose','challenger_insight','trigger_outreach','followup_new_angle','graceful_close','commitment_close','objection_response','value_comment']){
    assert.match(migration,new RegExp("'"+key+"'"));
  }
  assert.match(migration,/psychology/);
  assert.match(migration,/cta_style/);
  assert.match(migration,/powerhouse_sales_technique_performance_v1/);
});

test('semantic relevance blocks recruitment as M&A and supplier directories as AI evidence',()=>{
  assert.match(migration,/talent acquisition\|volume recruitment\|recruitment\|recruiter/);
  assert.match(migration,/suppliers\?\|manufacturers\?\|directory\|sitemap/);
  assert.match(migration,/source_trigger_relevance/);
  assert.match(migration,/not b2\.has_verified_trigger or b2\.source_trigger_relevance/);
});

test('composer forbids machine taxonomy and irrelevant forecast leakage',()=>{
  assert.match(composer,/machine_taxonomy_as_personalization_forbidden|machineTerms/);
  assert.match(composer,/source_trigger_relevance/);
  assert.match(composer,/predicted_problem:triggerRelevant\?action\.predicted_problem:null/);
  assert.match(composer,/Externe AI-content of een AI-product is nooit automatisch bewijs/);
  assert.match(composer,/quality_passed:qv\.passed/);
  assert.match(composer,/message_hash:hash/);
});

test('external executors fail closed on unproven human copy',()=>{
  for(const src of [email,linkedin]){
    assert.match(src,/HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);
    assert.match(src,/commercial_intelligence/);
    assert.match(src,/quality_passed/);
  }
});


test('live persuasion optimizer and semantic copy guards remain canonical',()=>{
  const persuasion=fs.readFileSync('supabase/migrations/20261005151500_powerhouse_persuasion_revenue_optimizer_v1.sql','utf8');
  assert.match(persuasion,/powerhouse_persuasion_revenue_optimizer_v1/);
  assert.match(persuasion,/reciprocity_value_first/);
  assert.match(persuasion,/autonomy_reverse_sell/);
  assert.match(persuasion,/sensitive-trait targeting/);
  assert.match(persuasion,/revoke execute on function/);
  assert.match(composer,/powerhouse_persuasion_revenue_optimizer_v1/);
  assert.match(composer,/semantic_topic_leak_free/);
  assert.match(composer,/followup_evidence_match/);
  assert.match(composer,/canonicalNumber/);
  assert.match(composer,/persuasion_authority/);
});


test('human commercial composer v2 requires source-specific personalization',()=>{
  assert.match(composer,/powerhouse-human-commercial-message-composer-v2/);
  assert.match(composer,/sourceSpecificContext/);
  assert.match(composer,/sourceContext\.length>20/);
  assert.match(composer,/inspirerend\|indrukwekkend\|geweldig/);
  assert.match(composer,/veel \(bedrijven\|organisaties\|founders/);
  assert.match(composer,/forceer dan geen persoonlijke boodschap/);
});
