import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translateBatchWithOpenAI, assertFaithfulTranslationBatch } from '../tools/site-shell/static-i18n-openai-fallback.mjs';

const build = readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const workflow = readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
const payload = translations => ({
  status:'completed',
  output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({translations})}]}]
});

test('bounded OpenAI fallback returns exact validated translation array', async()=>{
  let requested = null;
  const result = await translateBatchWithOpenAI(
    ['Boek nu op https://www.bedrijfsgeheugen.nl en bewaar {id}', 'Vrijblijvend overzicht'],
    'test-key',
    {fetchImpl:async(_url,opts)=>{
      requested=JSON.parse(opts.body);
      assert.equal(opts.headers.authorization,'Bearer test-key');
      return {ok:true,json:async()=>payload(['Book now at https://www.bedrijfsgeheugen.nl and keep {id}','No-obligation overview'])};
    }}
  );
  assert.equal(result.length,2);
  assert.equal(requested.model,'gpt-5-mini');
  assert.equal(requested.store,false);
  assert.equal(requested.text.format.strict,true);
  assert.deepEqual(result,['Book now at https://www.bedrijfsgeheugen.nl and keep {id}','No-obligation overview']);
});

test('never cache unverified changed URLs or missing placeholders',()=>{
  assert.throws(()=>assertFaithfulTranslationBatch(['Ga naar https://safe.example en gebruik {name}'],['Go to https://wrong.example and use {name}']),/IMMUTABLE_TOKEN_MISMATCH/);
  assert.throws(()=>assertFaithfulTranslationBatch(['Welkom {name}'],['Welcome']),/IMMUTABLE_TOKEN_MISMATCH/);
});

test('incomplete, missing or malformed responses cannot become accepted translation cache',async()=>{
  await assert.rejects(()=>translateBatchWithOpenAI(['Hoi'],'',{fetchImpl:async()=>({})}),/KEY_UNAVAILABLE/);
  await assert.rejects(()=>translateBatchWithOpenAI(['Hoi'],'test',{fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})})}),/INCOMPLETE/);
  await assert.rejects(()=>translateBatchWithOpenAI(['Hoi'],'test',{fetchImpl:async()=>({ok:true,json:async()=>payload([])})}),/SHAPE_INVALID/);
});

test('blog-only failover preserves the protected source and production cache gates',()=>{
  assert.match(build,/STATIC_I18N_APPROVED_PROVIDER_FAILOVER/);
  assert.match(build,/translateBatchWithOpenAI\(part,backupKey\)/);
  assert.match(build,/if \(!providerUnavailable \|\| !backupKey\) throw primaryError/);
  assert.match(build,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(build,/STATIC_I18N_PREPARE_INCOMPLETE/);
  assert.match(build,/STATIC_I18N_REQUIRE_CACHE/);
  assert.match(workflow,/OPENAI_API_KEY:\s*\$\{\{ secrets\.OPENAI_API_KEY \}\}/);
  assert.match(workflow,/STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(workflow,/gh pr merge "\$pr" --auto --squash/);
});
