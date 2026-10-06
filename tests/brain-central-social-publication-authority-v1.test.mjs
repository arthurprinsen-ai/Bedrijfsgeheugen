import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const migration=fs.readFileSync('supabase/migrations/20260920073025_social_publication_authority_v1.sql','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
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

test('manual recovery is same-day, auditable and delegates to the canonical recovery runner',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/push:/);
  assert.match(workflow,/docs\/development-ledger-events\/2026-10-06-social-publication-manual-recovery-control-plane-v1\.md/);
  assert.match(workflow,/Europe\/Amsterdam/);
  assert.match(workflow,/SAME_DAY_RECOVERY_ONLY/);
  assert.match(workflow,/functions\/v1\/social-recovery-runner/);
  assert.match(workflow,/Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(workflow,/CANONICAL_SOCIAL_RECOVERY_RESULT/);
  assert.match(workflow,/SOCIAL_PUBLICATION_UNRESOLVED/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow,/\/rest\/v1\/|rpc\/bg_geheim|api\.buffer\.com|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
});

test('recovery runner owns degraded preparation, bounded publication and direct readback',()=>{
  const workflow=fs.readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
  assert.match(recoveryRunner,/aws-0-eu-central-1\.pooler\.supabase\.com/);
  assert.match(recoveryRunner,/readCanonicalState/);
  assert.match(recoveryRunner,/preparationNeeded/);
  assert.match(recoveryRunner,/CANONICAL_CONTENT_ALREADY_READY_OR_TERMINAL/);
  assert.match(recoveryRunner,/powerhouse-content-loop/);
  assert.match(recoveryRunner,/60_000/);
  assert.match(recoveryRunner,/SOCIAL_RECOVERY_PREPARATION_DEGRADED/);
  assert.match(recoveryRunner,/powerhouse-social-publisher/);
  assert.match(recoveryRunner,/mode: "publish_only"/);
  assert.match(recoveryRunner,/channels: \[channel\]/);
  assert.match(recoveryRunner,/40_000/);
  assert.match(workflow,/mkdir -p recovery-artifacts/);
  assert.match(workflow,/path: recovery-artifacts/);
  assert.doesNotMatch(workflow,/path: \.artifacts/);
});

test('manual recovery bounds provider publication by channel under the edge runtime budget',()=>{
  assert.match(publisher,/const publishOnly = mode === 'publish_only'/);
  assert.match(publisher,/requestedChannels/);
  assert.match(publisher,/let provider_reconciliation:any\[\] = \[\]/);
  assert.match(publisher,/containment_sweep:any = publishOnly \? \{ skipped:true, reason:'PUBLISH_ONLY' \}/);
  assert.match(publisher,/if \(!publishOnly\)/);
  assert.match(recoveryRunner,/mode: "publish_only"/);
  assert.match(recoveryRunner,/channels: \[channel\]/);
  assert.match(recoveryRunner,/40_000/);
});



test('social recovery functions use the EU function region',()=>{
  const delivery=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
  const deployHook=fs.readFileSync('netlify/functions/social-publication-delivery-deploy.mjs','utf8');
  assert.match(delivery,/region:\s*'fra'/);
  assert.match(deployHook,/region:\s*'fra'/);
});


test('content operations shares the canonical scheduler authority with social publication',()=>{
  const operations=fs.readFileSync('supabase/functions/content-operations/index.ts','utf8');
  assert.match(operations,/rpc\/bg_geheim/);
  assert.match(operations,/powerhouse_daily_scheduler_token/);
  assert.match(operations,/async function schedulerToken/);
  assert.match(operations,/await schedulerToken\(\)/);
  assert.match(operations,/if \(!\(await authorized\(req\)\)\)/);
});


test('LinkedIn auth and company-admin configuration boundaries remain resumable before provider side effects',()=>{
  assert.match(publisher,/isLinkedInAuthPreflightError/);
  assert.match(publisher,/CANONICAL_CONNECTION_NOT_PINNED/);
  assert.match(publisher,/PINNED_CONNECTION_NOT_ACTIVE/);
  assert.match(publisher,/HUMAN_BOUNDARY_R_ORGANIZATION_ADMIN_REQUIRED/);
  assert.match(publisher,/COMPANY_REAUTH_REQUIRED/);
  assert.match(publisher,/status:'waiting_reauth'/);
  assert.match(publisher,/possible_provider_side_effect:false/);
  assert.match(publisher,/state:'content_ready'/);
});
