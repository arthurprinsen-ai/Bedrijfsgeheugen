import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Powerhouse scan production proof cannot fail silently', () => {
  const workflow = readFileSync('.github/workflows/powerhouse-scan-production-proof.yml', 'utf8');
  assert.match(
    workflow,
    /::error::/,
    'powerhouse-scan-production-proof.yml must emit a GitHub ::error:: annotation when the production proof times out or fails'
  );
});
