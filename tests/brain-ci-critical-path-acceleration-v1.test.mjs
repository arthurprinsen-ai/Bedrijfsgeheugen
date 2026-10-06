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

test('website lane reuses exact preview and central Netlify parity without duplicate builds', async () => {
  const [required, website] = await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('.github/workflows/lane-website.yml'),
  ]);
  assert.doesNotMatch(website, /^  page-seo:/m);
  assert.doesNotMatch(website, /^  netlify-build-parity:/m);
  assert.doesNotMatch(website, /^  netlify_build_parity:/m);
  assert.match(required, /^  netlify_build_parity:/m);
  assert.match(required, /Run exact Netlify production build command once/);
  assert.match(website, /preview_mode == 'local-exact-candidate'/);
  assert.match(website, /UI_VR_BASE_URL: \$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
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
  assert.doesNotMatch(foundation, /pull_request:/);
  assert.match(foundation, /workflow_dispatch:/);
  assert.doesNotMatch(foundation, /- 'platform\/\*\*'/);
  assert.doesNotMatch(portal, /pull_request:/);
  assert.match(portal, /workflow_dispatch:/);
  assert.doesNotMatch(portal, /- 'platform\/\*\*'/);
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


test('repository-writer verification cancels superseded candidate work instead of queueing stale heads', async () => {
  const [dispatch,operational] = await Promise.all([
    read('.github/workflows/repo-writer-gate-dispatch.yml'),
    read('.github/workflows/repo-writer-operational-verification.yml'),
  ]);
  assert.match(dispatch, /group: repo-writer-gates-\$\{\{ inputs\.pr_number \}\}/);
  assert.doesNotMatch(dispatch, /group: repo-writer-gates-.*inputs\.head_sha/);
  assert.match(dispatch, /cancel-in-progress:\s*true/);
  assert.match(operational, /group: repo-writer-operational-\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(operational, /cancel-in-progress:\s*true/);
});

test('Netlify skip delegates to one canonical applicability authority and fails open on classifier errors', async () => {
  const [config,ignore,authority] = await Promise.all([
    read('netlify.toml'),
    read('tools/ci/netlify-ignore-build.mjs'),
    read('tools/delivery/netlify-deployment-applicability.mjs'),
  ]);
  assert.match(config, /ignore = "node \.\/tools\/ci\/netlify-ignore-build\.mjs"/);
  assert.match(ignore, /deriveNetlifyDeploymentApplicability/);
  assert.match(ignore, /NETLIFY_BUILD_REQUIRED/);
  assert.match(ignore, /NETLIFY_BUILD_SKIPPED/);
  assert.match(ignore, /process\.exit\(1\)/);
  assert.doesNotMatch(ignore, /const governancePrefixes/);
  assert.doesNotMatch(ignore, /const governanceExact/);
  assert.match(authority, /brain\/learning\//);
  assert.match(authority, /\.github\//);
  assert.match(authority, /NETLIFY_RUNTIME_PREFIXES/);
  assert.match(authority, /netlify\/functions\//);
});


test('Supabase provider preview is change-scoped inside the canonical Required gate', async () => {
  const required = await read('.github/workflows/required-test.yml');
  assert.match(required, /supabase_preview_required/);
  assert.match(required, /^  supabase_preview:/m);
  assert.match(required, /Verify provider-owned Supabase Preview on exact candidate head/);
  assert.match(required, /SELECT_SUPABASE_PREVIEW/);
  assert.match(required, /SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
  assert.match(required, /!path\.startsWith\('supabase\/functions\/'\)/);
});


test('legacy global Supabase applicability runner stays retired', async () => {
  await assert.rejects(
    () => read('.github/workflows/supabase-preview-applicability.yml'),
    error => error?.code === 'ENOENT'
  );
});
