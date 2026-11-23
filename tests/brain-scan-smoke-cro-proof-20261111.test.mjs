import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../supabase/functions/powerhouse-scan-ingest/index.ts',import.meta.url),'utf8');
const expression=src.match(/const productionSmoke=(.+?);/)?.[1];

test('historical: only exact original two-field smoke fixture is synthetic, not customer scans',()=>{
 assert.ok(expression);
 const examples=[
  [{doel:'__PRODUCTION_SMOKE__',omvang:'verification-only'},true],
  [{doel:'__PRODUCTION_SMOKE__',omvang:'5-25 employees'},false],
  [{doel:'business growth',omvang:'verification-only'},false],
  [{doel:'business growth',omvang:'5-25 employees'},false],
  [{},false]
 ];
 for(const [scan,expected] of examples)
  assert.equal(vm.runInNewContext(expression,{scan}),expected);
});
test('shadow: same original runtime and commercial receipt visibly separates synthetic from conversions',()=>{
 assert.match(src,/learning_scope:productionSmoke\?'testing_only':'aggregate_only'/);
 assert.match(src,/data_quality:productionSmoke\?'SYNTHETIC':'OBSERVED'/);
 assert.match(src,/is_robot:productionSmoke/);
 assert.match(src,/synthetic_production_smoke:productionSmoke/);
 assert.match(src,/measurement_scope:productionSmoke\?'NOT_CUSTOMER_CONVERSION':'ANONYMOUS_SCAN'/);
 assert.match(src,/growthReceipt\?\.event_type!=='scan_completed'/);
 assert.match(src,/growthReceipt\?\.payload\?\.scan_id/);
 assert.match(src,/growth_event_readback_proven:true/);
});
test('canary: no new sender, external provider dispatch, schedule, PII or client identity mutation',()=>{
 assert.doesNotMatch(src,/new Worker\(|setInterval\(|cron\.schedule/);
 const match=src.match(/const productionSmoke=.*?;[\s\S]*?const eventRow=/);
 assert.ok(match);
 assert.doesNotMatch(match[0],/email|phone|password|session_id|payment/i);
 assert.match(src,/tenant_identity_status:'unverified'/);
});
