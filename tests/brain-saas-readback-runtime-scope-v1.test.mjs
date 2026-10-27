import test from 'node:test';
import assert from 'node:assert/strict';
import { isNetlifyRuntimePath, isNonProductionPath } from '../tools/site-shell/production-supersession.mjs';
import { classifyTerminalReleaseScope } from '../tools/delivery/terminal-release-scope.mjs';

test('SaaS checkout pages and V18 generator require the canonical Netlify deployment', () => {
  for (const path of ['afsluiten.html', 'zelfscan.html', 'tools/bouw-v18-production-core.mjs']) {
    assert.equal(isNetlifyRuntimePath(path), true, path);
    const scope = classifyTerminalReleaseScope([path]);
    assert.equal(scope.website, true, path);
    assert.equal(scope.other, false, path);
    assert.equal(scope.non_runtime, false, path);
  }
});

test('SEO validator remains a verifier and unknown application paths stay fail-closed', () => {
  assert.equal(isNonProductionPath('tools/controleer-technische-seo.mjs'), true);
  assert.equal(classifyTerminalReleaseScope(['tools/controleer-technische-seo.mjs']).non_runtime, true);
  assert.equal(classifyTerminalReleaseScope(['tools/unregistered-application.mjs']).other, true);
  assert.equal(classifyTerminalReleaseScope(['unregistered-checkout.html']).other, true);
});
