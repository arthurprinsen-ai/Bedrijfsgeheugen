import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-linkedin-sales-machine/index.ts',import.meta.url),'utf8');
test('original SalesRobot LinkedIn comment-draft model is OpenAI-only and governed',()=>{
  assert.match(source,/secret\(db,'OPENAI_API_KEY'\)/);
  assert.match(source,/gov\.provider!=='OpenAI'/);
  assert.match(source,/api\.openai\.com\/v1\/chat\/completions/);
  assert.match(source,/max_completion_tokens:900/);
  assert.match(source,/OPENAI_COMMENT_REFUSAL/);
  assert.doesNotMatch(source,/api\.anthropic\.com|ANTHROPIC_API_KEY|provider:'Anthropic'/);
});
test('original source preserves draft-only, one provider receipt and commercial safety',()=>{
  assert.match(source,/COMMENT_AI_OUTPUT_INVALID/);
  assert.match(source,/COMMENT_AI_SALES_PITCH_BLOCKED/);
  assert.match(source,/comment_generation:\{/);
  assert.match(source,/status:'suggested'/);
  assert.match(source,/powerhouse_daily_scheduler_token/);
  assert.match(source,/provider_inbox_readback!==true/);
  assert.match(source,/provider_readback_verified:true/);
  assert.match(source,/SALESROBOT_VERIFIED_ACTION_WRITE/);
});
