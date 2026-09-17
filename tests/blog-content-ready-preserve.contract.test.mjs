import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('orchestrator preserves content_ready until executor consumes artifact', () => {
  const source = readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts', 'utf8');
  assert.match(source, /COVERED_STATES\s*=\s*new Set\(\[[^\]]*'content_ready'/);
  assert.match(source, /if \(shouldPreserveExisting\(previous\)\) continue;/);
});
