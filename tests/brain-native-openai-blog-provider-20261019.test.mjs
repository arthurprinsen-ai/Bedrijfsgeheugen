import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateApprovedBlog, validateApprovedBlog} from '../tools/content-growth/openai-approved-blog.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const article={
  title:'Bedrijfskennis verbinden met dagelijkse beslissingen',
  slug:'bedrijfskennis-en-dagelijkse-beslissingen',
  keyword:'bedrijfskennis borgen',
  meta:'Zo verbind je bedrijfskennis met dagelijkse beslissingen, concrete processen en meetbare opvolging in het MKB, zonder onnodige systemen of losse lijstjes.',
  blogtext:'## Hoe ontstaat het probleem\n\n'+('Een organisatie borgt kennis met duidelijke processen en controleerbaar eigenaarschap. '.repeat(60))+
    '\n\n## Welke stappen werken\n\n'+('Kies een verbeteractie en controleer een concreet resultaat met de proceseigenaar. '.repeat(60)),
  brain_reason:'Bron: BRAIN learning met bewijs; nog geen commercieel resultaat geclaimd.'
};
test('OpenAI native blog candidate uses only Responses structured output',async()=>{
  let invoked=false;
  const data=await generateApprovedBlog({
    apiKey:'test-only',learning:{learning:{commercial_totals:{orders:0}}},
    fetchImpl:async(url,req)=>{
      invoked=true;
      assert.equal(url,'https://api.openai.com/v1/responses');
      assert.equal(req.headers.authorization,'Bearer test-only');
      const body=JSON.parse(req.body);
      assert.equal(body.store,false);
      assert.equal(body.model,'gpt-5-mini');
      assert.equal(body.text.format.type,'json_schema');
      assert.ok(body.instructions.includes('Verzin geen omzet'));
      assert.equal(body.input,'{"learning":{"commercial_totals":{"orders":0}}}');
      return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(article)}]}]})};
    }
  });
  assert.equal(invoked,true);
  assert.equal(data.slug,article.slug);
});
test('missing key and incomplete OpenAI response fail closed',async()=>{
  await assert.rejects(()=>generateApprovedBlog({learning:{learning:{}},apiKey:''}),/OPENAI_API_KEY_MISSING/);
  await assert.rejects(()=>generateApprovedBlog({learning:{learning:{}},apiKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete'})})}),/OPENAI_BLOG_RESPONSE_INCOMPLETE/);
  assert.throws(()=>validateApprovedBlog({...article,blogtext:'## Zwaar tekort'}),/OPENAI_BLOG_WORD_COUNT_INVALID/);
});
test('both blog publication lanes have OpenAI keys and no Claude/Anthropic dependencies',()=>{
  const supply=fs.readFileSync(path.join(root,'.github/workflows/native-approved-blog-supply.yml'),'utf8');
  const daily=fs.readFileSync(path.join(root,'.github/workflows/powerhouse-daily-blog.yml'),'utf8');
  assert.match(supply,/node tools\/content-growth\/openai-approved-blog\.mjs/);
  assert.match(supply,/secrets\.OPENAI_API_KEY/);
  assert.doesNotMatch(supply,/anthropics\/claude-code-action|ANTHROPIC_API_KEY/);
  assert.match(daily,/secrets\.OPENAI_API_KEY/);
  assert.doesNotMatch(daily,/ANTHROPIC_API_KEY/);
  assert.match(daily,/STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(daily,/gh pr merge "\$pr" --auto --squash/);
});
