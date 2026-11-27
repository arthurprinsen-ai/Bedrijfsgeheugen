import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const text=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const contract=JSON.parse(text('brain/contracts/portal-original-one-loop-receipts-20261112.json'));
const fingerprint='portal|all-fields-external-scans-pricing|original-source-consumer-heartbeat-receipts|20261112-v1';

test('historical replay: one original owner for each of six surfaces, no false cross-stage green',()=>{
 assert.equal(contract.fingerprint,fingerprint);
 assert.deepEqual(contract.issues,[4215,4198]);
 assert.deepEqual(contract.surfaces,[
  'authenticated_portal_fields','authorized_external_source_data','public_scans',
  'pricing_and_package_advice','powerhouse_provider_action','heartbeat_effect_and_learning'
 ]);
 assert.deepEqual(contract.evidence_stages,[
  'SOURCE_STORED','ORIGINAL_BRAIN_CONSUMER_ACK','AUTHORIZED_PROVIDER_ACTION_READBACK',
  'OUTCOME_MEASURED','MATURE_TREATMENT_AND_HOLDOUT',
  'NEXT_NATURAL_RUN_LEARNING_APPLIED'
 ]);
 assert.equal(contract.full_green_gate,'ALL_STAGES_PROVEN_FOR_REAL_AUTHORIZED_TENANT_AND_SAME_LINEAGE');
 assert.equal(contract.unproved_status,'EVIDENCE_DUE');
 assert.equal(contract.keep_existing_execution_active,true);
 assert.equal(contract.new_cron_or_parallel_writer,false);
 assert.equal(contract.anonymous_scan_is_tenant_business_input,false);
 assert.equal(contract.pricing_cta_is_paid_order,false);
 assert.equal(contract.synthetic_scan_is_customer_conversion,false);
 assert.equal(contract.connector_metadata_is_live_tenant_data,false);
});

test('shadow: existing original agents are assigned complete cross-surface truth and retain one loop',()=>{
 const agents=text('platform/agents/agent-team.mjs');
 for(const task of [
 'reconcile-website-portal-scans-pricing-external-data-to-original-powerhouse-heartbeat-ack-without-second-loop',
 'require-per-tenant-revision-source-to-consumer-ack-and-effect-receipts-for-all-customer-input-surfaces',
 'verify-live-pricing-scan-external-connector-and-all-editable-portal-entrypoints-with-original-owner-readback',
 'reject-full-heartbeat-green-from-click-scan-smoke-or-source-deploy-without-provider-effect-holdout-and-applied-learning'
 ]) assert.ok(agents.includes("'"+task+"'"),task);
 const global=text('AGENTS.md');
 const portal=text('.agents/skills/portal-living-interface/SKILL.md');
 const seo=text('.agents/skills/seo-revenue-growth/SKILL.md');
 const cro=text('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md');
 for(const [name,content] of Object.entries({global,portal,seo,cro})){
  assert.ok(content.includes(fingerprint),name+' missing exact original fingerprint');
  assert.match(content,/EVIDENCE_DUE/,name);
  assert.match(content,/Heartbeat/,name);
 }
 assert.match(global,/tweede worker, cron, queue, dataautoriteit/i);
 assert.match(portal,/BusinessInput/);
 assert.match(portal,/CONNECTOR_METADATA_ONLY_NO_LIVE_DATA/);
 assert.match(seo,/SYNTHETIC/);
 assert.match(cro,/holdout/);
});

test('canary: physical original portal, external, scan and pricing source readback boundaries remain intact',()=>{
 const domain=text('portal-v2/domain-state.js');
 const impact=text('portal-v2/portal-impact-engine.js');
 const connectors=text('portal-v2/connected-data-sources.js');
 const scan=text('supabase/functions/powerhouse-scan-ingest/index.ts');
 const growth=text('tools/seo-order-engine/measurement.mjs');
 const pricing=text('tools/site-shell/apply-commercial-pricing-v1.mjs');
 assert.match(domain,/HANDOFF_JOURNAL_PATH='portal\.__brainHandoffJournalV1'/);
 assert.match(domain,/PORTAL_HANDOFF_PRINCIPAL_CHANGED_DURING_WRITE/);
 assert.match(impact,/externalExecutionAuthorized:false/);
 assert.match(connectors,/CONNECTOR_METADATA_ONLY_NO_LIVE_DATA/);
 assert.match(scan,/growthReceipt\?\.event_type!=='scan_completed'/);
 assert.match(scan,/growthReceipt\?\.payload\?\.scan_id/);
 assert.match(scan,/is_robot:productionSmoke/);
 assert.match(growth,/primary_cta_click/);
 assert.match(growth,/selfscan_start/);
 assert.match(pricing,/data-bg-conversion="pakketadvies"/);
 assert.match(pricing,/syncPackageAdvice/);
});
