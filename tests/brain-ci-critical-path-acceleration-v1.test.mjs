import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

test('CI acceleration keeps one canonical PR ingress without a workflow-level lock', async () => {
  const [required, control] = await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('config/powerhouse-ci-control-plane-v2.json'),
  ]);
  assert.doesNotMatch(required, /^concurrency:/m);
  assert.match(required, /Enforce CI control plane v2 architecture/);
  assert.match(required, /github\.event_name == 'pull_request' \|\| steps\.integration\.outputs\.full_shared_suite == 'false'/);
  assert.match(required, /github\.event_name != 'pull_request'/);
  assert.match(control, /"pull_request_head_workflow_budget": 1/);
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


test('specialist Business OS and portal workflows no longer receive PR HEAD events', async () => {
  const [foundation, portal] = await Promise.all([
    read('.github/workflows/business-os-foundation.yml'),
    read('.github/workflows/portal-native-regression-tests.yml'),
  ]);
  assert.doesNotMatch(foundation, /^  pull_request:/m);
  assert.doesNotMatch(portal, /^  pull_request:/m);
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


test('repository-writer verification is dispatched after canonical admission instead of receiving every PR HEAD', async () => {
  const [dispatch,operational] = await Promise.all([
    read('.github/workflows/repo-writer-gate-dispatch.yml'),
    read('.github/workflows/repo-writer-operational-verification.yml'),
  ]);
  assert.match(dispatch, /group: repo-writer-gates-\$\{\{ inputs\.pr_number \}\}/);
  assert.match(dispatch, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(operational, /^  pull_request:/m);
});

test('Netlify skips only known governance-only commits and fails open for runtime changes', async () => {
  const [config,ignore] = await Promise.all([
    read('netlify.toml'),
    read('tools/ci/netlify-ignore-build.mjs'),
  ]);
  assert.match(config, /ignore = "node \.\/tools\/ci\/netlify-ignore-build\.mjs"/);
  assert.match(ignore, /NETLIFY_BUILD_REQUIRED/);
  assert.match(ignore, /NETLIFY_BUILD_SKIPPED/);
  assert.match(ignore, /process\.exit\(1\)/);
  assert.match(ignore, /brain\/learning\//);
  assert.match(ignore, /\.github\//);
  assert.doesNotMatch(ignore, /netlify\/functions\//);
});


test('Supabase provider preview never blocks the PR fast lane or merge-group assurance', async () => {
  const required = await read('.github/workflows/required-test.yml');
  assert.match(required, /^  supabase_preview:/m);
  assert.match(required, /github\.event_name == 'workflow_dispatch'/);
  assert.match(required, /Provider-owned Supabase previews are intentionally not polled on merge_group/);
  assert.match(required, /!path\.startsWith\('supabase\/functions\/'\)/);
});
