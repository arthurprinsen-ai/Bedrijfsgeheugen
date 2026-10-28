import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guards for two runtime defects found by deno check on 2026-10-28:
// 1) powerhouse-runtime used `uuid.test(...)` without declaring `uuid` (ReferenceError on the action path).
// 2) Postgrest builders were chained with `.catch(...)`, which is not a method on the builder (TypeError on the error path).
test('powerhouse-runtime declares uuid before use', () => {
  const src = readFileSync('supabase/functions/powerhouse-runtime/index.ts', 'utf8');
  assert.match(src, /^const uuid=\/\^\[0-9a-f\]\{8\}/m);
  assert.ok(src.indexOf('const uuid=') < src.indexOf('uuid.test('));
});

test('no Postgrest builder is chained with .catch in the touched functions', () => {
  for (const f of ['powerhouse-seo-opportunity-resolver', 'powerhouse-dataforseo-intelligence']) {
    const src = readFileSync(`supabase/functions/${f}/index.ts`, 'utf8');
    assert.doesNotMatch(src, /db\.from\('bg_gezondheid'\)\.insert\([\s\S]*?\)\.catch\(/, f);
  }
});
