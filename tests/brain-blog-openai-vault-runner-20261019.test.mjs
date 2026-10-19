import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveOpenAIKeyFromVault,runWithVaultOpenAIKey} from '../tools/ci/load-openai-key-from-vault.mjs';

const PROJECT='https://adhjwmvyoixzjtmiroln.supabase.co';
const FAKE_KEY='sk-proj-FAKE_UNIT_TEST_SECRET_12345678901234567890';
const vaultFetch=async(url,options)=>{
  assert.equal(url,PROJECT+'/rest/v1/rpc/bg_geheim');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.apikey,'test-role');
  assert.equal(options.headers.authorization,'Bearer test-role');
  assert.deepEqual(JSON.parse(options.body),{p_naam:'OPENAI_API_KEY'});
  assert.ok(options.signal);
  return {ok:true,status:200,json:async()=>FAKE_KEY};
};

const vault={supabaseUrl:PROJECT,serviceRoleKey:'test-role',fetchImpl:vaultFetch};

test('Vault RPC resolves only the expected, scalar OpenAI credential',async()=>{
  assert.equal(await resolveOpenAIKeyFromVault(vault),FAKE_KEY);
});

test('runner passes key only in an allowed child-process environment, never a file or argv',async()=>{
  const calls=[];
  const result=await runWithVaultOpenAIKey({
    ...vault,
    argv:['node','tools/content-growth/openai-approved-blog.mjs'],
    spawnImpl:(command,args,opts)=>{
      assert.equal(command,process.execPath);
      assert.deepEqual(args,['tools/content-growth/openai-approved-blog.mjs']);
      assert.equal(opts.env.OPENAI_API_KEY,FAKE_KEY);
      assert.equal(opts.env.SUPABASE_SERVICE_ROLE_KEY,undefined);
      assert.equal(opts.env.SUPABASE_URL,undefined);
      assert.equal(opts.shell,false);
      assert.equal(opts.stdio,'inherit');
      calls.push('spawn');
      return {status:0};
    }
  });
  assert.deepEqual(calls,['spawn']);
  assert.deepEqual(result,{contract:'BLOG_OPENAI_VAULT_RUNNER_V1',status:0});
});

test('runner accepts only fixed blog and translation commands',async()=>{
  const accepted=await runWithVaultOpenAIKey({
    ...vault,
    argv:['node','tools/ci/netlify-build-entry.mjs','--prepare-i18n-cache=powerhouse-blog-2026-10-19.json'],
    spawnImpl:(_cmd,args)=>{assert.equal(args.length,2);return {status:5};}
  });
  assert.equal(accepted.status,5,'provider build failure remains a failed run');
  for(const argv of [
    ['bash','-c','printenv'],
    ['node','some-other-script.mjs'],
    ['node','tools/content-growth/openai-approved-blog.mjs','--extra'],
    ['node','tools/ci/netlify-build-entry.mjs','--no-gates'],
    ['node','tools/ci/netlify-build-entry.mjs','--prepare-i18n-cache=../../secret.json'],
  ]){
    await assert.rejects(runWithVaultOpenAIKey({...vault,argv}),/COMMAND_NOT_ALLOWED/);
  }
});

test('Vault bridge fails closed for wrong project, missing role, denied RPC, and malformed keys',async()=>{
  await assert.rejects(resolveOpenAIKeyFromVault({
    supabaseUrl:'https://other.supabase.co',serviceRoleKey:'role',fetchImpl:vaultFetch
  }),/PROJECT_URL_INVALID/);
  await assert.rejects(resolveOpenAIKeyFromVault({
    supabaseUrl:PROJECT,serviceRoleKey:'',fetchImpl:vaultFetch
  }),/SERVICE_CREDENTIAL_MISSING/);
  await assert.rejects(resolveOpenAIKeyFromVault({
    supabaseUrl:PROJECT,serviceRoleKey:'role',fetchImpl:async()=>({ok:false,status:403})
  }),/RPC_UNAUTHORIZED/);
  await assert.rejects(resolveOpenAIKeyFromVault({
    supabaseUrl:PROJECT,serviceRoleKey:'role',fetchImpl:async()=>({ok:true,json:async()=>({secret:FAKE_KEY})})
  }),/RESPONSE_INVALID/);
  await assert.rejects(resolveOpenAIKeyFromVault({
    supabaseUrl:PROJECT,serviceRoleKey:'role',fetchImpl:async()=>({ok:true,json:async()=>FAKE_KEY+'\nEXPOSED'})
  }),/SECRET_INVALID/);
});

test('canonical approved blog workflows invoke Vault bridge only for the approved producer',()=>{
  const daily=readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
  const supply=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');
  for(const yml of [daily,supply]){
    assert.match(yml,/SUPABASE_URL: \$\{\{ secrets\.SUPABASE_URL \}\}/);
    assert.match(yml,/SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/);
    assert.match(yml,/node tools\/ci\/load-openai-key-from-vault\.mjs(?:\s*\\)?\s+node tools\//);
    assert.doesNotMatch(yml,/OPENAI_API_KEY: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
    assert.doesNotMatch(yml,/ANTHROPIC_API_KEY|anthropics\/claude-code-action/);
  }
  assert.match(daily,/STATIC_I18N_NETWORK=1 node tools\/ci\/load-openai-key-from-vault\.mjs/);
  assert.match(daily,/STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(daily,/gh pr merge "\$pr" --auto --squash/);
  assert.match(supply,/Autopublish toegestaan/);
  assert.match(supply,/Quality gate/);
  assert.match(supply,/Approved Source Hash/);
  const loader=readFileSync('tools/ci/load-openai-key-from-vault.mjs','utf8');
  assert.doesNotMatch(loader,/GITHUB_ENV|appendFile|GITHUB_OUTPUT|writeFile/);
  assert.match(loader,/delete env\.SUPABASE_SERVICE_ROLE_KEY/);
});
