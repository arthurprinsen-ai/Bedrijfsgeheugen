import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../supabase/functions/bg-analytics-sync-composio/index.ts',import.meta.url),'utf8');
const testSection=code.slice(code.indexOf('// HTTP200 with zero returned rows'),code.indexOf("  const headers=['date'"));
test('historical GA4 HTTP200 and zero provider rows never create a fake success receipt',()=>{
 assert.ok(testSection.includes('if(rows.length===0)'));
 assert.match(testSection,/status:consentLimited\?'CONSENT_LIMITED':'NO_SOURCE_DATA'/);
 assert.match(testSection,/status:consentLimited\?'privacy_limited':'error',fout:reason/);
 assert.match(testSection,/await bewijs\(false,result,consentLimited\?'CONSENT_BOUNDARY':'EMPTY_SOURCE'\)/);
 assert.match(testSection,/return json\(result,consentLimited\?200:503\)/);
 assert.ok(code.indexOf("if(rows.length===0)")<code.indexOf("  const headers=['date'"));
 assert.ok(testSection.includes('provider_report_rows:0'));
});
test('the original owner verifies an independent GA4 totals report without guessing traffic or bypassing consent',()=>{
 assert.match(code,/async function originalGa4AggregateProbe/);
 assert.match(code,/name:'sessions'/);
 assert.match(code,/name:'eventCount'/);
 assert.match(testSection,/aggregate_probe:aggregate/);
 assert.match(testSection,/GA4_DIMENSION_QUERY_EMPTY_WITH_NONZERO_TOTAL/);
 assert.match(testSection,/actual_site_sessions:'UNKNOWN_NOT_INFERRED'/);
});
test('same original analytics function creates exactly one canonical ongoing recovery obligation per incident',()=>{
 assert.match(code,/db\.rpc\('brain_create_obligation',identity\)/);
 assert.match(code,/p_obligation_type:'MEASUREMENT_REPAIR'/);
 assert.match(code,/p_capability_id:'powerhouse-data-intake-learning-spine-v1'/);
 assert.match(code,/p_business_entity:'ga4-analytics'/);
 assert.match(code,/p_business_period:'ongoing'/);
 assert.match(code,/p_business_timezone:'Europe\/Amsterdam'/);
 assert.match(code,/p_payload_sha256:await sha256\('ga4-analytics\|empty-success\|stale-source\|recovery-v1'\)/);
 assert.match(code,/p_change_id:fingerprint/);
});
test('original Brain repair uses atomic compare-and-swap and preserves the running owner',()=>{
 assert.match(code,/db\.rpc\('brain_transition_obligation'/);
 assert.match(code,/p_expected_version:ob.version/);
 assert.match(code,/historical=\(ob\.evidence&&typeof ob\.evidence==='object'/);
 assert.match(code,/\.\.\.historical,status:'REPAIR_REQUIRED',latest_observation:report/);
 assert.match(code,/\['RUNNING','BLOCKED'\]\.includes\(ob.state\)\?ob.state:'READY'/);
 assert.match(code,/GA4_CANONICAL_REPAIR_CAS_FAILED/);
 assert.match(code,/identity\.p_business_period=day/);
 assert.match(code,/\['FULFILLED','CANCELLED','BREACHED'\]\.includes\(ob.state\)/);
});
test('the original scheduler and normal nonempty provider route are preserved, with no side-effect replay',()=>{
 assert.match(code,/const BRON='bg-analytics-sync-composio'/);
 assert.match(code,/const headers=\['date','pagePath','sessionCampaignName','sessions','activeUsers','eventCount'\]/);
 assert.match(code,/const status=unmatched>0\?'PARTIAL':'IMPORTED'/);
 assert.match(code,/const existing=|data:existing/);
 assert.match(code,/GA4_CONSENT_LIMITED_NO_SOURCE_ROWS/);
 assert.doesNotMatch(testSection,/\bbg-post-import\b/);
 assert.doesNotMatch(testSection,/status:'ok'/);
});
test('empty provider evidence is recorded separately and not silently accepted as a duplicate batch',()=>{
 assert.match(testSection,/writeRuntime\(db,`ga4-source-empty:\$\{day\}:\$\{sourceRoute\}`,consentLimited\?'observed':'error',observation,'ga4_source_empty_observed'\)/);
 assert.match(code,/eventType='ga4_failover_observed'/);
 assert.match(code,/event_type:eventType/);
 assert.match(testSection,/originalGa4EmptyRepair\(db,day,sourceRoute,observation\)/);
 assert.ok(testSection.indexOf('originalGa4EmptyRepair')<testSection.indexOf('await bewijs(false,result'));
});

test('consent-limited GA4 is explicitly classified, without treating private first-party metrics as Google traffic',()=>{
 assert.match(testSection,/consentedHumanEvidence===false && aggregate!==null && !totalsPositive/);
 assert.match(testSection,/GA4_CONSENT_LIMITED_NO_SOURCE_ROWS/);
 assert.match(testSection,/status:consentLimited\?'privacy_limited':'error'/);
 assert.match(testSection,/source_data_available:false/);
 assert.match(testSection,/NO_CONSENT_BYPASS_NO_FORCED_GA4_TRACKING/);
 assert.match(testSection,/recommended_existing_source:'privacy-minimized bg_interacties for CRO only'/);
 assert.match(testSection,/consentLimited\?200:503/);
 assert.match(testSection,/\.eq\('toestemming',true\)\.eq\('is_robot',false\)/);
});
test('when consented native signals exist but GA4 is empty, original source repair remains non-successful',()=>{
 assert.match(testSection,/GA4_ZERO_DESPITE_CONSENTED_SITE_EVENTS/);
 assert.match(testSection,/GA4_DIMENSION_QUERY_EMPTY_WITH_NONZERO_TOTAL/);
 assert.match(testSection,/GA4_EMPTY_SOURCE_INDEPENDENT_EVIDENCE_DUE/);
 assert.match(testSection,/consent_evidence_error/);
 assert.match(testSection,/await bewijs\(false,result,/);
});
