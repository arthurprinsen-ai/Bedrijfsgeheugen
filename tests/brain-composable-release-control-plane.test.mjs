import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const required = readFileSync('.github/workflows/required-test.yml', 'utf8');

for (const file of ['lane-website.yml','lane-portal.yml','lane-backend.yml','lane-automation.yml']) {
  test(`reusable release lane exists: ${file}`, () => {
    assert.equal(existsSync(`.github/workflows/${file}`), true, `${file} must exist`);
  });
}

test('required test is a stable aggregator and preserves the protected test context', () => {
  assert.match(required, /name:\s*Required test/);
  assert.match(required, /name:\s*test/);
  assert.match(required, /moving-main-successor-guard\.mjs/);
  for (const lane of ['website','portal','backend','automation']) {
    assert.match(required, new RegExp(`uses:\\s*\\./\\.github/workflows/lane-${lane}\\.yml`));
  }
  assert.doesNotMatch(required, /v18-vergelijker\.test\.mjs/);
  assert.doesNotMatch(required, /tests\/portal-\*\.test\.mjs/);
  assert.doesNotMatch(required, /make-cost-governor-policy\.test\.mjs/);
});

test('website lane keeps public visibility mandatory while broad checks are high-risk only', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  assert.match(website, /classifyWebsiteRelease/);
  assert.match(website, /Verify all public pages are visibly rendered/);
  const visibility = website.slice(website.indexOf('Verify all public pages are visibly rendered'));
  assert.doesNotMatch(visibility.split('\n      - name:')[0], /high-risk|fast-fix|normal/);
  assert.match(website, /risk_lane == 'high-risk'/);
  assert.match(website, /verify-targeted-website-routes\.mjs/);
});

test('production readback serializes only latest production verification', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(required, /concurrency:[\s\S]*production-release-readback/);
});
