import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveOpenAIKeyFromVault,loadOpenAIKeyForRunner} from '../tools/ci/load-openai-key-from-vault.mjs';

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

test('existing service-role-only Vault RPC resolves only the selected OpenAI key',async()=>{
  assert.equal(await resolveOpenAIKeyFromVault({
    supabaseUrl:PROJECT,serviceRoleKey:'test-role',fetchImpl:vaultFetch
  }),FAKE_KEY);
});

test('runner masks before writing OpenAI key to ephemeral GITHUB_ENV',async()=>{
  const order=[];
  const result=await loadOpenAIKeyForRunner({
    supabaseUrl:PROJECT,serviceRoleKey:'test-role',fetchImpl:vaultFetch,
    envPath:'/tmp/fake-github-env',
    maskWriter:key=>{assert.equal(key,FAKE_KEY);order.push('mask');},
    appendFileImpl:async(path,value,options)=>{
      assert.equal(path,'/tmp/fake-github-env');
      assert.equal(value,'OPENAI_API_KEY='+FAKE_KEY+'\n');
      assert.equal(options.mode,0o600);
      order.push('write');
    }
  });
  assert.deepEqual(order,['mask','write']);
  assert.deepEqual(result,{contract:'BLOG_OPENAI_VAULT_RUNNER_V1',ready:true});
});

test('Vault bridge fails closed for wrong project, missing role, denied RPC, or malformed keys',async()=>{
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
  await assert.rejects(loadOpenAIKeyForRunner({
    envPath:'',supabaseUrl:PROJECT,serviceRoleKey:'role',fetchImpl:vaultFetch
  }),/GITHUB_ENV_MISSING/);
});

test('both canonical blog workflows consume only an ephemeral Vault credential',()=>{
  const daily=readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
  const supply=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');
  for(const yml of [daily,supply]){
    assert.match(yml,/Resolve OpenAI credential from protected Supabase Vault/);
    assert.match(yml,/SUPABASE_URL: \$\{\{ secrets\.SUPABASE_URL \}\}/);
    assert.match(yml,/SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/);
    assert.match(yml,/node tools\/ci\/load-openai-key-from-vault\.mjs/);
    assert.doesNotMatch(yml,/OPENAI_API_KEY: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
    assert.doesNotMatch(yml,/ANTHROPIC_API_KEY|anthropics\/claude-code-action/);
  }
  assert.ok(daily.indexOf('Resolve OpenAI credential from protected Supabase Vault') <
      daily.indexOf('Create exactly one protected candidate'));
  assert.ok(supply.indexOf('Resolve OpenAI credential from protected Supabase Vault') <
      supply.indexOf('Generate one BRAIN-led approved blog candidate with OpenAI'));
  assert.match(daily,/STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(daily,/gh pr merge "\$pr" --auto --squash/);
  assert.match(supply,/Autopublish toegestaan/);
  assert.match(supply,/Quality gate/);
  assert.match(supply,/Approved Source Hash/);
});
