import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
test('bounded revision is only attempted after personal editorial rejection',()=>{
  assert.match(code,/if \(editorialViolations\.length && generationProvider==='Anthropic' && apiKey\)/);
  assert.match(code,/editorial_rejection_codes:editorialViolations\.map/);
  assert.match(code,/\},artifactTool,2400\)/);
});
test('rewrite must satisfy the original editorial and factual gates',()=>{
  assert.match(code,/personalEditorialViolations\(revisedText,personalSource\?\.evidence\|\|\{\}\)\.length===0/);
  assert.match(code,/personalFinalCopyValid\(revisedText,personalSource\?\.evidence\|\|\{\}\)/);
  assert.match(code,/if\(editorialViolations\.length\) throw new Error\('PERSONAL_EDITORIAL_CONTRACT_FAILED:/);
  assert.match(code,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
});
test('no additional sender, no false publication results',()=>{
  const start=code.indexOf('// One source-grounded editorial rewrite is allowed before final rejection.');
  const end=code.indexOf("if (pending.channel==='linkedin_company')",start);
  const fragment=code.slice(start,end);
  assert.ok(start>0 && end>start);
  assert.doesNotMatch(fragment,/powerhouse-social-publisher|LIVE_PROVEN|net\.http_post|sendMessage/i);
  assert.match(fragment,/tussen 150 en 175 woorden/);
});
