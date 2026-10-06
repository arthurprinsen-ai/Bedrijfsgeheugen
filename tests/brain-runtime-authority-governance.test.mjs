import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateRuntimeAuthority} from '../brain/operating-loop/runtime-authority-governance.mjs';

const registryPath='config/powerhouse-runtime-authority.json';
const registry=JSON.parse(await readFile(registryPath,'utf8'));

const active=registry.components.filter(x=>x.authority==='ACTIVE');
const retired=registry.components.filter(x=>x.classification==='LEGACY_RETIRED_PATH');

function ownersFor(obligation){
  return active.filter(x=>(x.obligations||[]).includes(obligation));
}

test('retired executors can never be active authority',()=>{
  assert.ok(retired.length>0,'expected explicit retired provenance entries');
  assert.ok(retired.every(x=>x.authority==='NONE'));
  assert.ok(retired.every(x=>x.production_execution_allowed===false));
});

test('every material obligation has exactly one active owner',()=>{
  for(const obligation of registry.material_obligations){
    const owners=ownersFor(obligation);
    assert.equal(owners.length,1,`${obligation} must have exactly one active owner, found ${owners.map(x=>x.id).join(', ')||'none'}`);
  }
});

test('seven-channel daily contract is fully mapped',()=>{
  const expected=['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
  assert.deepEqual([...registry.channels.map(x=>x.channel)].sort(),[...expected].sort());
  for(const channel of registry.channels){
    assert.ok(channel.owner_component_id,`${channel.channel} missing owner_component_id`);
    assert.ok(channel.delivery_runtime,`${channel.channel} missing delivery_runtime`);
    assert.ok(channel.evidence_policy,`${channel.channel} missing evidence_policy`);
  }
});

test('Make is provenance only and cannot silently resume',()=>{
  const makeEntries=registry.components.filter(x=>x.runtime==='make');
  assert.ok(makeEntries.length>0,'Make provenance must remain inventoried');
  assert.ok(makeEntries.every(x=>x.authority==='NONE'));
  assert.ok(makeEntries.every(x=>x.resume_policy==='EXPLICIT_REENABLE_THROUGH_CURRENT_GATES_ONLY'));
});

test('runtime drift and interrupted-run recovery are mandatory controls',()=>{
  assert.equal(registry.controls.single_owner_gate,'FAIL_CLOSED');
  assert.equal(registry.controls.runtime_drift_detector,'ENABLED');
  assert.equal(registry.controls.interrupted_run_recovery,'EXISTING_BRAIN_OBLIGATION_RUNTIME');
  assert.equal(registry.controls.writeback_route,'public.brain_append_record');
});

test('runtime evaluator fails closed on duplicate ownership',()=>{
  const broken=structuredClone(registry);
  broken.components.push({
    id:'rogue-duplicate-owner',runtime:'github',classification:'ACTIVE',authority:'ACTIVE',production_execution_allowed:true,
    obligations:[registry.material_obligations[0]],role:'rogue duplicate'
  });
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='DUPLICATE_MATERIAL_OWNER'));
});

test('runtime evaluator fails closed when retired Make is reactivated',()=>{
  const broken=structuredClone(registry);
  const make=broken.components.find(x=>x.runtime==='make');
  make.authority='ACTIVE';
  make.production_execution_allowed=true;
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='RETIRED_EXECUTOR_ACTIVE'));
});

test('active component certification fails closed on incomplete registration',()=>{
  const broken=structuredClone(registry);
  broken.components.push({id:'uncertified',authority:'ACTIVE',classification:'ACTIVE',production_execution_allowed:true,obligations:[]});
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='UNCERTIFIED_ACTIVE_COMPONENT'&&x.component_id==='uncertified'));
});

test('channel owner must itself be active authority',()=>{
  const broken=structuredClone(registry);
  broken.channels[0].owner_component_id='make-powerhouse-legacy-estate';
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='CHANNEL_OWNER_NOT_ACTIVE'));
});

test('canonical registry evaluates READY',()=>{
  const result=evaluateRuntimeAuthority(registry);
  assert.equal(result.ready,true);
  assert.deepEqual(result.violations,[]);
});

test('Supabase Edge production has exactly one protected-main promotion authority',()=>{
  const owners=ownersFor('supabase_edge_production_promotion');
  assert.equal(owners.length,1);
  assert.equal(owners[0].id,'github-supabase-edge-production-authority');
  assert.equal(owners[0].runtime,'supabase_github_integration');
  assert.equal(owners[0].production_execution_allowed,true);
  assert.equal(registry.controls.supabase_edge_production_authority,'PROTECTED_MAIN_ONLY');
  assert.equal(registry.controls.supabase_edge_source_of_truth,'GITHUB_PROTECTED_MAIN');
  assert.equal(registry.controls.supabase_edge_direct_provider_deploy,'FORBIDDEN');
  assert.equal(registry.controls.supabase_edge_manual_recovery,'TRUSTED_CURRENT_MAIN_ONLY');
  assert.equal(registry.controls.supabase_edge_drift_policy,'FAIL_CLOSED');
});

test('Supabase Edge production workflow is current-main-only, single-writer and byte-for-byte provider-attested with a read-only PAT',async()=>{
  const workflow=await readFile('.github/workflows/supabase-edge-production-authority.yml','utf8');
  assert.match(workflow,/branches:\s*\[main\]/);
  assert.match(workflow,/checks:\s*read/);
  assert.match(workflow,/group:\s*supabase-edge-production-authority/);
  assert.match(workflow,/cancel-in-progress:\s*false/);
  assert.match(workflow,/refs\/heads\/main/);
  assert.match(workflow,/git rev-parse origin\/main/);
  assert.match(workflow,/git merge-base --is-ancestor/);
  assert.match(workflow,/app\?\.slug==='supabase'/);
  assert.match(workflow,/Supabase Preview/);
  assert.match(workflow,/stableSuccess>=2/);
  assert.match(workflow,/source-tree-sha256\.json/);
  assert.match(workflow,/SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG/);
  assert.match(workflow,/sed -nE 's\/\^\\\[functions\\\.\(\[\^\]\]\+\)\\\]\$\/\\1\/p' supabase\/config\.toml/);
  assert.match(workflow,/SUPABASE_EDGE_ATTESTATION_SUPERSEDED_BY_RUNTIME_CHANGE/);
  assert.match(workflow,/actions\/upload-artifact@v4/);
  assert.match(workflow,/SUPABASE_ACCESS_TOKEN/);
  assert.match(workflow,/SUPABASE_ACCESS_TOKEN_REQUIRED_FOR_READ_ONLY_PROVIDER_PARITY/);
  assert.match(workflow,/supabase\/setup-cli@v1/);
  assert.match(workflow,/version:\s*2\.119\.0/);
  assert.match(workflow,/supabase functions download/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_FILESET_DRIFT/);
  assert.match(workflow,/SUPABASE_EDGE_PROVIDER_SOURCE_DRIFT/);
  assert.doesNotMatch(workflow,/supabase functions deploy/);
  assert.doesNotMatch(workflow,/PROJECT_REF:[^\n]*\n\s+SUPABASE_ACCESS_TOKEN:/);
});

test('runtime governance fails closed if direct Supabase Edge deploy becomes allowed',()=>{
  const broken=structuredClone(registry);
  broken.controls.supabase_edge_direct_provider_deploy='ALLOWED';
  const result=evaluateRuntimeAuthority(broken);
  assert.equal(result.ready,false);
  assert.ok(result.violations.some(x=>x.code==='DIRECT_SUPABASE_EDGE_PROVIDER_DEPLOY_NOT_FORBIDDEN'));
});


test('Supabase Edge authority registry binds provider deployment to the GitHub integration and GitHub Actions to attestation only',()=>{
  assert.equal(registry.controls.supabase_edge_provider_deployer,'SUPABASE_GITHUB_INTEGRATION');
  assert.equal(registry.controls.supabase_edge_github_actions_role,'ATTESTATION_ONLY');
  assert.equal(registry.controls.supabase_edge_static_pat_required,false);
  assert.equal(registry.controls.supabase_edge_provider_check,'Supabase Preview');
  assert.equal(registry.controls.supabase_edge_provider_app,'supabase');
  assert.equal('supabase_edge_cli_version' in registry.controls,false);
});

test('Supabase Git production registration includes all social authority-critical functions with provider-compatible JWT modes',async()=>{
  const config=await readFile('supabase/config.toml','utf8');
  assert.match(config,/\[functions\.powerhouse-social-publisher\][\s\S]*?enabled\s*=\s*true[\s\S]*?verify_jwt\s*=\s*false[\s\S]*?entrypoint\s*=\s*"\.\/functions\/powerhouse-social-publisher\/index\.ts"/);
  assert.match(config,/\[functions\.social-recovery-runner\][\s\S]*?enabled\s*=\s*true[\s\S]*?verify_jwt\s*=\s*true[\s\S]*?entrypoint\s*=\s*"\.\/functions\/social-recovery-runner\/index\.ts"/);
});


test('Supabase Edge config changes are scoped to declared functions only',async()=>{
  const workflow=await readFile('.github/workflows/supabase-edge-production-authority.yml','utf8');
  assert.match(workflow,/SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG/);
  assert.match(workflow,/supabase\/config\.toml/);
  assert.doesNotMatch(workflow,/find supabase\/functions -mindepth 1 -maxdepth 1 -type d -printf/);
});
