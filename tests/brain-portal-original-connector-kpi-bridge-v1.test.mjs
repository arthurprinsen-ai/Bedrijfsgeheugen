import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildConnectorKpiIndex,measurementForConnectorRule,normalizeConnectorRuleSource,CONNECTOR_KPI_CONTRACT}
 from '../supabase/functions/powerhouse-commercial-heartbeat-runner/connector-kpi-source.mjs';
import {planOriginalHeartbeatObservations,planOriginalHeartbeatScans}
 from '../supabase/functions/powerhouse-commercial-heartbeat-runner/portal-signal-heartbeat.mjs';
import {normalizeRule,evaluateSignals}
 from '../portal-v2/signal-detection.js';

const tenantA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tenantB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const connector='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const execution='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const when='2026-11-22T11:00:00Z',now='2026-11-22T12:00:00Z';
const rev='source-revision-20261122-a';
const proof='provider-readback-123456';
function fixture(){
 const definition={
   organisatie_id:tenantA,id:connector,versie:3,status:'Active',
   configuratie:{dataUse:{mode:'PORTAL_INSIGHTS'},routing:{portalPages:['cijfers-maatstaven'],selectedFields:['revenue']},
     runtime:{impactReviewPending:false}}
 };
 const ex={id:execution,organisatie_id:tenantA,connector_id:connector,connector_versie:3,
   status:'LIVE_INGEST_VERIFIED',
   evidence:{proofLevel:'LIVE_PROVIDER_READBACK',sourceReadSuccess:true,
     targetReadbackVerified:true,providerReadId:proof,sourceRevision:rev}};
 const observation={tenant_id:tenantA,source_type:'connector-kpi',
   normalized_source_revision:rev,observed_at:when,
   raw_payload:{contract:CONNECTOR_KPI_CONTRACT,connectorId:connector,connectorVersion:3,
     executionId:execution,sourceField:'revenue',metricId:'revenue',
     sourceRevision:rev,providerReadId:proof,measuredAt:when,value:101}};
 return {definition,ex,observation};
}
const rule=(source={type:'connector',connectorId:connector,field:'revenue'},operator='below')=>({
 id:'r-connector',metricId:'revenue',source,operator,
 threshold:150,monitoring:true,enabled:true,channels:{email:true,push:true}
});
const state=(tenant=tenantA,otherValue=10000000)=>({
 tenant_id:tenant,layer:'legacy-migration',source_updated_at:when,updated_at:when,
 payload:{data:{portal:{metrics:{revenue:otherValue},signalering:{rules:[rule()]}}}}
});
const index=(x)=>buildConnectorKpiIndex({definitions:[x.definition],executions:[x.ex],
  observations:[x.observation],now});

test('real stored connector ingestion can trigger only same authorized tenant source, never editable portal fallback',async()=>{
 const v=fixture(),measurements=index(v);
 assert.equal(measurements.size,1);
 const actual=measurementForConnectorRule(measurements,tenantA,rule());
 assert.equal(actual.value,101);
 assert.equal(actual.sourceRevision,rev);
 assert.equal(actual.evidenceState,'CANONICAL_RECEIPT_MATCHED_NOT_EXTERNAL_INDEPENDENT_AUDIT');
 assert.equal(measurementForConnectorRule(measurements,tenantB,rule()),null);
 const events=await planOriginalHeartbeatObservations([state(),state(tenantB)],{now,connectorMeasurements:measurements});
 assert.equal(events.length,1);
 assert.equal(events[0].evidence.sourceKind,'connector');
 assert.equal(events[0].evidence.sourceMeasurementFreshness,'UNKNOWN');
 assert.equal(events[0].evidence.notificationDeliveryVerified,false);
 assert.equal(events[0].evidence.autonomousActionExecuted,false);
 assert.equal(events[0].evidence.connectorMeasurementRecorded,true);
 assert.ok(!JSON.stringify(events).includes(tenantA));
 const [scan]=await planOriginalHeartbeatScans([state()],{now,connectorMeasurements:measurements});
 assert.equal(scan.evidence.connectorRuleCount,1);
 assert.equal(scan.evidence.connectorMeasurementsMatched,1);
 assert.equal(scan.evidence.thresholdTriggersObserved,1);
});
test('missing provider source never reads a spoofed portal value; browser cannot claim server ingress',async()=>{
 const s=state();
 s.payload.data.portal.metrics.revenue=1;
 assert.deepEqual(await planOriginalHeartbeatObservations([s],{now}),[]);
 const browser=evaluateSignals([rule()],s.payload.data,{authenticated:true});
 assert.equal(browser[0].value,null);
 assert.equal(browser[0].triggered,false);
 assert.equal(browser[0].status,'bronbewijs-open');
 assert.equal(browser[0].source.type,'connector');
 const miss=state();
 miss.payload.data.portal.signalering.rules=[rule(undefined,'missing')];
 const events=await planOriginalHeartbeatObservations([miss],{now});
 assert.equal(events.length,1);
 assert.equal(events[0].evidence.connectorMeasurementRecorded,false);
 assert.equal(events[0].evidence.sourceMeasurementFreshness,'UNKNOWN');
});
test('a test passed / metadata-only connector is never live measurement',()=>{
 const v=fixture();
 v.ex.status='TEST_PASSED';
 assert.equal(index(v).size,0);
 v.ex.status='LIVE_INGEST_VERIFIED';v.ex.evidence.proofLevel='PROVIDER_VERIFIED';
 assert.equal(index(v).size,0);
 v.ex.evidence.proofLevel='LIVE_PROVIDER_READBACK';
 v.ex.evidence.targetReadbackVerified=false;
 assert.equal(index(v).size,0);
});
test('wrong tenant, paused, old version, disallowed field, pending approval and stale receipt are rejected',()=>{
 const v=fixture();
 v.observation.tenant_id=tenantB;assert.equal(index(v).size,0);
 v.observation.tenant_id=tenantA;v.definition.status='Paused';assert.equal(index(v).size,0);
 v.definition.status='Active';v.ex.connector_versie=2;assert.equal(index(v).size,0);
 v.ex.connector_versie=3;v.definition.configuratie.routing.selectedFields=[];assert.equal(index(v).size,0);
 v.definition.configuratie.routing.selectedFields=['revenue'];v.definition.configuratie.runtime.impactReviewPending=true;assert.equal(index(v).size,0);
 v.definition.configuratie.runtime.impactReviewPending=false;v.observation.observed_at='2026-10-01T00:00:00Z';assert.equal(index(v).size,0);
});
test('source revision mismatch, future timestamp, invalid value, unexpected KPI and malformed id fail closed',()=>{
 const v=fixture();
 v.ex.evidence.sourceRevision='wrong-revision-long';assert.equal(index(v).size,0);
 v.ex.evidence.sourceRevision=rev;v.observation.raw_payload.measuredAt='2026-12-01T00:00:00Z';assert.equal(index(v).size,0);
 v.observation.raw_payload.measuredAt=when;v.observation.raw_payload.value=false;assert.equal(index(v).size,0);
 v.observation.raw_payload.value=101;v.observation.raw_payload.metricId='private_token';assert.equal(index(v).size,0);
 assert.equal(normalizeConnectorRuleSource({type:'connector',connectorId:'../../secret',field:'revenue'},'revenue'),null);
 assert.equal(normalizeConnectorRuleSource({type:'connector',connectorId:connector,field:'api.key'},'revenue'),null);
 assert.equal(normalizeRule({id:'broken',metricId:'revenue',operator:'above',threshold:3,source:{type:'connector',connectorId:'bad',field:'revenue'}}),null);
});
test('source consent revocation and disabled monitoring block connector trigger',async()=>{
 const v=fixture(),m=index(v),s=state();
 s.payload.data.portal.signalering.rules[0].monitoring=false;
 assert.deepEqual(await planOriginalHeartbeatObservations([s],{now,connectorMeasurements:m}),[]);
 s.payload.data.portal.signalering.rules[0].monitoring=true;
 s.payload.data.portal.signalering.rules[0].source={type:'connector',connectorId:connector,field:'non_permitted'};
 assert.deepEqual(await planOriginalHeartbeatObservations([s],{now,connectorMeasurements:m}),[]);
});
test('original runner reads bounded tenant-scoped verified receipts without new cron or separate sender',async()=>{
 const runner=await readFile(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts',import.meta.url),'utf8');
 const ui=await readFile(new URL('../portal-v2/voice-signals.js',import.meta.url),'utf8');
 for(const piece of ['buildConnectorKpiIndex','LIVE_INGEST_VERIFIED',"source_type='connector-kpi'",
   'where organisatie_id=any($1::uuid[])','portal_user_signal_observed'])
   assert.ok(runner.includes(piece),piece);
 assert.doesNotMatch(runner,/cron\.schedule\(|GMAIL_SEND_EMAIL|Notification\.requestPermission/);
 assert.match(ui,/\/api\/connectors/);
 assert.match(ui,/data-vs-connector-choice/);
 assert.match(ui,/stateClient\.currentUser/);
 assert.doesNotMatch(ui,/service_role|COMPOSIO_API_KEY|SUPABASE_DB_URL/);
});
