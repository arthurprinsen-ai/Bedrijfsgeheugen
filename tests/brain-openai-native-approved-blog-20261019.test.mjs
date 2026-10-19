import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateOpenAIApprovedBlog, validateApprovedBlogCandidate, selectApprovedPublicTopic}
  from '../tools/content-growth/generate-openai-approved-blog.mjs';

const workflow=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');
const sample={
  title:'Een bedrijfsproces overdraagbaar maken zonder losse notities',
  slug:'bedrijfsproces-overdraagbaar-maken',
  keyword:'bedrijfsproces overdragen',
  meta:'Maak bedrijfsprocessen overdraagbaar zonder losse notities. Koppel kritieke kennis aan verantwoordelijken, beslissingen en een heldere controlecyclus.',
  blogtext:'Bedrijfskennis verdwijnt als het proces niet gedocumenteerd is.\n\n## Maak kennis zichtbaar\n\nLeg de eigenaar vast.\n\n## Meet de overdracht\n\nControleer of een collega de stappen uitvoert.',
  brain_reason:'Bron geeft aan dat kennisborging terugkeert als uitvoeringsprobleem.'
};
const learning={learning:{confidence:{proven_items:0,observed_items:1}}};
const complete=(data)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]});

test('OpenAI replaces the Claude action without a parallel publication transport',()=>{
  assert.match(workflow,/node tools\/content-growth\/generate-openai-approved-blog\.mjs/);
  assert.match(workflow,/OPENAI_API_KEY:\s*\$\{\{ secrets\.OPENAI_API_KEY \}\}/);
  assert.doesNotMatch(workflow,/anthropics\/claude-code-action|ANTHROPIC_API_KEY|claude_args/);
  assert.match(workflow,/Validate candidate and write directly to central Approved Blogtekst stock/);
});

test('OpenAI structured blog candidate is data-only, schema-checked and not sent to providers twice',async()=>{
  let requests=0;
  let body;
  const out=await generateOpenAIApprovedBlog({
    apiKey:'fixture-key',date:'2026-10-19',learning,
    fetchImpl:async(url,opts)=>{
      requests++;assert.equal(url,'https://api.openai.com/v1/responses');
      assert.equal(opts.headers.authorization,'Bearer fixture-key');
      body=JSON.parse(opts.body);
      return {ok:true,json:async()=>complete(sample)};
    }
  });
  assert.equal(requests,1);
  assert.deepEqual(out,sample);
  assert.equal(body.store,false);
  assert.equal(body.model,'gpt-5-mini');
  assert.equal(body.text.format.type,'json_schema');
  assert.equal(body.text.format.strict,true);
  assert.deepEqual(body.text.format.schema.required,Object.keys(sample));
});

test('private BRAIN record fields never leave the workspace or appear in OpenAI request body', async()=>{
  const secretMarker='PRIVATE_EMAIL_secret@example.org';
  const privateLearning={learning:{
    exploit_candidates:[{content_id:'blog:bedrijfskennis-borgen',buyer_email:secretMarker,company:'PrivateCo',revenue:5800}],
    customer_note:secretMarker,
    confidence:{observed_items:2}
  }};
  const publicBrief=selectApprovedPublicTopic(privateLearning);
  assert.deepEqual(Object.keys(publicBrief),['topic','editorial_angle','proof_boundary']);
  assert.equal(JSON.stringify(publicBrief).includes(secretMarker),false);
  let payload;
  await generateOpenAIApprovedBlog({
    learning:privateLearning,date:'2026-10-19',apiKey:'test',
    fetchImpl:async(_url,options)=>{
      payload=options.body;
      return {ok:true,json:async()=>complete(sample)};
    }
  });
  assert.ok(payload.includes('Bedrijfskennis borgen'));
  assert.ok(!payload.includes(secretMarker));
  assert.ok(!payload.includes('PrivateCo'));
  assert.ok(!payload.includes('buyer_email'));
  assert.ok(!payload.includes('5800'));
});

test('missing key, absent BRAIN evidence, incomplete result or unsupported candidate fails closed',async()=>{
  await assert.rejects(generateOpenAIApprovedBlog({apiKey:'',date:'2026-10-19',learning}),/KEY_UNAVAILABLE/);
  await assert.rejects(generateOpenAIApprovedBlog({apiKey:'x',date:'2026-10-19',learning:{}}),/BRAIN_EVIDENCE_MISSING/);
  await assert.rejects(generateOpenAIApprovedBlog({
    apiKey:'x',date:'2026-10-19',learning,
    fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})})
  }),/NOT_COMPLETED/);
  assert.throws(()=>validateApprovedBlogCandidate({...sample,slug:'not safe'}),/SLUG_INVALID/);
  assert.throws(()=>validateApprovedBlogCandidate({...sample,extra:'unknown'}),/SHAPE_INVALID/);
});
