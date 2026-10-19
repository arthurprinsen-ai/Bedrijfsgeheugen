import test from 'node:test';
import assert from 'node:assert/strict';
import {generateApprovedBlog} from '../tools/content-growth/openai-approved-blog.mjs';

const learning={learning:{commercial_totals:{orders:2,revenue:5800},untrusted_contact_email:'private@example.net'}};
const makeDraft=(n)=>({
  title:'Hoe je bedrijfsprocessen beter onderbouwt',
  slug:'bedrijfsprocessen-beter-onderbouwen',
  keyword:'bedrijfsprocessen onderbouwen',
  meta:'Breng processen en kennis samen, toets welke stappen aantoonbaar werken en maak verbeteracties uitvoerbaar voor jouw organisatie zonder gegevens te verzinnen.',
  blogtext:'Dit artikel beschrijft een werkbare aanpak.\n\n## Begin met meten\n\n'+Array(n).fill('proces').join(' ')+'\n\n## Borg de verbeteringen\n\nEen ondernemer kan de uitvoering volgen.',
  brain_reason:'Public marketing aggregates suggest documenting repeatable workflows.'
});
function mockFetch(drafts){
  const calls=[];
  const fetchImpl=async(url,args)=>{
    calls.push({url,args});
    const draft=drafts[Math.min(calls.length-1,drafts.length-1)];
    return {ok:true,json:async()=>({status:'completed',output_text:JSON.stringify(draft)})};
  };
  return {fetchImpl,calls};
}

test('below-minimum OpenAI article gets a bounded evidence-preserving revision',async()=>{
  const api=mockFetch([makeDraft(780),makeDraft(1050)]);
  const item=await generateApprovedBlog({learning,apiKey:'test-key',fetchImpl:api.fetchImpl});
  assert.equal(api.calls.length,2);
  assert.ok(item.blogtext.split(/\s+/).length>=900);
  assert.ok(item.blogtext.split(/\s+/).length<=1500);
  assert.equal(item.slug,makeDraft(1050).slug);
  const firstPayload=JSON.parse(api.calls[0].args.body);
  assert.equal(firstPayload.store,false);
  assert.doesNotMatch(firstPayload.input,/private@example.net/);
  const revision=JSON.parse(JSON.parse(api.calls[1].args.body).input);
  assert.equal(revision.revision_requirement.target_min,1150);
  assert.ok(revision.previous_draft.blogtext.includes('proces proces'));
});

test('already-valid article incurs only one OpenAI call',async()=>{
  const api=mockFetch([makeDraft(1040)]);
  await generateApprovedBlog({learning,apiKey:'test-key',fetchImpl:api.fetchImpl});
  assert.equal(api.calls.length,1);
});

test('three bad word counts fail closed without accepting an underlength article',async()=>{
  const api=mockFetch([makeDraft(770),makeDraft(780),makeDraft(790)]);
  await assert.rejects(generateApprovedBlog({learning,apiKey:'test-key',fetchImpl:api.fetchImpl}),/OPENAI_BLOG_WORD_COUNT_INVALID/);
  assert.equal(api.calls.length,3);
});

test('a non-length quality failure is not bypassed by retry',async()=>{
  const bad={...makeDraft(1020),title:'Te kort'};
  const api=mockFetch([bad,makeDraft(1020)]);
  await assert.rejects(generateApprovedBlog({learning,apiKey:'test-key',fetchImpl:api.fetchImpl}),/OPENAI_BLOG_TITLE_INVALID/);
  assert.equal(api.calls.length,1);
});
