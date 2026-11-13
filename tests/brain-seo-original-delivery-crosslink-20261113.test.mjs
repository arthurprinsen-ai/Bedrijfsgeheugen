import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOriginalSeoDeliveryLink,sameOriginalSeoDeliveryLink,SEO_ORIGINAL_DELIVERY_CRO_LINK}
  from '../supabase/functions/powerhouse-seo-opportunity-resolver/original-delivery-crosslink.mjs';

const SHA='937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb';
const RELEASE='66b67ac366e073ca068e5f1e23938a9792ae7dce';
const URL='https://www.bedrijfsgeheugen.nl/exact-online-koppeling';
function source(){return {
  id:'40b62d82-dcd3-4a44-98d0-3f94071008a9',
  obligation_type:'GROWTH_SOURCE_DAILY_HANDOFF',
  capability_id:'website-seo-dataforseo-ai-cro',
  business_entity:'bedrijfsgeheugen.nl:bedrijfsgeheugen',
  business_timezone:'Europe/Amsterdam',business_period:'2026-11-13',state:'OPEN',
  evidence:{tenant_id:'bedrijfsgeheugen',source_revision:SHA,
    producer_observed_at:'2026-11-13T12:46:00.028305+00:00',
    analysis:{source_revision:SHA,actual_cro_experiment_executed:false},
    consumer_ack:{accepted:true,consumed_revision:SHA,
      consumer:'original powerhouse-content-orchestrator-140'},
    source_manifest:[{source_key:'website_release_readback',quality:'VERIFIED_PRODUCTION_RELEASE',
      observed_at:'2026-11-13T07:26:14Z',
      metrics:{routes:[URL,'https://www.bedrijfsgeheugen.nl/twinfield-koppeling'],
      http_status:200,source_release_proven:true,published_commit_ref:RELEASE,
      deploy_id:'6af6bb27b1fccdc5adc91cd1'}}]}
};}
function recommendation(){return {
  dedupe_key:'seo-owner-update:2026-11-13:exact-online-koppeling',
  run_date:'2026-11-13',target_channel:'website',
  recommendation_type:'seo_money_page_update',status:'done',
  evidence:{contract:'SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1',
    action:'UPDATE_MONEY_PAGE',canonical_owner:URL,
    state:'WEBSITE_CHANGE_LIVE_PROVEN_METRICS_DUE',
    owner_change_merge_sha:RELEASE,
    owner_change_pr:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5700',
    public_page_http_status:200,public_canonical_readback:URL,
    public_frisse_blik_cta_readback:true,
    netlify_deploy_state:'READY',netlify_deploy_id:'6af6bc7fec4d7742badc7154',
    public_provider_request_id:'11130748-2222-0275-0000-8f3e3066b534'}
};}

test('original #175 source and exact #140 ACK match real original BG169 site deployment',()=>{
  const result=verifyOriginalSeoDeliveryLink(source(),recommendation());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.original_obligation_id,source().id);
  assert.equal(result.source_revision,SHA);
  assert.equal(result.original_ack_revision,SHA);
  assert.equal(result.owner_change_merge_sha,RELEASE);
  assert.equal(result.canonical_owner,URL);
  assert.equal(result.site_action_proven,true);
  assert.equal(result.stage,'SITE_ACTION_PROVEN_CRO_EXPERIMENT_AND_OUTCOME_DUE');
  assert.equal(result.cro_experiment_not_claimed,true);
  assert.equal(result.paid_order_not_claimed,true);
  assert.equal(result.no_second_scheduler_or_writer,true);
  assert.equal(SEO_ORIGINAL_DELIVERY_CRO_LINK,'SEO_ORIGINAL_DELIVERY_CRO_LINK_V1');
});

test('missing or changed source ACK, exact release, provider identity or canonical route fail closed',()=>{
  const mutate=(f,expected)=>{
    const s=source(),r=recommendation();f(s,r);
    const result=verifyOriginalSeoDeliveryLink(s,r);
    assert.equal(result.ok,false);
    assert.ok(result.issues.includes(expected),JSON.stringify(result));
  };
  mutate(s=>{s.evidence.consumer_ack.consumed_revision='old';},'ORIGINAL_SOURCE_ACK_REVISION_MISMATCH');
  mutate(s=>{s.evidence.consumer_ack.accepted=false;},'ORIGINAL_SOURCE_ACK_REVISION_MISMATCH');
  mutate(s=>{s.evidence.analysis.source_revision='other';},'ORIGINAL_SOURCE_ACK_REVISION_MISMATCH');
  mutate((s,r)=>{r.run_date='2026-11-12';},'ORIGINAL_SOURCE_DAY_MISMATCH');
  mutate((s,r)=>{r.evidence.owner_change_merge_sha='a'.repeat(40);},'ORIGINAL_SOURCE_RELEASE_ROUTE_SHA_NOT_MATCHED');
  mutate(s=>{s.evidence.source_manifest[0].metrics.routes=[];},'ORIGINAL_SOURCE_RELEASE_ROUTE_SHA_NOT_MATCHED');
  mutate((s,r)=>{r.evidence.public_provider_request_id='';},'INDEPENDENT_PAGE_AND_CTA_READBACK_MISSING');
  mutate((s,r)=>{r.evidence.public_frisse_blik_cta_readback=false;},'INDEPENDENT_PAGE_AND_CTA_READBACK_MISSING');
  mutate((s,r)=>{r.evidence.canonical_owner='https://other.example/exact-online-koppeling';},'CANONICAL_ROUTE_INVALID');
  mutate((s,r)=>{r.status='suggested';},'ORIGINAL_WEBSITE_ACTION_NOT_DONE');
  mutate((s,r)=>{r.evidence.state='NOT_EXECUTED';},'INDEPENDENT_PAGE_AND_CTA_READBACK_MISSING');
  mutate(s=>{s.evidence.source_manifest=[];},'ORIGINAL_SOURCE_RELEASE_ROUTE_SHA_NOT_MATCHED');
  const missing=verifyOriginalSeoDeliveryLink(undefined,recommendation());
  assert.equal(missing.ok,false);
  assert.ok(missing.issues.includes('ORIGINAL_SOURCE_IDENTITY_MISMATCH'));
});

test('same original source/revision/release/provider is idempotent, changed revision requires new exact receipt',()=>{
  const proof=verifyOriginalSeoDeliveryLink(source(),recommendation());
  assert.equal(sameOriginalSeoDeliveryLink(proof,{...proof}),true);
  assert.equal(sameOriginalSeoDeliveryLink(proof,{...proof,source_revision:'f'.repeat(64)}),false);
  assert.equal(sameOriginalSeoDeliveryLink(proof,{...proof,independent_page_provider_request_id:'new'}),false);
  assert.equal(sameOriginalSeoDeliveryLink(null,proof),false);
});

test('one existing resolver updates existing canonical recommendation with optimistic CAS/readback only',()=>{
  const code=readFileSync(new URL('../supabase/functions/powerhouse-seo-opportunity-resolver/index.ts',import.meta.url),'utf8');
  assert.match(code,/verifyOriginalSeoDeliveryLink\(original,rec\)/);
  assert.match(code,/sameOriginalSeoDeliveryLink\(prior,proof\)/);
  assert.match(code,/\.eq\('updated_at',rec\.updated_at\)/);
  assert.match(code,/SEO_ORIGINAL_DELIVERY_CAS_CONFLICT/);
  assert.match(code,/SEO_ORIGINAL_DELIVERY_READBACK_MISMATCH/);
  assert.match(code,/original_delivery_crosslink:deliveryCrosslink/);
  assert.doesNotMatch(code,/cron\.schedule|supabase\.functions\.deploy|github\.repos\.create|new Scheduler/i);
  assert.doesNotMatch(code,/original_delivery_crosslink.*outcome_proven\s*:\s*true/i);
});
