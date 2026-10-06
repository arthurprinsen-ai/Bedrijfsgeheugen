import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const migration=fs.readFileSync('supabase/migrations/20260920073025_social_publication_authority_v1.sql','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const operations=fs.readFileSync('supabase/functions/content-operations/index.ts','utf8');
const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const contentLoop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const recoveryRunner=fs.readFileSync('supabase/functions/social-recovery-runner/index.ts','utf8');

test('central publication authority keeps exact-bound one-time capabilities',()=>{
  assert.match(migration,/expires_at/);
  assert.match(migration,/interval '5 minutes'/);
  assert.match(migration,/consumed_at is null/);
  assert.match(migration,/final_media_sha256/);
});

test('completion supervisor still requires channel policy authorization evidence',()=>{
  const evidence=[
    ['CANDIDATE_TESTS','BRAIN_DELIVERY'],['PROTECTED_DELIVERY','BG169'],['PRODUCTION_IDENTITY','BG169'],
    ['FUNCTIONAL_READBACK','PRODUCTION_READBACK'],['OBLIGATIONS_COMPLETE','OUTCOME_OBLIGATION_RUNTIME'],
    ['CAPABILITY_HANDOFF','BG167'],['LEARNING_WRITEBACK','BG168_BG166']
  ].map(([type,producer])=>({type,producer,accepted:true,independent:true,taskIdentity:'social-publication:x',candidateIdentity:'c',productionIdentity:type==='CANDIDATE_TESTS'?'':'p'}));
  const result=evaluateCompletion({obligationId:'social-publication:x',workId:'w',candidateIdentity:'c',productionIdentity:'p',channelPolicyRequired:true,materialObligations:[],evidence});
  assert.equal(result.success,false);
  assert.ok(result.required_evidence.includes('CHANNEL_POLICY_AUTHORIZATION'));
});

test('scheduled recovery remains bounded and EU-local',()=>{
  const delivery=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
  const deployHook=fs.readFileSync('netlify/functions/social-publication-delivery-deploy.mjs','utf8');
  assert.match(delivery,/schedule:\s*'\*\/10 \* \* \* \*'/);
  assert.match(delivery,/local\.hour < 7 \|\| local\.hour > 20/);
  assert.match(delivery,/powerhouse-content-loop/);
  assert.match(delivery,/region:\s*'fra'/);
  assert.match(deployHook,/region:\s*'fra'/);
});

test('manual recovery delegates to one source-controlled runner without Data API access',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/Europe\/Amsterdam/);
  assert.match(workflow,/SAME_DAY_RECOVERY_ONLY/);
  assert.match(workflow,/functions\/v1\/social-recovery-runner/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/recovery-artifacts/);
  assert.doesNotMatch(workflow,/\/rest\/v1\//);
});

test('recovery runner uses Supavisor for scheduler authority and canonical readback',()=>{
  assert.match(recoveryRunner,/npm:postgres@3\.4\.7/);
  assert.match(recoveryRunner,/SUPABASE_DB_URL/);
  assert.match(recoveryRunner,/aws-0-eu-central-1\.pooler\.supabase\.com/);
  assert.match(recoveryRunner,/6543/);
  assert.match(recoveryRunner,/SERVICE_ROLE_REQUIRED/);
  assert.match(recoveryRunner,/powerhouse_daily_scheduler_token/);
  assert.match(recoveryRunner,/select public\.bg_geheim/);
  assert.match(recoveryRunner,/directReadback/);
  assert.match(recoveryRunner,/powerhouse-content-loop/);
  assert.match(recoveryRunner,/powerhouse-social-publisher/);
  assert.match(recoveryRunner,/mode: "publish_only"/);
  assert.match(recoveryRunner,/degraded_preparation/);
  assert.match(recoveryRunner,/SAME_DAY_RECOVERY_ONLY/);
  assert.doesNotMatch(recoveryRunner,/\/rest\/v1\//);
  assert.doesNotMatch(recoveryRunner,/createClient\(/);
});

test('critical recovery control-plane database access is Supavisor-backed',()=>{
  for(const [name,source] of [
    ['content-operations',operations],
    ['powerhouse-content-orchestrator',orchestrator],
    ['powerhouse-content-loop',contentLoop],
    ['social-recovery-runner',recoveryRunner],
  ]){
    assert.match(source,/npm:postgres@3\.4\.7/,name);
    assert.match(source,/SUPABASE_DB_URL/,name);
    assert.match(source,/aws-0-eu-central-1\.pooler\.supabase\.com/,name);
    assert.match(source,/6543/,name);
    assert.doesNotMatch(source,/\/rest\/v1\//,name);
  }
});

test('content operations resolves the canonical scheduler authority before request execution',()=>{
  assert.match(operations,/powerhouse_daily_scheduler_token/);
  assert.match(operations,/async function schedulerToken/);
  assert.match(operations,/await schedulerToken\(\)/);
  assert.match(operations,/if \(!\(await authorized\(req\)\)\)/);
});

test('canonical content loop remains bounded and lease protected',()=>{
  assert.match(contentLoop,/LOOP_LEASE_MS/);
  assert.match(contentLoop,/claimLoopLease/);
  assert.match(contentLoop,/releaseLoopLease/);
  assert.match(contentLoop,/CHILD_TIMEOUTS/);
  assert.match(contentLoop,/AbortSignal\.timeout/);
  assert.match(contentLoop,/ALREADY_RUNNING/);
});

test('provider writer keeps bounded publish-only channel isolation',()=>{
  assert.match(publisher,/const publishOnly = mode === 'publish_only'/);
  assert.match(publisher,/requestedChannels/);
  assert.match(publisher,/if \(!publishOnly\)/);
});

test('social recovery runner is registered in the canonical quality surface registry',()=>{
  const registry=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));
  const surface=registry.surfaces.find((item)=>item.id==='function:social-recovery-runner');
  assert.ok(surface);
  assert.equal(surface.authority,'supabase/functions/social-recovery-runner/index.ts');
  assert.equal(surface.evidence_contract,'tests/brain-central-social-publication-authority-v1.test.mjs');
  assert.equal(surface.required,true);
});
