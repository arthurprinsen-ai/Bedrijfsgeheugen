import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retryIncompleteEditorialDraft,largerArtifactTokenBudget,incompleteStructuredArtifactReason}
  from '../supabase/functions/_shared/content-artifact-incomplete-retry.mjs';

test('a genuine truncated revision retries once at larger existing budget',async()=>{
 const seen=[];
 const truncated=Object.assign(new Error('token cap'),{name:'AIProviderIncompleteOutputError'});
 const draft=await retryIncompleteEditorialDraft(async budget=>{
   seen.push(budget);
   if(budget===2400) throw truncated;
   return {body:'approved, source-backed candidate'};
 },2400,e=>e?.name==='AIProviderIncompleteOutputError',largerArtifactTokenBudget);
 assert.deepEqual(seen,[2400,4800]);
 assert.equal(draft.body,'approved, source-backed candidate');
});
test('unverified source, editorial failure and provider denial are never retried',async()=>{
 for(const message of ['PERSONAL_EDITORIAL_TECHNICAL_STATUS','PERSONAL_SOURCE_UNVERIFIED','AI_PROVIDER_REQUEST_FAILED:401']){
   let n=0;
   await assert.rejects(retryIncompleteEditorialDraft(async()=>{n++;throw Error(message);},2400,e=>e?.name==='AIProviderIncompleteOutputError',largerArtifactTokenBudget),new RegExp(message));
   assert.equal(n,1,message);
 }
});
test('second genuine truncation is terminal, never a spin loop',async()=>{
 let n=0;const err=Object.assign(new Error('max tokens'),{name:'AIProviderIncompleteOutputError'});
 await assert.rejects(retryIncompleteEditorialDraft(async()=>{n++;throw err;},2400,e=>e?.name==='AIProviderIncompleteOutputError',largerArtifactTokenBudget),/max tokens/);
 assert.equal(n,2);
});
test('model incomplete output is exact provider evidence, not an editorial bypass',()=>{
 assert.equal(incompleteStructuredArtifactReason({status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}),'MAX_OUTPUT_TOKENS');
 assert.equal(incompleteStructuredArtifactReason({status:'completed'}),null);
 const s=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.match(s,/retryIncompleteEditorialDraft\(/);
 assert.match(s,/error instanceof AIProviderIncompleteOutputError/);
 assert.match(s,/personalEditorialViolations\(revisedText,personalSource\?\.evidence\|\|\{\}\)\.length===0/);
 assert.match(s,/personalFinalCopyValid\(revisedText,personalSource\?\.evidence\|\|\{\}\)/);
 assert.match(s,/PERSONAL_EDITORIAL_CONTRACT_FAILED/);
 assert.match(s,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
});
