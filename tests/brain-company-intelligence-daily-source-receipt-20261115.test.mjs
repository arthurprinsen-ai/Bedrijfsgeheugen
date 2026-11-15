import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261115235900_company_intelligence_existing_daily_source_receipt_v1.sql',import.meta.url),'utf8');
const [company,selfImprovement]=sql.split(/(?=CREATE OR REPLACE FUNCTION public\.powerhouse_run_self_improvement_layer_v1\()/i);
const companyDefinition=company.slice(company.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_run_company_intelligence_os_v1('));
const existingDaily=readFileSync(new URL('../supabase/migrations/20261114235900_innovation_original_agent_intake_recovery_v1.sql',import.meta.url),'utf8');

test('one original day observer consumes existing commercial source event without rerunning sender',()=>{
  assert.match(companyDefinition,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_company_intelligence_os_v1\(/i);
  assert.match(companyDefinition,/event_type='trigger_based_mkb_acquisition_cycle'/);
  assert.match(companyDefinition,/e\.source='powerhouse-trigger-based-mkb-acquisition-runtime-v1'/);
  assert.match(companyDefinition,/e\.event_id::text/);
  assert.match(companyDefinition,/e\.evidence->>'run_date'=p_run_date::text/);
  assert.match(companyDefinition,/ORIGINAL_COMMERCIAL_EVENT_OBSERVED/);
  assert.match(companyDefinition,/ORIGINAL_COMMERCIAL_SOURCE_EVENT_DUE/);
  assert.match(companyDefinition,/provider_send_independent_readback_verified',false/);
  assert.match(companyDefinition,/outreach_invoked_by_company_os',false/);
  assert.doesNotMatch(companyDefinition,/v_execution\s*:=\s*public\.powerhouse_trigger_based_mkb_acquisition_cycle_v1\s*\(/i);
  assert.doesNotMatch(companyDefinition,/public\.powerhouse_(?:dispatch|send|publish|trigger_based_mkb_acquisition_cycle_v1)\s*\(/i);
});
test('original same-day Company Intelligence event is a source observation, never financial success',()=>{
  assert.match(companyDefinition,/'company-intelligence-os:'\|\|p_run_date::text/);
  assert.match(companyDefinition,/'company_intelligence_os_cycle'/);
  assert.match(companyDefinition,/on conflict\(dedupe_key\) do update set/i);
  assert.match(companyDefinition,/data_quality=excluded\.data_quality/);
  assert.match(companyDefinition,/'observed',\s*case when v_execution->>'status'/);
  assert.match(companyDefinition,/'SOURCE_RECEIPT_ONLY' else 'SOURCE_EVIDENCE_DUE'/);
  assert.match(companyDefinition,/financial_source_health/);
  assert.match(companyDefinition,/public\.portal_financial_forecasts_v1/);
  assert.match(companyDefinition,/public\.powerhouse_realized_values/);
  assert.match(companyDefinition,/public\.powerhouse_action_economics/);
  assert.match(companyDefinition,/'net_savings_verified_by_this_snapshot',false/);
  assert.match(companyDefinition,/'missing_data_is_not_zero_benefit',true/);
  assert.doesNotMatch(companyDefinition,/create\s+(?:table|sequence|view)\s/i);
});
test('existing original daily self improvement is sole recurrent driver and fails visibly',()=>{
  assert.match(selfImprovement,/CREATE OR REPLACE FUNCTION public\.powerhouse_run_self_improvement_layer_v1\(/i);
  assert.match(selfImprovement,/v_company_cycle:=public\.powerhouse_run_company_intelligence_os_v1\(p_run_date\)/);
  assert.match(selfImprovement,/v_company_snapshot:=coalesce\(v_company_snapshot/);
  assert.match(selfImprovement,/'original_company_os_daily'/);
  assert.match(selfImprovement,/'source_status'/);
  assert.match(selfImprovement,/'original_source_event_id'/);
  assert.match(selfImprovement,/'ORIGINAL_COMPANY_OBSERVER_FAILED'/);
  assert.match(selfImprovement,/'ORIGINAL_COMPANY_OS_ERROR'/);
  assert.match(selfImprovement,/'COMPANY_OS_SOURCE_RECEIPT_DUE'/);
  assert.match(selfImprovement,/'independent_customer_financial_effect_proven',false/);
  assert.match(selfImprovement,/'observer_only_no_external_send',true/);
  assert.match(existingDaily,/company_intelligence_authority/);
  assert.equal((sql.match(/\$function\$;/g)||[]).length,2);
  assert.doesNotMatch(sql,/\bcron\.schedule|net\.http_post|create\s+table\b|delete\s+from\b/i);
});

test('original SECURITY DEFINER functions retain service_role-only execution after DDL',()=>{
  for(const fn of ['powerhouse_run_company_intelligence_os_v1','powerhouse_run_self_improvement_layer_v1']){
    assert.match(sql,new RegExp('REVOKE ALL ON FUNCTION public\\.'+fn+'\\(date\\) FROM PUBLIC, anon, authenticated','i'));
    assert.match(sql,new RegExp('GRANT EXECUTE ON FUNCTION public\\.'+fn+'\\(date\\) TO service_role','i'));
  }
  assert.doesNotMatch(sql,/GRANT EXECUTE ON FUNCTION public\.(?:powerhouse_run_company_intelligence_os_v1|powerhouse_run_self_improvement_layer_v1)\(date\) TO (?:anon|authenticated|PUBLIC)/i);
});
