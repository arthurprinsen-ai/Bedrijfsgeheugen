import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const migration=fs.readFileSync('supabase/migrations/20260920072000_social_publication_authority_v1.sql','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('central authority issues exact-bound one-time capabilities',()=>{
  assert.match(migration,/expires_at/);
  assert.match(migration,/interval '5 minutes'/);
  assert.match(migration,/consumed_at is null/);
  assert.match(migration,/final_media_sha256/);
  assert.match(migration,/EXACT_FINAL_MIRA_MEDIA_PROOF_REQUIRED/);
});

test('publisher requires capability consumption before provider calls',()=>{
  const consume=publisher.indexOf('await consumePublishCapability');
  const composio=publisher.lastIndexOf('publishInstagramViaComposio(db, art, runDate)');
  const buffer=publisher.indexOf('created = await createPost(bufferToken, input)');
  assert.ok(consume>0);
  assert.ok(composio>consume);
  assert.ok(buffer>consume);
  assert.match(publisher,/containmentSweepInstagram/);
  assert.match(publisher,/PENDING_PROVIDER_CANCELLATION/);
});

test('only canonical publisher contains direct provider side-effect primitives',()=>{
  const roots=['supabase/functions','netlify/functions','platform','scripts'];
  const allowed=new Set(['supabase/functions/powerhouse-social-publisher/index.ts']);
  const forbidden=['INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH','mutation CreatePost','createPost(input'];
  const offenders=[];
  const walk=(dir)=>{
    for(const name of fs.readdirSync(dir)){
      const p=path.join(dir,name),st=fs.statSync(p);
      if(st.isDirectory())walk(p); else if(/\.(?:mjs|js|ts)$/.test(p)){
        const norm=p.replaceAll('\\','/');
        if(allowed.has(norm))continue;
        const text=fs.readFileSync(p,'utf8');
        if(forbidden.some(x=>text.includes(x)))offenders.push(norm);
      }
    }
  };
  for(const root of roots)if(fs.existsSync(root))walk(root);
  assert.deepEqual(offenders,[]);
});

test('completion supervisor requires channel policy authorization evidence',()=>{
  const evidence=[
    ['CANDIDATE_TESTS','BRAIN_DELIVERY'],['PROTECTED_DELIVERY','BG169'],['PRODUCTION_IDENTITY','BG169'],
    ['FUNCTIONAL_READBACK','PRODUCTION_READBACK'],['OBLIGATIONS_COMPLETE','OUTCOME_OBLIGATION_RUNTIME'],
    ['CAPABILITY_HANDOFF','BG167'],['LEARNING_WRITEBACK','BG168_BG166']
  ].map(([type,producer])=>({type,producer,accepted:true,independent:true,taskIdentity:'social-publication:x',candidateIdentity:'c',productionIdentity:type==='CANDIDATE_TESTS'?'':'p'}));
  const result=evaluateCompletion({obligationId:'social-publication:x',workId:'w',candidateIdentity:'c',productionIdentity:'p',channelPolicyRequired:true,materialObligations:[],evidence});
  assert.equal(result.success,false);
  assert.ok(result.required_evidence.includes('CHANNEL_POLICY_AUTHORIZATION'));
});
