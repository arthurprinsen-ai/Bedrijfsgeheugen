import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateApprovedBlog,parseOpenAIApprovedBlog} from '../tools/content-growth/generate-approved-blog-openai.mjs';

const workflow=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');
const canonical=readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');

test('approved blog supply uses OpenAI only and needs no GitHub OIDC permission',()=>{
  assert.match(workflow,/Generate one BRAIN-led approved blog candidate via OpenAI/);
  assert.match(workflow,/OPENAI_API_KEY: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
  assert.match(workflow,/node tools\/content-growth\/generate-approved-blog-openai\.mjs/);
  assert.match(workflow,/\npermissions:\n  contents: read\n/);
  assert.doesNotMatch(workflow,/anthropic|claude-code-action|id-token: write/i);
  assert.doesNotMatch(canonical,/ANTHROPIC_API_KEY/);
  assert.equal((canonical.match(/OPENAI_API_KEY: \$\{\{ secrets\.OPENAI_API_KEY \}\}/g)||[]).length,2);
});

test('OpenAI generation obeys existing approval, uniqueness and stock gates',()=>{
  assert.match(workflow,/steps\.stock\.outputs\.covered != 'true'/);
  assert.match(workflow,/Autopublish toegestaan/);
  assert.match(workflow,/Quality gate/);
  assert.match(workflow,/Herzien/);
  assert.match(workflow,/verification_mode/);
  assert.match(workflow,/blog length contract failed/);
  assert.match(workflow,/at least two H2-style sections required/);
  assert.match(workflow,/Approved Source Hash/);
});

test('OpenAI Responses uses strict schema with store=false and no fabricated delivery proof',async()=>{
  const article={title:'MKB kennis borgen: praktische keuzes',slug:'mkb-kennis-borgen',keyword:'kennis borgen',meta:'Een passende lange metatekst voor het midden- en kleinbedrijf met een heldere aanpak voor overdraagbare bedrijfskennis en dagelijkse besluiten.',blogtext:'## Een\nEen plan\n## Twee\nNog een plan',brain_reason:'BRAIN: feitelijk verbetergebied.'};
  const out=await generateApprovedBlog({
    key:'unit-test-only',
    learning:{learning:{signal:'tested'}},
    fetchImpl:async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses');
      const body=JSON.parse(options.body);
      assert.equal(body.model,'gpt-5-mini');
      assert.equal(body.store,false);
      assert.equal(body.text.format.type,'json_schema');
      assert.equal(body.text.format.strict,true);
      assert.deepEqual(body.text.format.schema.required,['title','slug','keyword','meta','blogtext','brain_reason']);
      return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(article)}]}]})};
    }
  });
  assert.deepEqual(out,article);
  assert.throws(()=>parseOpenAIApprovedBlog({status:'incomplete'}),/NOT_COMPLETED/);
  assert.throws(()=>parseOpenAIApprovedBlog({status:'completed',output_text:'{}'}),/SCHEMA_INVALID/);
});

test('OpenAI generation fails closed without API key or source-backed learning',async()=>{
  await assert.rejects(generateApprovedBlog({learning:{learning:{}},key:''}),/KEY_MISSING/);
  await assert.rejects(generateApprovedBlog({learning:{},key:'fake'}),/LEARNING_CONTEXT_INVALID/);
});
