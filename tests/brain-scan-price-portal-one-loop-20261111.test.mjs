import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('all scans require three original durable receipts before public success',()=>{
 const ingest=root('supabase/functions/powerhouse-scan-ingest/index.ts');
 assert.match(ingest,/scan_inzendingen'\)\.upsert\(scanRow/);
 assert.match(ingest,/powerhouse_runtime_events'\)\.upsert\(eventRow/);
 assert.match(ingest,/const \{error:growthError\}=await client\.from\('growth_events'\)\.upsert/);
 assert.match(ingest,/if\(growthError\)return json\(\{ok:false,error:'SCAN_GROWTH_HANDOFF_FAILED'/);
 assert.match(ingest,/select\('event_id,event_type,payload'\)\.eq\('event_id',dedupe\)\.maybeSingle\(\)/);
 assert.match(ingest,/growthReceipt\?\.event_type!=='scan_completed'/);
 assert.match(ingest,/growthReceipt\?\.payload\?\.scan_id/);
 assert.match(ingest,/SCAN_GROWTH_HANDOFF_UNCONFIRMED/);
 assert.match(ingest,/growth_event_id:dedupe/);
 assert.match(ingest,/growth_event_readback_proven:true/);
 assert.match(ingest,/onConflict:'event_id',ignoreDuplicates:true/);
 assert.match(ingest,/medium:'unattributed'/);
 assert.doesNotMatch(ingest,/medium:'organic'/,'do not infer organic traffic from unknown scan acquisition');
});

test('website scans and pricing use existing original CRO producer, not a second metrics queue',()=>{
 const growth=root('tools/seo-order-engine/measurement.mjs');
 const oneRoof=root('tools/site-shell/apply-business-os-positioning.mjs');
 const oldTracker=root('assets/meting.js');
 const scanClient=root('assets/scan-persistence.js');
 assert.match(oneRoof,/data-bg-business-os-journey/);
 assert.match(oneRoof,/data-bg-conversion="bedrijfslek"/);
 assert.match(oneRoof,/\/en\/zelfscan/);
 assert.match(growth,/page_view/);assert.match(growth,/primary_cta_click/);
 assert.match(growth,/selfscan_start/);assert.match(growth,/frisse_blik_start/);
 assert.match(growth,/route=pathname.indexOf\('\/en\/'\)/);
 assert.match(growth,/actionPath=safePath.indexOf\('\/en\/'\)/);
 assert.match(growth,/actionDest.hostname===window.location.hostname/);
 assert.match(oldTracker,/getElementById\('bg-growth-measurement'\)/);
 assert.match(scanClient,/data\?\.ok!==true/);
 assert.doesNotMatch(growth,/setInterval\(|cron\.schedule|new Worker/);
});

test('customer portal field and external-data impact keep original Brain authorization and unknown truth',()=>{
 const domain=root('portal-v2/domain-state.js');
 const impact=root('portal-v2/portal-impact-engine.js');
 const source=root('portal-v2/connected-data-sources.js');
 assert.match(domain,/HANDOFF_JOURNAL_PATH='portal\.__brainHandoffJournalV1'/);
 assert.match(domain,/PORTAL_HANDOFF_PRINCIPAL_CHANGED_DURING_WRITE/);
 assert.match(domain,/queueMicrotask\(\(\)=>/);
 assert.match(impact,/externalExecutionAuthorized:false/);
 assert.match(source,/CONNECTOR_METADATA_ONLY_NO_LIVE_DATA/);
 assert.doesNotMatch(source,/active\s*:\s*true\s*,\s*verified\s*:\s*true/);
});
