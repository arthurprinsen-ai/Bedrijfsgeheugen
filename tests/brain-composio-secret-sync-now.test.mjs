import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../netlify/functions/powerhouse-composio-secret-sync-now.mjs',import.meta.url),'utf8');

test('immediate Composio sync is authenticated and reuses canonical sync',()=>{
  assert.match(source,/EXPECTED_TOKEN_SHA256/);
  assert.match(source,/x-powerhouse-token/);
  assert.match(source,/sha256\(token\)/);
  assert.match(source,/syncComposioSecret\(\)/);
  assert.match(source,/path:'\/api\/powerhouse-composio-secret-sync-now'/);
});

test('immediate Composio sync exposes no secret values and cannot publish',()=>{
  assert.doesNotMatch(source,/COMPOSIO_API_KEY/);
  assert.doesNotMatch(source,/powerhouse-social-publisher/);
  assert.doesNotMatch(source,/console\.log/);
});
