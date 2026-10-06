import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const migration=fs.readFileSync('supabase/migrations/20260920073025_social_publication_authority_v1.sql','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const operations=fs.readFileSync('supabase/functions/content-operations/index.ts','utf8');
const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const contentLoop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const recoveryRunner=fs.readFileSync('supabase/functions/social-recovery-runner/index.ts','utf8');

test('central authority issues exact-bound one-time capabilities',()=>{
  assert.match(migration,/expires_at/);
  assert.match(migration,/interval '5 minutes'/);
  assert.match(migration,/consumed_at is null/);
  assert.match(migration,/final_media_sha256/);
  assert.match(migration,/EXACT_FINAL_MIRA_MEDIA_PROOF_REQUIRED/);
});

test('publisher requires capability consumption before provider calls',()=>{
  const branchOrder=(branchMarker,providerMarker)=>{
    const branch=publisher.indexOf(branchMarker);
    const consume=publisher.indexOf('await consumePublishCapability',branch);
    const provider=publisher.indexOf(providerMarker,branch);
    assert.ok(branch>=0,branchMarker);
    assert.ok(consume>branch,'capability consumption must occur inside the channel branch');
    assert.ok(provider>consume,'provider side effect must occur after capability consumption');
  };
  branchOrder("if (row.channel === 'linkedin_personal')",'publishLinkedInPersonalViaComposio(db,art)');
  branchOrder("if (row.channel === 'linkedin_company')",'publishLinkedInCompanyViaComposio(db,art)');
  branchOrder("if (row.channel === 'instagram_company')",'publishInstagramViaComposio(db,art,runDate,instagramContext)');
  branchOrder("const input: Record<string,unknown>",'created = await createPost(bufferToken, input)');
  assert.doesNotMatch(publisher,/await publishInstagramViaMeta\(/);
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

test('social publication recovery retries at most every ten minutes',()=>{
  const delivery=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
  assert.match(delivery,/schedule:\s*'\*\/10 \* \* \* \*'/);
  assert.match(delivery,/triggerCanonicalContentLoop/);
  assert.match(delivery,/powerhouse-content-loop/);
  assert.match(delivery,/runSocialPublicationDelivery/);
});

test('production deploy recovery delegates to the same canonical publisher',()=>{
  const hook=fs.readFileSync('netlify/functions/social-publication-delivery-deploy.mjs','utf8');
  assert.match(hook,/runSocialPublicationDelivery/);
  assert.match(hook,/deploySucceeded/);
  assert.match(hook,/event\?\.deploy\?\.context\s*!==\s*'production'/);
  assert.doesNotMatch(hook,/LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH|createPost\(/);
});

test('social recovery remains bounded by the publication window and canonical single-writer route',()=>{
  const delivery=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
  assert.match(delivery,/local\.hour < 7 \|\| local\.hour > 20/);
  assert.match(delivery,/powerhouse-content-loop/);
  assert.match(delivery,/content loop owns generation, gates, provider dispatch and reconciliation/i);
  const loop=delivery.indexOf('await triggerCanonicalContentLoop(local.date)');
  const readback=delivery.indexOf("await powerhouse('delivery_context'",loop);
  const buffer=delivery.indexOf('posts = await getProviderPosts',readback);
  assert.ok(loop>=0 && readback>loop && buffer>readback,'recovery must run full content loop before fresh state and provider readback');
});

test('manual recovery is same-day, auditable and delegates through the canonical recovery runner',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/push:/);
  assert.match(workflow,/docs\/development-ledger-events\/2026-10-06-social-publication-manual-recovery-control-plane-v1\.md/);
  assert.match(workflow,/Europe\/Amsterdam/);
  assert.match(workflow,/SAME_DAY_RECOVERY_ONLY/);
  assert.match(workflow,/functions\/v1\/social-recovery-runner/);
  assert.match(workflow,/Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow,/\/rest\/v1\//);
  assert.doesNotMatch(workflow,/rpc\/bg_geheim/);
  assert.doesNotMatch(workflow,/api\.buffer\.com|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
});

test('critical social recovery database transport is Supavisor-only',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  const critical=[
    ['content-operations',operations],
    ['powerhouse-social-publisher',publisher],
    ['powerhouse-content-orchestrator',orchestrator],
    ['powerhouse-content-loop',contentLoop],
    ['social-recovery-runner',recoveryRunner],
  ];
  for(const [name,source] of critical){
    assert.match(source,/npm:postgres@3\.4\.7/,name+' must use the pinned direct postgres client');
    assert.match(source,/SUPABASE_DB_URL/,name+' must source DB credentials from the managed runtime secret');
    assert.match(source,/aws-0-eu-central-1\.pooler\.supabase\.com/,name+' must use the EU Supavisor endpoint');
    assert.match(source,/6543/,name+' must use Supavisor transaction-pooler port');
    assert.doesNotMatch(source,/\/rest\/v1\//,name+' must not depend on PostgREST for the critical recovery path');
  }
  assert.doesNotMatch(workflow,/\/rest\/v1\//,'recovery workflow must not depend on PostgREST');
});

test('recovery runner keeps authority private and uses only canonical loop/publisher authorities',()=>{
  assert.match(recoveryRunner,/SERVICE_ROLE_REQUIRED/);
  assert.match(recoveryRunner,/powerhouse_daily_scheduler_token/);
  assert.match(recoveryRunner,/select public\.bg_geheim/);
  assert.match(recoveryRunner,/powerhouse-content-loop/);
  assert.match(recoveryRunner,/powerhouse-social-publisher/);
  assert.match(recoveryRunner,/mode: "publish_only"/);
  assert.match(recoveryRunner,/channels: \[channel\]/);
  assert.match(recoveryRunner,/readCanonicalState/);
  assert.match(recoveryRunner,/CANONICAL_CONTENT_ALREADY_READY_OR_TERMINAL/);
  assert.match(recoveryRunner,/SAME_DAY_RECOVERY_ONLY/);
  assert.doesNotMatch(recoveryRunner,/DB_RECOVERY_INSPECT_TOKEN/);
  assert.doesNotMatch(recoveryRunner,/createClient\(/);
});

test('manual recovery persists visible evidence and never reintroduces PostgREST',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(workflow,/mkdir -p recovery-artifacts/);
  assert.match(workflow,/path: recovery-artifacts/);
  assert.doesNotMatch(workflow,/path: \.artifacts/);
  assert.doesNotMatch(workflow,/\/rest\/v1\//);
});

test('canonical content loop remains bounded and lease protected',()=>{
  assert.match(contentLoop,/LOOP_LEASE_MS/);
  assert.match(contentLoop,/claimLoopLease/);
  assert.match(contentLoop,/releaseLoopLease/);
  assert.match(contentLoop,/CHILD_TIMEOUTS/);
  assert.match(contentLoop,/AbortSignal\.timeout/);
  assert.match(contentLoop,/ALREADY_RUNNING/);
  assert.match(contentLoop,/LEGACY_TELEMETRY_OUTSIDE_CRITICAL_PATH/);
});

test('content loop lease SQL explicitly types reused placeholders',()=>{
  assert.ok(contentLoop.includes("'holder',$5::text"));
  assert.ok(contentLoop.includes("'run_date',$3::text"));
  assert.ok(contentLoop.includes("'expires_at',$6::timestamptz"));
  assert.ok(contentLoop.includes("payload->>'holder' = $5::text"));
  assert.ok(contentLoop.includes("payload->>'holder'=$2::text"));
});

test('social recovery functions use the EU function region',()=>{
  const delivery=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
  const deployHook=fs.readFileSync('netlify/functions/social-publication-delivery-deploy.mjs','utf8');
  assert.match(delivery,/region:\s*'fra'/);
  assert.match(deployHook,/region:\s*'fra'/);
});


test('social recovery runner quality surface is canonically registered',()=>{
  const registry=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));
  const surface=registry.surfaces.find((item)=>item.id==='function:social-recovery-runner');
  assert.ok(surface,'social recovery runner must be registered');
  assert.equal(surface.authority,'supabase/functions/social-recovery-runner/index.ts');
  assert.equal(surface.evidence_contract,'tests/brain-central-social-publication-authority-v1.test.mjs');
  assert.equal(surface.required,true);
});

test('content operations shares the canonical scheduler authority with social publication',()=>{
  const operations=fs.readFileSync('supabase/functions/content-operations/index.ts','utf8');
  assert.match(operations,/rpc\/bg_geheim/);
  assert.match(operations,/powerhouse_daily_scheduler_token/);
  assert.match(operations,/async function schedulerToken/);
  assert.match(operations,/await schedulerToken\(\)/);
  assert.match(operations,/if \(!\(await authorized\(req\)\)\)/);
});



test('bounded publish_only isolates one channel and compacts recursive evidence',()=>{
  assert.match(publisher,/const requestedChannels = Array\.isArray\(body\.channels\)/);
  assert.match(publisher,/const channels = requestedChannels\.length \? requestedChannels : allChannels/);
  assert.match(publisher,/\.in\('channel', channels\)/);
  assert.match(publisher,/this\.table==='powerhouse_channel_decisions'&&column==='delivery_evidence'/);
  assert.match(publisher,/this\.table==='powerhouse_content_artifacts'&&column==='generation_evidence'/);
  assert.match(publisher,/this\.table==='content_publication_obligations'&&column==='evidence'/);
  assert.match(publisher,/jsonb_strip_nulls\(jsonb_build_object/);
  assert.match(publisher,/publishOnly \? \{active:false,retry_at:null,retry_after_seconds:0\} : await readBufferCircuit/);
});

test('recovery workflow stores evidence in a visible artifact directory',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(workflow,/mkdir -p recovery-artifacts/);
  assert.match(workflow,/path: recovery-artifacts/);
  assert.doesNotMatch(workflow,/path: \.artifacts/);
});


test('recovery runner skips heavyweight preparation for content-ready canonical claims',()=>{
  assert.match(recoveryRunner,/readCanonicalState/);
  assert.match(recoveryRunner,/preparationNeeded/);
  assert.match(recoveryRunner,/content_ready/);
  assert.match(recoveryRunner,/mode: "publish_only"/);
  assert.match(recoveryRunner,/channels: \[channel\]/);
  assert.match(recoveryRunner,/CANONICAL_READBACK_UNAVAILABLE/);
});
