import test from 'node:test';
import assert from 'node:assert/strict';
import {generateApprovedBlog} from '../tools/content-growth/openai-approved-blog.mjs';

const sentence='Controleer de oorspronkelijke bron, wijs een verantwoordelijke eigenaar aan, meet het resultaat en bespreek concrete verbeterstappen met het team.';
const blogtext=['Een bedrijf heeft dagelijks beslissingen nodig.', '## Onderzoek de huidige situatie', Array(40).fill(sentence).join(' '), '## Voer verbeteringen uit', Array(20).fill(sentence).join(' '), 'Start met een Frisse Blik.'].join('\n\n');
const good={
  title:'Maak dagelijkse verbeteringen aantoonbaar',
  slug:'dagelijkse-verbeteringen-aantoonbaar',
  keyword:'dagelijkse verbeteringen',
  meta:'Maak de oorzaken van terugkerende fouten zichtbaar, verbind betrouwbare gegevens aan eigenaarschap en verbeter beslissingen stap voor stap in je bedrijf.',
  blogtext,
  brain_reason:'Only sanitized aggregate marketing signals are supplied; no customer-specific claims.'
};
const short={...good,blogtext:'Veel te kort.'};
const learning={learning:{commercial_totals:{orders:2},private_customer_email:'never-forward@example.invalid'}};
const completed=candidate=>({ok:true,json:async()=>({status:'completed',output_text:JSON.stringify(candidate)})});

test('one invalid word-count response is regenerated and then validated', async()=>{
  const requests=[];
  const result=await generateApprovedBlog({
    learning,apiKey:'fixture-test-key',
    fetchImpl:async(_url,options)=>{requests.push(JSON.parse(options.body));return completed(requests.length===1?short:good);}
  });
  assert.equal(requests.length,2);
  assert.equal(result.blogtext,good.blogtext);
  assert.match(requests[1].instructions,/HERGENERATIE/);
  assert.equal(requests[0].input,requests[1].input);
  assert.doesNotMatch(requests[0].input,/private_customer_email|never-forward/);
  assert.equal(requests[1].text.format.strict,true);
});

test('terminal word-count failure does not exceed three generation attempts',async()=>{
  let count=0;
  await assert.rejects(
    generateApprovedBlog({learning,apiKey:'fixture-test-key',fetchImpl:async()=>{count++;return completed(short);}}),
    /OPENAI_BLOG_WORD_COUNT_INVALID/
  );
  assert.equal(count,3);
});

test('non-word-count quality failures still fail closed without retry',async()=>{
  let count=0;
  await assert.rejects(
    generateApprovedBlog({learning,apiKey:'fixture-test-key',fetchImpl:async()=>{count++;return completed({...good,title:'x'});}}),
    /OPENAI_BLOG_TITLE_INVALID/
  );
  assert.equal(count,1);
});
