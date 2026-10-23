import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {evaluateCustomerProductionAcceptance,REQUIRED_EVENTS} from '../tools/portal/customer-production-acceptance.mjs';

const NOW=Date.parse('2026-10-23T14:00:10Z');
const TS='2026-10-23T14:00:00Z';
const SHA='a'.repeat(40);
const keys=generateKeyPairSync('ed25519');
const pem=keys.publicKey.export({type:'spki',format:'pem'});
const canonical=v=>JSON.stringify(sort(v));
const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
const step=(tenant,kind)=>({
  tenantRef:tenant,receiptId:tenant+'-'+kind+'-receipt',observedAt:TS,
  observedBy:'INDEPENDENT_PRODUCTION_VERIFIER',releaseSha:SHA,status:'PROVEN'
});
function journey(index){
  const tenantRef='t-'+String(index).repeat(16);
  const principalRef='u-'+String(index).repeat(16);
  const events=Object.fromEntries(REQUIRED_EVENTS.map(kind=>[kind,step(tenantRef,kind)]));
  events.goal_saved.revision=3;
  events.brain_ack.revision=3;
  events.impact_readback.revision=3;
  events.action_executed.goalReceiptId=events.goal_saved.receiptId;
  events.result_measured.actionReceiptId=events.action_executed.receiptId;
  events.result_measured.independentSourceReceiptId=tenantRef+'-finance-evidence';
  events.result_measured.actual={value:0,unit:'EUR'};
  events.learning_writeback.outcomeReceiptId=events.result_measured.receiptId;
  events.learning_writeback.nextDecisionId=tenantRef+'-decision-next';
  events.forecast_readback.validation='INDEPENDENTLY_VALIDATED';
  return {tenantRef,principalRef,realCustomer:true,authenticated:true,synthetic:false,
    checks:{guestDenied:true,demoSeparated:true,crossTenantDenied:true,
      crossTenantHttpStatus:403,reloginPersisted:true,accessibilityPass:true,
      registeredPages:20,testedPages:20},
    events};
}
function payload(){
  const release={mainSha:SHA,deployedSha:SHA,deployState:'ready',deployId:'deploy-verified-001'};
  for(const check of ['required','codeql','portalReadback','authenticatedApi'])
    release[check]={sha:SHA,status:'success',receiptId:check+'-verified-001'};
  return {contract:'PORTAL_CUSTOMER_PRODUCTION_ACCEPTANCE_V1',observedAt:TS,release,
    journeys:[journey(1),journey(2)]};
}
function evaluate(body=payload(),options={}){
  const packet={payload:body,signature:sign(null,Buffer.from(canonical(body)),keys.privateKey).toString('base64')};
  return evaluateCustomerProductionAcceptance(packet,{
    expectedSha:SHA,verifierPublicKey:pem,now:NOW,...options
  });
}

test('signed contract is review-eligible but NEVER automatically production accepted',()=>{
  const r=evaluate();
  assert.deepEqual(r.errors,[]);
  assert.equal(r.status,'SIGNED_EVIDENCE_CONTRACT_VALID');
  assert.equal(r.eligibleForIndependentReview,true);
  assert.equal(r.productionAccepted,false);
  assert.equal(r.checkedTenants,2);
  assert.equal(r.validatedEventTypes,9);
});
test('missing signing authority and falsified signature fail closed',()=>{
  const p=payload();
  const unsigned=evaluateCustomerProductionAcceptance({payload:p,signature:'bogus'},
    {expectedSha:SHA,verifierPublicKey:pem,now:NOW});
  assert.ok(unsigned.errors.includes('INDEPENDENT_SIGNATURE_INVALID'));
  assert.ok(evaluate(p,{verifierPublicKey:''}).errors.includes('INDEPENDENT_VERIFIER_PUBLIC_KEY_MISSING_OR_INVALID'));
});
test('cannot substitute one tenant or a synthetic account',()=>{
  for(const mutate of [
    p=>p.journeys.pop(),
    p=>{p.journeys[1].tenantRef=p.journeys[0].tenantRef;},
    p=>{p.journeys[0].synthetic=true;}
  ]){
    const p=payload();mutate(p);
    assert.equal(evaluate(p).eligibleForIndependentReview,false);
  }
});
test('guest, cross-tenant, page coverage and relogin must be independently proven',()=>{
  for(const mutate of [
    p=>{p.journeys[0].checks.guestDenied=false;},
    p=>{p.journeys[0].checks.crossTenantHttpStatus=200;},
    p=>{p.journeys[1].checks.testedPages=19;},
    p=>{p.journeys[0].checks.reloginPersisted=false;}
  ]){const p=payload();mutate(p);assert.ok(evaluate(p).errors.includes('PORTAL_FUNCTION_OR_ISOLATION_UNPROVEN'));}
});
test('replayed receipts, mismatched revision and incomplete learning links are rejected',()=>{
  const variants=[
    [p=>{p.journeys[1].events.brain_ack.receiptId=p.journeys[0].events.brain_ack.receiptId;},'REPLAYED_EVIDENCE_RECEIPT'],
    [p=>{p.journeys[0].events.impact_readback.revision=4;},'WRITE_BRAIN_IMPACT_LINEAGE_BROKEN'],
    [p=>{p.journeys[0].events.learning_writeback.outcomeReceiptId='unrelated-001';},'ACTION_OUTCOME_LEARNING_LOOP_BROKEN']
  ];
  for(const [change,code] of variants){const p=payload();change(p);assert.ok(evaluate(p).errors.includes(code),code);}
});
test('missing measured results and unvalidated forecasts cannot be called success',()=>{
  const p=payload();p.journeys[0].events.result_measured.actual.value=null;
  p.journeys[1].events.forecast_readback.validation='MODEL_ONLY';
  const r=evaluate(p);
  assert.ok(r.errors.includes('MEASURED_OUTCOME_MISSING'));
  assert.ok(r.errors.includes('FORECAST_NOT_INDEPENDENTLY_VALIDATED'));
  assert.equal(r.productionAccepted,false);
});
test('exact release SHA, CodeQL and freshness are immutable admission boundaries',()=>{
  const p=payload();p.release.deployedSha='b'.repeat(40);
  p.release.codeql.status='pending';p.observedAt='2026-01-01T00:00:00Z';
  const r=evaluate(p);
  for(const code of ['EXACT_DEPLOY_NOT_PROVEN','RELEASE_CHECK_MISSING_CODEQL','PROOF_STALE_OR_FUTURE_DATED'])
    assert.ok(r.errors.includes(code),code);
});
test('signed evidence containing secrets or customer PII is not admitted',()=>{
  const p=payload();p.journeys[0].access_token='do-not-ever-include';
  assert.ok(evaluate(p).errors.includes('SECRET_OR_PERSONAL_DATA_IN_EVIDENCE'));
});
