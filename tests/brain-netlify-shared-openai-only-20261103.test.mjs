import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runWebsiteAnswer,runPortalAnswer,runTranslation} from '../netlify/functions/_brain-ai.mjs';
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const brain=read('netlify/functions/_brain-ai.mjs');
const wrappers=['netlify/functions/vraag.mjs','netlify/functions/portaalvraag.mjs','netlify/functions/i18n-translate.mjs'];
test('all three live Netlify callsites use only the owner OpenAI key',()=>{
  for(const path of wrappers){
    const source=read(path);
    assert.ok(source.includes('OPENAI_API_KEY'),path);
    assert.ok(!source.includes('ANTHROPIC_API_KEY'),path);
  }
  assert.ok(brain.includes("provider:'OpenAI'"));
  assert.ok(brain.includes('api.openai.com'));
  assert.ok(!brain.includes('api.anthropic.com'));
});
test('governed website assistant sends exact OpenAI messages and remains source-bound',async()=>{
  let called=0;
  const result=await runWebsiteAnswer({
    question:'Wat doet dit?',fragments:'Alleen de bron.',system:'Gebruik bron.',
    apiKey:'test-only-secret',usageStore:{record:async()=>({canonicalRecorded:true})},
    fetchImpl:async(url,init)=>{
      called++;
      const u=new URL(url);
      assert.equal(u.origin,'https://api.openai.com');
      assert.equal(u.pathname,'/v1/chat/completions');
      const payload=JSON.parse(init.body);
      assert.equal(payload.model,'gpt-5-mini');
      assert.equal(payload.messages[0].role,'system');
      assert.match(payload.messages[1].content,/Alleen de bron/);
      assert.equal(init.headers.authorization,'Bearer test-only-secret');
      return Response.json({choices:[{message:{content:'Alleen op basis van de bron.'}}],usage:{prompt_tokens:10,completion_tokens:5}});
    },
  });
  assert.equal(called,1);
  assert.equal(result.text,'Alleen op basis van de bron.');
  assert.equal(result.tokenUsage.provider,'OpenAI');
  assert.equal(result.tokenUsage.providerModelId,'OPENAI-GPT-5-MINI');
});
test('empty OpenAI output cannot count as successful provider response',async()=>{
  await assert.rejects(()=>runWebsiteAnswer({
    question:'x',fragments:'bron',system:'systeem',apiKey:'test',
    fetchImpl:async()=>Response.json({choices:[{message:{content:''}}]}),
  }),/OPENAI_EMPTY_RESPONSE/);
});
test('confidential portal requires tenant authorization before model call',async()=>{
  let called=false;
  await assert.rejects(()=>runPortalAnswer({
    tenantId:'tenant-not-authorized',question:'vraag',projectContext:'gevoelige context',
    system:'systeem',apiKey:'test',fetchImpl:async()=>{called=true;throw Error('NO_CALL');},
    sovereigntyClient:{assertAiAllowed:async()=>{throw Object.assign(Error('block'),{code:'DATA_SOVEREIGNTY_AI_BLOCKED'});}},
  }),/block/);
  assert.equal(called,false);
});
test('translation keeps ordered JSON array and OpenAI model attribution',async()=>{
  const result=await runTranslation({
    strings:['Goedemorgen','Bedankt'],source:'nl',target:'en',apiKey:'test',
    fetchImpl:async(url,init)=>{
      assert.equal(new URL(url).origin,'https://api.openai.com');
      const body=JSON.parse(init.body);
      assert.equal(body.model,'gpt-5-mini');
      return Response.json({choices:[{message:{content:'["Good morning","Thank you"]'}}],usage:{prompt_tokens:7,completion_tokens:5}});
    },
    usageStore:{record:async()=>({canonicalRecorded:true})},
  });
  assert.deepEqual(result.translations,['Good morning','Thank you']);
  assert.equal(result.tokenUsage.providerModelId,'OPENAI-GPT-5-MINI-TRANSLATION');
});
