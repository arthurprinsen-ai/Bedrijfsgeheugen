// ONE BRAIN earliest-stage replay; runs original Opdrachtenradar tests without external provider calls.
import './supabase-bg-opdrachtenradar-v1.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/bg-opdrachtenradar/index.ts',import.meta.url),'utf8');
test('owner OpenAI-only directive never revives Anthropic on original nightly production path',()=>{
  assert.match(source,/OPENAI_API_KEY/);
  assert.match(source,/api\.openai\.com\/v1\/chat\/completions/);
  assert.match(source,/tool_choice: \{ type: 'function', function: \{ name: 'beoordeel' \} \}/);
  assert.doesNotMatch(source,/ANTHROPIC_API_KEY|api\.anthropic\.com|claude-haiku/);
  assert.match(source,/powerhouse_daily_scheduler_token/);
  assert.match(source,/beoordeelFouten/);
});
