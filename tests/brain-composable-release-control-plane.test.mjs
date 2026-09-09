import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const required = readFileSync('.github/workflows/required-test.yml', 'utf8');

for (const file of ['lane-website.yml','lane-portal.yml','lane-backend.yml','lane-automation.yml']) {
  test(`reusable release lane exists: ${file}`, () => {
    assert.equal(existsSync(`.github/workflows/${file}`), true, `${file} must exist`);
  });
}

test('required test keeps one protected runner and preserves lane-aware control-plane semantics', () => {
  assert.match(required, /name:\s*Required test/);
  assert.match(required, /jobs:\s*\n\s+test:/);
  assert.match(required, /name:\s*test/);
  assert.match(required, /delivery-driftless-merge-candidate\.test\.mjs/);
  assert.match(required, /delivery-github-event-context\.mjs/);
  assert.match(required, /deriveRequiredTestSuites/);
  assert.match(required, /single-flight-release-kernel\.mjs\s+run/);
  assert.match(required, /exactGithubSha=process\.env\.EVENT_NAME === 'pull_request' \? process\.env\.PR_HEAD_SHA : process\.env\.GITHUB_SHA_VALUE/);
  assert.match(required, /head_sha=\$\{context\.candidateSha\}/);
  assert.equal((required.match(/\bruns-on:\s*ubuntu-latest\b/g) || []).length, 1, 'Required test must allocate exactly one runner');
  for (const lane of ['website','portal','backend','automation']) {
    assert.doesNotMatch(required, new RegExp(`uses:\\s*\\./\\.github/workflows/lane-${lane}\\.yml`));
    assert.match(required, new RegExp(`steps\\.scope\\.outputs\\.${lane}`));
  }
  assert.doesNotMatch(required, /v18-vergelijker\.test\.mjs/);
  assert.doesNotMatch(required, /tests\/portal-\*\.test\.mjs/);
  assert.doesNotMatch(required, /make-cost-governor-policy\.test\.mjs/);
});

test('website lane keeps public visibility mandatory while broad checks are high-risk only', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const kernel = readFileSync('tools/ci/single-flight-release-kernel.mjs', 'utf8');
  assert.match(website, /classifyWebsiteRelease/);
  const visibilityStart = website.indexOf('      - name: Verify all public pages are visibly rendered');
  assert.notEqual(visibilityStart, -1);
  const broadStart = website.indexOf('      - name: Verify broad high-risk browser contracts', visibilityStart);
  assert.notEqual(broadStart, -1);
  const visibility = website.slice(visibilityStart, broadStart);
  assert.doesNotMatch(visibility, /if:.*(?:high-risk|fast-fix|normal)|risk_lane/);
  assert.match(website.slice(broadStart), /if:\s*needs\.classify\.outputs\.risk_lane == 'high-risk'/);
  assert.match(website, /verify-targeted-website-routes\.mjs/);
  assert.match(kernel, /id:\s*'website-public-visibility'[\s\S]*requiresPreview:\s*true/);
  assert.doesNotMatch(kernel.match(/\{ id:\s*'website-public-visibility'[^\n]+/s)?.[0] || '', /when:\s*'high-risk'/);
  assert.match(kernel, /id:\s*'website-megamenu-browser'[\s\S]*when:\s*'high-risk'/);
});

test('production readback is serialized and never cancelled mid-flight', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(required, /concurrency:[\s\S]*production-release-readback/);
});
