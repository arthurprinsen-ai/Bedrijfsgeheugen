import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Netlify transport 401 recovery is explicit and source-triggered', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const learning = fs.readFileSync('brain/learning/netlify-oidc-proxy-401-git-source-fallback-20260925-v1.json', 'utf8');
  const doc = fs.readFileSync('docs/changes/netlify-oidc-proxy-401-git-source-fallback-20260925-v1.md', 'utf8');
  assert.match(home, /production-source-trigger: netlify-git-linked-recovery-20260925-v1/);
  assert.match(learning, /NETLIFY_DEPLOY_TRANSPORT_AUTH_401/);
  assert.match(learning, /401 Unauthorized/);
  assert.match(doc, /production commit_ref/);
  assert.match(doc, /homepage, pricing and systems\/koppelingen/i);
});
