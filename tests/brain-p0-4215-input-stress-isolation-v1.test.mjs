import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalBusinessInputHandler} from '../platform/api/portal-business-input-handler.mjs';

const timestamp=i=>new Date(Date.UTC(2026,9,9,9,0,0)+i*1000).toISOString();
const fields=(n=200)=>Object.fromEntries(Array.from({length:n},(_,i)=>['field_'+String(i).padStart(3,'0'),i]));
const requestFor=body=>new Request('https://localhost.test/api/portal-business-input',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
});

function isolatedHarness({rejectCurrentStateOnce=false}={}){
  const records=new Map(), keys=new Map(), layers=new Map(), projectionWrites=new Map();
  let fail=rejectCurrentStateOnce;
  const authority={
    async append({record,idempotencyKey,sourceRevision}){
      if(fail&&record.type==='CurrentState'){fail=false;throw new Error('simulated recoverable Brain failure');}
      assert.ok(record.tenantId?.startsWith('customer-'));
      assert.ok(record.id);
      assert.ok(sourceRevision);
      const scope=record.tenantId+'|'+idempotencyKey;
      const recordKey=record.tenantId+'|'+record.id;
      if(keys.has(scope)){
        assert.equal(keys.get(scope),recordKey,'idempotency must never map to a different record');
        return {authority:'test-isolated-memory',record:records.get(recordKey),duplicate:true};
      }
      assert.ok(!records.has(recordKey),'new idempotency key cannot overwrite existing Brain record');
      keys.set(scope,recordKey);
      records.set(recordKey,structuredClone(record));
      return {authority:'test-isolated-memory',record};
    }
  };
  const store={
    async getLayer(tenantId){
      assert.ok(tenantId.startsWith('customer-'));
      return layers.get(tenantId)||null;
    },
    async putCanonical(tenantId,record){
      assert.equal(record.tenantId,tenantId,'projection must remain scoped to the authenticated tenant');
      layers.set(tenantId,structuredClone(record));
      projectionWrites.set(tenantId,(projectionWrites.get(tenantId)||0)+1);
      return {stored:true,stale:false,record};
    }
  };
  const handlerFor=(tenantId,userId)=>createPortalBusinessInputHandler({
    getUser:async()=>({id:userId,app_metadata:{tenantId}}),
    store,authority,now:()=>timestamp(0)
  });
  return {records,keys,layers,projectionWrites,handlerFor,store,authority};
}

test('200 customer fields across 1000 observations preserve tenant-scoped Brain and canonical receipts',async()=>{
  const h=isolatedHarness();
  const a=h.handlerFor('customer-A','actor-A'),b=h.handlerFor('customer-B','actor-B');
  const baselineFields=fields(200);
  const snapshots=new Map();
  for(let i=0;i<1000;i++){
    const tenant=i%2===0?'customer-A':'customer-B';
    const handler=i%2===0?a:b;
    const body={
      inputType:'PortalDomainStateSnapshot',modelId:'portal-v2-domain-state',
      sourcePortal:'portal-v2',instanceId:'primary',submittedAt:timestamp(i+1),
      metadata:{statePath:'portal.metrics'},
      answers:{portal:{metrics:{...baselineFields,observation:i===1?0:i}}},
      // Malicious client metadata must never change authenticated write scope.
      tenantId:tenant==='customer-A'?'customer-B':'customer-A',
      userId:'spoofed-owner'
    };
    const response=await handler(requestFor(body));
    const receipt=await response.json();
    assert.equal(response.status,200,'observation '+i+': '+JSON.stringify(receipt));
    assert.equal(receipt.stored,true);
    assert.equal(receipt.stale,false);
    assert.equal(receipt.authorityStored,true);
    assert.equal(receipt.powerhouseFeedStored,true);
    assert.equal(receipt.organismImpactStored,true);
    for(const name of ['sourceRevision','brainRecordId','currentStateRecordId','organismImpactRecordId'])assert.ok(receipt[name],name);
    if(i<2)snapshots.set(tenant,receipt);
  }
  assert.equal(h.projectionWrites.get('customer-A'),500);
  assert.equal(h.projectionWrites.get('customer-B'),500);
  assert.equal(h.layers.size,2);
  assert.equal(h.records.size,4000,'one RawSource, BusinessInput, CurrentState and ImpactAssessment per observation');
  assert.equal(h.keys.size,4000,'each idempotency key must be tenant-scoped');
  for(const tenant of ['customer-A','customer-B']){
    const tenantRecords=[...h.records.values()].filter(row=>row.tenantId===tenant);
    assert.equal(tenantRecords.length,2000);
    assert.equal(tenantRecords.filter(row=>row.type==='BusinessInput').length,500);
    assert.equal(tenantRecords.filter(row=>row.type==='CurrentState').length,500);
    assert.equal(tenantRecords.filter(row=>row.type==='ImpactAssessment').length,500);
    const layer=h.layers.get(tenant);
    assert.equal(layer.tenantId,tenant);
    assert.equal(layer.data.businessInputs.length,1);
    const item=layer.data.businessInputs[0];
    assert.equal(Object.keys(item.answers.portal.metrics).filter(key=>key.startsWith('field_')).length,200);
    assert.ok(item.metadata.sourceRevision);
    assert.ok(item.metadata.brainRecordId);
    assert.ok(item.metadata.currentStateRecordId);
    assert.ok(item.metadata.organismImpactRecordId);
    assert.ok(tenantRecords.every(row=>row.owner===('actor-'+tenant.slice(-1))),'no spoofed owner crosses the authority boundary');
  }
  // Identical model/answer content across tenants legitimately shares a hash,
  // but the authoritative (tenant_id, record_id) composite key isolates storage.
  assert.equal(snapshots.get('customer-A').sourceRevision,snapshots.get('customer-B').sourceRevision);
  assert.ok(h.records.has('customer-A|'+snapshots.get('customer-A').brainRecordId));
  assert.ok(h.records.has('customer-B|'+snapshots.get('customer-B').brainRecordId));
});

test('rejected >750 KB payload has zero Brain writes and no false success',async()=>{
  const h=isolatedHarness();
  const handler=h.handlerFor('customer-A','actor-A');
  const large={
    inputType:'PortalDomainStateSnapshot',modelId:'portal-v2-domain-state',
    answers:{portal:{metrics:{notes:'x'.repeat(750_100)}}}
  };
  const response=await handler(requestFor(large));
  assert.equal(response.status,413);
  assert.equal((await response.json()).error,'PAYLOAD_TOO_LARGE');
  assert.equal(h.records.size,0);
  assert.equal(h.layers.size,0);
  // This proves fail-closed capacity enforcement, NOT the as-yet missing
  // transactional split-batch/outbox handling of legitimate large payloads.
});

test('partial upstream append failure is retry-idempotent and never produces a premature projection',async()=>{
  const h=isolatedHarness({rejectCurrentStateOnce:true});
  const handler=h.handlerFor('customer-A','actor-A');
  const body={inputType:'StrategyCanvas',modelId:'strategy-dna',instanceId:'primary',sourcePortal:'portal-v2',submittedAt:timestamp(2),answers:{goal:'Keep evidence'}};
  const first=await handler(requestFor(body));
  assert.equal(first.status,502);
  assert.equal((await first.json()).error,'POWERHOUSE_FEED_WRITE_FAILED');
  assert.equal(h.records.size,2,'raw observation and BusinessInput committed before recoverable failure');
  assert.equal(h.layers.size,0,'no canonical projection without full upstream ACK');
  const second=await handler(requestFor(body));
  assert.equal(second.status,200);
  const receipt=await second.json();
  assert.equal(receipt.stored,true);
  assert.equal(h.records.size,4,'retry cannot duplicate committed Brain records');
  assert.equal(h.keys.size,4);
  assert.equal(h.layers.get('customer-A').data.businessInputs[0].metadata.sourceRevision,receipt.sourceRevision);
});

test('revoked and missing authenticated customer identity fail closed before any write',async()=>{
  const h=isolatedHarness();
  const handler=createPortalBusinessInputHandler({
    getUser:async()=>null,store:h.store,authority:h.authority
  });
  const response=await handler(requestFor({inputType:'StrategyCanvas',modelId:'strategy-dna',answers:{note:'forged'},tenantId:'customer-A'}));
  assert.equal(response.status,401);
  assert.equal((await response.json()).error,'UNAUTHORIZED');
  assert.equal(h.records.size,0);
  assert.equal(h.layers.size,0);
});
