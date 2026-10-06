import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

test('CI acceleration keeps one Required single-flight and removes duplicate generic domain work', async () => {
  const required = await read('.github/workflows/required-test.yml');
  assert.match(required, /group: required-test-/);
  assert.match(required, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(required, /Prove Supabase security gate blocks known unsafe patterns/);
  assert.doesNotMatch(required, /Verify Portal V2 suite/);
  assert.match(required, /npm install --prefer-offline/);
  assert.match(required, /hashFiles\('package\.json'\)/);
});

test('website lane reuses exact preview and does not keep a duplicate page-seo build job', async () => {
  const website = await read('.github/workflows/lane-website.yml');
  assert.doesNotMatch(website, /^  page-seo:/m);
  assert.match(website, /preview_mode == 'local-exact-candidate'/);
  assert.match(website, /UI_VR_BASE_URL: \$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(website, /Verify built artifact contracts/);
});

test('expensive mutation testing stays off the ordinary pull-request path', async () => {
  const quality = await read('.github/workflows/powerhouse-quality-intelligence.yml');
  const mutation = quality.slice(quality.indexOf('  mutation:'), quality.indexOf('  passive-dast:'));
  assert.match(mutation, /github\.event_name == 'schedule'/);
  assert.match(mutation, /github\.event_name == 'workflow_dispatch'/);
  assert.doesNotMatch(mutation, /pull_request/);
});

test('CI intelligence telemetry is registered and measures queue, execution and fan-out', async () => {
  const [workflow, collector] = await Promise.all([
    read('.github/workflows/powerhouse-ci-intelligence.yml'),
    read('scripts/brain/powerhouse-ci-intelligence.mjs'),
  ]);
  assert.match(workflow, /name: Powerhouse CI Intelligence/);
  assert.match(workflow, /actions:\s*read/);
  assert.match(collector, /queue_wait_seconds_avg/);
  assert.match(collector, /workflow_fanout_per_sha_p95/);
});


test('broad platform changes do not fan out into unrelated Business OS and portal-native workflows', async () => {
  const [foundation, portal] = await Promise.all([
    read('.github/workflows/business-os-foundation.yml'),
    read('.github/workflows/portal-native-regression-tests.yml'),
  ]);
  assert.doesNotMatch(foundation, /- 'platform\/\*\*'/);
  assert.match(foundation, /platform\/contracts\/\*\*/);
  assert.match(foundation, /platform\/events\/\*\*/);
  assert.match(foundation, /platform\/integrations\/\*\*/);
  assert.match(foundation, /platform\/read-models\/\*\*/);
  assert.doesNotMatch(portal, /- 'platform\/\*\*'/);
  assert.match(portal, /platform\/read-models\/portal-server-state\.mjs/);
});

test('backend release lane cannot hang indefinitely during dependency installation', async () => {
  const backend = await read('.github/workflows/lane-backend.yml');
  assert.match(backend, /backend:\n    runs-on: ubuntu-latest\n    timeout-minutes: 20/);
  assert.match(backend, /Install runtime dependencies for backend contracts\n        timeout-minutes: 8/);
  assert.match(backend, /npm_config_fetch_retries: '2'/);
  assert.match(backend, /npm_config_fetch_retry_maxtimeout: '20000'/);
  assert.match(backend, /npm install --prefer-offline --no-audit --no-fund/);
  assert.doesNotMatch(backend, /npm install .*--silent/);
});
