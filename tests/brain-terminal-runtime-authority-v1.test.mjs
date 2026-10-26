import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyLiveProviderReadbacks} from '../tools/supabase/publish-edge-provider-readback.mjs';

const workflows=['obligation-terminal-closure.yml','powerhouse-obligation-terminalizer.yml'];
const read=name=>readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');
const canonical=read(workflows[1]);
const sha='a'.repeat(40),hash='b'.repeat(64);
for(const name of workflows) test(name+' requires successful exact candidate BRAIN, never foundation/descendant substitution',()=>{
  const source=read(name);
  assert.match(source,/require_workflow "unified-brain-delivery.yml" "BRAIN"/);
  assert.doesNotMatch(source,/require_brain_evidence|TERMINAL_BRAIN_(FOUNDATION|DESCENDANT)_PROVEN/);
  const gate=source.match(/          require_workflow\(\) \{[\s\S]*?\n          \}/)?.[0];
  assert.ok(gate);
  const run=payload=>spawnSync('bash',['-c',`set -euo pipefail
  gh(){
    [ "$1" = api ] || exit 91
    case "$2" in
      "repos/fixture/repo/actions/workflows/unified-brain-delivery.yml/runs?branch=main&event=workflow_dispatch&per_page=100") printf '%s' "$FIXTURE_PAYLOAD" ;;
      "repos/fixture/repo/compare/${'c'.repeat(40)}...main") printf '%s' "${'c'.repeat(40)}" ;;
      *) exit 92 ;;
    esac
    case "$2" in *event=pull_request*) exit 93;; esac
  }
  seq(){ printf '1\\n'; }
  sleep(){ :; }
  ${gate}
  require_workflow "unified-brain-delivery.yml" "BRAIN"`],{encoding:'utf8',env:{...process.env,HEAD_SHA:sha,PR_NUMBER:'1',GITHUB_REPOSITORY:'fixture/repo',FIXTURE_PAYLOAD:JSON.stringify({workflow_runs:payload})}});
  const row={id:1,head_sha:'c'.repeat(40),head_branch:'main',event:'workflow_dispatch',display_title:`BRAIN delivery PR #1 ${sha}`,status:'completed',conclusion:'success',created_at:'2026-10-26T00:00:00Z'};
  assert.equal(run([row]).status,0);
  for(const payload of [[],[{...row,display_title:`BRAIN delivery PR #1 ${'d'.repeat(40)}`}],[{...row,head_sha:'d'.repeat(40)}],[{...row,head_branch:'feature'}],[{...row,event:'push'}],[{...row,conclusion:'failure'}],[{...row,conclusion:'skipped'}],[{...row,status:'in_progress',conclusion:null}]]) assert.equal(run(payload).status,78);
});

const expected=[{function:'alpha',version:7,runtime_sha256:hash,state:'ACTIVE'}];
const live=[{slug:'alpha',version:7,ezbr_sha256:hash,status:'ACTIVE'}];
test('independent provider proof rejects stale, forged, missing and inactive metadata',()=>{
  assert.deepEqual(verifyLiveProviderReadbacks(expected,live),expected);
  for(const payload of [[],[{...live[0],version:8}],[{...live[0],ezbr_sha256:'c'.repeat(64)}],[{...live[0],status:'INACTIVE'}],{}]) assert.throws(()=>verifyLiveProviderReadbacks(expected,payload),/SUPABASE_/);
  assert.throws(()=>verifyLiveProviderReadbacks([],live),/EXPECTATIONS_MISSING/);
  assert.throws(()=>verifyLiveProviderReadbacks([...expected,...expected],live),/EXPECTATION_INVALID/);
  const providerBlock=canonical.slice(canonical.indexOf('# PR markers declare expectations'),canonical.indexOf("printf '%s\\n' \"$readbacks\" > .artifacts/supabase-provider-readbacks.json"));
  assert.match(providerBlock,/curl -fsSL/);
  assert.match(providerBlock,/api\.supabase\.com\/v1\/projects\/adhjwmvyoixzjtmiroln\/functions/);
  assert.match(providerBlock,/SUPABASE_PROVIDER_ACCESS_TOKEN_MISSING/);
  assert.match(providerBlock,/verifyLiveProviderReadbacks\(expected,JSON\.parse\(readFileSync/);
  assert.ok(canonical.indexOf('verifyLiveProviderReadbacks(expected')<canonical.indexOf('SUPABASE_EDGE_PROVIDER_READBACK_PROVEN'));
});

test('history recovery rejects executable SQL and unknown runtime paths',()=>{
  const block=canonical.match(/              case "\$path" in[\s\S]*?              esac/)?.[0];
  assert.ok(block);
  const run=path=>spawnSync('bash',['-c',`set -euo pipefail; invalid_recovery_path=false; ${block}; [ "$invalid_recovery_path" = false ] || exit 78`],{encoding:'utf8',env:{...process.env,path}});
  assert.equal(run('supabase/migration-history/manifest.json').status,0);
  for(const path of ['supabase/migrations/20261026120000_executable.sql','netlify/functions/runtime.mjs','supabase/functions/alpha/index.ts']) assert.equal(run(path).status,78,path);
});

const evidenceScript=canonical.match(/      - name: Materialize terminal outcome evidence[\s\S]*?node --input-type=module - <<'NODE'\n([\s\S]*?)\n          NODE/)?.[1].replace(/^          /gm,'');
function materialize(mode,{migrationRequired=true,migrations=[{state:'APPLIED'}],providers=[]}={}){
  const cwd=mkdtempSync(join(tmpdir(),'terminal-authority-'));
  try{
    mkdirSync(join(cwd,'.artifacts'));
    writeFileSync(join(cwd,'.artifacts/terminal-lineage.json'),JSON.stringify({obligation_id:'fixture',lineage_mode:'ancestor'}));
    writeFileSync(join(cwd,'.artifacts/supabase-provider-readbacks.json'),JSON.stringify(providers));
    writeFileSync(join(cwd,'.artifacts/supabase-migration-readbacks.json'),JSON.stringify(migrations));
    // Replace the read-only preflight fixture path inside this extracted script only.
    writeFileSync(join(cwd,'preflight.json'),JSON.stringify({status:'READY'}));
    const result=spawnSync(process.execPath,['--input-type=module','-'],{cwd,input:evidenceScript.replace('/tmp/chat-learning-preflight.json',join(cwd,'preflight.json')),encoding:'utf8',env:{...process.env,READBACK_MODE:mode,MIGRATION_READBACK_REQUIRED:String(migrationRequired),MERGE_SHA:sha,CANDIDATE_SHA:sha,PRODUCTION_SHA:sha,PR_NUMBER:'1'}});
    return {...result,evidence:result.status===0?JSON.parse(readFileSync(join(cwd,'.artifacts/obligation-terminal-evidence.json'),'utf8')):null};
  } finally {rmSync(cwd,{recursive:true,force:true});}
}
test('mixed Netlify migration proof remains required and represented in terminal evidence',()=>{
  assert.ok(evidenceScript);
  assert.match(canonical,/MIGRATION_READBACK_REQUIRED: \$\{\{ steps\.production\.outputs\.migration_required \}\}/);
  for(const mode of ['netlify_runtime_supabase_migration_provider','netlify_runtime_supabase_edge_and_migration_provider']){
    const result=materialize(mode,{providers:expected});
    assert.equal(result.status,0,result.stderr);
    assert.equal(result.evidence.checks.supabase_migration_readback,true);
    assert.equal(result.evidence.checks.deploy_promotion_readback,true);
    if(mode.includes('edge_and')) assert.equal(result.evidence.checks.supabase_provider_readback,true);
    const missing=materialize(mode,{migrations:[],providers:expected});
    assert.notEqual(missing.status,0);
    assert.match(missing.stderr,/TERMINAL_SUPABASE_MIGRATION_READBACK_EVIDENCE_MISSING/);
  }
  const omitted=materialize('netlify_runtime');
  assert.notEqual(omitted.status,0);
  assert.match(omitted.stderr,/TERMINAL_SUPABASE_MIGRATION_READBACK_MODE_MISSING/);
  const missingEdge=materialize('netlify_runtime_supabase_edge_and_migration_provider');
  assert.match(missingEdge.stderr,/TERMINAL_SUPABASE_PROVIDER_READBACK_EVIDENCE_MISSING/);
});
