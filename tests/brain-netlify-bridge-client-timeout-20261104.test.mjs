import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/production-source-snapshot.yml', import.meta.url), 'utf8');

test('original Netlify bridge request has a bounded 60-second client timeout', () => {
  assert.match(workflow, /bridge_http="\$\(curl -sS --max-time 60 -o "\$bridge_body"/);
  assert.doesNotMatch(workflow, /bridge_http="\$\(curl -sS --max-time 20 -o "\$bridge_body"/);
});

test('authorized bridge remains pinned to GitHub OIDC and original exact-source deployment', () => {
  assert.match(workflow, /audience=bedrijfsgeheugen-netlify-deploy-bridge/);
  assert.match(workflow, /NETLIFY_NATIVE_GIT_PRIMARY_WAIT/);
  assert.match(workflow, /NETLIFY_JIT_FALLBACK_UNAVAILABLE/);
  assert.match(workflow, /EXPECTED_SHA/);
});
