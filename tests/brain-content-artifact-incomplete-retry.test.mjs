import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {incompleteStructuredArtifactReason,largerArtifactTokenBudget} from '../supabase/functions/_shared/content-artifact-incomplete-retry.mjs';

test('explicit OpenAI incomplete output is recoverable without weakening quality gates',()=>{
  assert.equal(incompleteStructuredArtifactReason({status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}),'MAX_OUTPUT_TOKENS');
  assert.equal(incompleteStructuredArtifactReason({status:'completed',output:[]}),null);
  assert.equal(incompleteStructuredArtifactReason({status:'incomplete',incomplete_details:{reason:'content_filter'}}),null);
});
test('truncated JSON syntax is eligible, not arbitrary invalid provider or content output',()=>{
  assert.equal(incompleteStructuredArtifactReason({},new SyntaxError('Unterminated string in JSON at position 744')),'INCOMPLETE_JSON');
  assert.equal(incompleteStructuredArtifactReason({},new SyntaxError('Unexpected end of JSON input')),'INCOMPLETE_JSON');
  assert.equal(incompleteStructuredArtifactReason({},new SyntaxError('Unexpected token X in JSON at position 1')),null);
  assert.equal(incompleteStructuredArtifactReason({},new Error('PERSONAL_EDITORIAL_CONTRACT_FAILED')),null);
});
test('one bounded retry doubles capacity without unbounded spending',()=>{
  assert.equal(largerArtifactTokenBudget(1800),3600);
  assert.equal(largerArtifactTokenBudget(4800),8000);
  assert.throws(()=>largerArtifactTokenBudget(0),/INITIAL_ARTIFACT_BUDGET_INVALID/);
});
test('provider generation requires valid strict schema and retains independent approval',()=>{
  const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
  assert.match(source,/if\(!validArtifactObject\(result\)\)throw new Error\('AI_ARTIFACT_SCHEMA_INVALID:/);
  assert.match(source,/if\(!\(firstError instanceof AIProviderIncompleteOutputError\)\)throw firstError/);
  assert.match(source,/artifact=await callAI\(apiKey,gov\.model_id,editorialSystem,artifactInput,artifactTool,retryBudget\)/);
  assert.match(source,/if\(editorialViolations\.length\) throw new Error\('PERSONAL_EDITORIAL_CONTRACT_FAILED:/);
  assert.match(source,/if\(!personalFinalCopyValid\(bodyText,personalSource\?\.evidence\|\|\{\}\)\) throw new Error\('PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED'\)/);
  assert.match(source,/if\s*\(!companyTrackingUrl \|\| !bodyText\.includes\(companyTrackingUrl\)\)/);
});

test('Composio/Groq fallback retries incomplete strict JSON once without bypassing schema or editorial checks',()=>{
  const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
  assert.match(source,/async function callComposioArtifact\([^\n]*allowTruncationRetry=true\)/);
  assert.match(source,/const reason=incompleteStructuredArtifactReason\(providerTruncation,error\)/);
  assert.match(source,/if\(!allowTruncationRetry\|\|!reason\)throw error/);
  assert.match(source,/callComposioArtifact\(db,model,system,user,retryBudget,false\)/);
  assert.match(source,/return parseArtifactJson\(raw\)/);
  assert.match(source,/COMPOSIO_ARTIFACT_SCHEMA_INVALID/);
  assert.match(source,/PERSONAL_EDITORIAL_CONTRACT_FAILED/);
  assert.match(source,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
});
