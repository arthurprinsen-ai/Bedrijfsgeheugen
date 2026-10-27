import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedPersonalPost,verifiedPersonalPostBatch,PERSONAL_SOCIAL_TENANT} from '../supabase/functions/_shared/verified-personal-publication-registry.mjs';

const now=new Date('2026-10-27T15:00:00Z');
const ack={provider_publication_ack_verified:true};
const row={tenant_id:'canonical',channel:'linkedin_personal',status:'PUBLISHED',publication_date:'2026-10-27',
  external_id:'urn:li:share:7520742164285280257',published_at:'2026-10-27T07:04:22Z',live_proven_at:null,evidence:ack};

test('provider-acknowledged personal post maps to the canonical learning tenant with NO outcomes',()=>{
  const p=verifiedPersonalPost(row,now);
  assert.equal(p.tenant_id,PERSONAL_SOCIAL_TENANT);
  assert.equal(p.tenant_id,'canonical');
  assert.equal(p.platform,'linkedin');
  assert.equal(p.post_id,'linkedin-personal:7520742164285280257');
  assert.ok(p.post_id.startsWith('linkedin-personal'),'must match the reader ilike linkedin-personal%');
  assert.equal(p.channel_kind,'linkedin_personal');
  assert.equal(p.learning_status,'pending_measurement');
  for(const k of ['metrics','views','impressions','reach','revenue'])assert.equal(Object.hasOwn(p,k),false);
});

test('a bare URN without the recorded provider acknowledgement is never registered',()=>{
  assert.equal(verifiedPersonalPost({...row,evidence:{}},now),null);
  assert.equal(verifiedPersonalPost({...row,evidence:{provider_publication_ack_verified:false}},now),null);
  assert.equal(verifiedPersonalPost({...row,evidence:null},now),null);
});

test('only PUBLISHED or LIVE_PROVEN personal rows qualify; other channels and statuses never do',()=>{
  for(const status of ['PLANNED','GENERATED','BLOCKED','FAILED','DISPATCHED'])assert.equal(verifiedPersonalPost({...row,status},now),null);
  assert.equal(verifiedPersonalPost({...row,channel:'linkedin_company'},now),null);
  assert.equal(verifiedPersonalPost({...row,channel:'instagram'},now),null);
  const lp={...row,status:'LIVE_PROVEN',evidence:{},live_proven_at:'2026-10-27T07:05:00Z'};
  assert.ok(verifiedPersonalPost(lp,now));
  assert.equal(verifiedPersonalPost({...lp,live_proven_at:null},now),null);
});

test('forged, cross-tenant, malformed, future or stale proof is rejected',()=>{
  assert.equal(verifiedPersonalPost({...row,tenant_id:'another-company'},now),null);
  assert.equal(verifiedPersonalPost({...row,external_id:'https://untrusted.test'},now),null);
  assert.equal(verifiedPersonalPost({...row,external_id:'urn:li:share:12'},now),null);
  assert.equal(verifiedPersonalPost({...row,published_at:'2026-10-28T07:04:22Z'},now),null);
  assert.equal(verifiedPersonalPost({...row,published_at:'2026-07-01T07:04:22Z'},now),null);
  assert.equal(verifiedPersonalPost({...row,publication_date:'nonsense'},now),null);
  assert.equal(verifiedPersonalPost(null,now),null);
});

test('batch deduplicates by URN, is capped and sorted deterministically',()=>{
  const older={...row,publication_date:'2026-10-25',external_id:'urn:li:share:7520059104178925568',published_at:'2026-10-25T09:50:08Z'};
  const b=verifiedPersonalPostBatch([row,row,older],now,2);
  assert.equal(b.length,2);
  assert.ok(b[0].published_at<b[1].published_at);
  assert.equal(verifiedPersonalPostBatch([row,row],now,30).length,1);
  assert.throws(()=>verifiedPersonalPostBatch('x'),TypeError);
});

test('sync function wires the personal registry idempotently and reports it, without publishing',()=>{
  const src=readFileSync(new URL('../supabase/functions/bg-social-metrics-sync/index.ts',import.meta.url),'utf8');
  assert.match(src,/verifiedPersonalPostBatch/);
  assert.match(src,/registerPersonalProofs\(db\)/);
  assert.match(src,/ignoreDuplicates:true/);
  assert.match(src,/personal_post_registry:personalRegistry/);
  const fn=src.slice(src.indexOf('async function registerPersonalProofs'),src.indexOf('async function reconcileCompanyMetricEvidence'));
  assert.doesNotMatch(fn,/createPost|fetch\(|social-publisher|functions\/v1/);
  assert.match(fn,/eq\('channel','linkedin_personal'\)/);
  // The DB identity gate may refuse one day; that refusal is kept, reported, and never blocks other days.
  assert.match(fn,/for\(const post of batch\)/);
  assert.match(fn,/upsert\(\[post\]/);
  assert.match(fn,/guard_rejected/);
  assert.doesNotMatch(fn,/upsert\(batch/);
});
