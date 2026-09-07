import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteReleaseRisk } from '../tools/website-release-risk.mjs';

const policy = JSON.parse(await readFile(new URL('../config/website-release-risk.json', import.meta.url), 'utf8'));

function profile(paths) {
  return classifyWebsiteReleaseRisk({ changedPaths: paths, policy }).profile;
}

test('pure release control-plane changes do not require deploy-preview UI checks', () => {
  assert.equal(profile([
    'config/website-release-risk.json',
    'tools/website-release-risk.mjs',
    'tests/website-release-risk.test.mjs',
    '.github/workflows/required-test.yml'
  ]), 'none');
});

test('megamenu implementation changes require the focused menu browser gate', () => {
  assert.equal(profile(['tools/bouw-v18-production-core.mjs']), 'menu');
  assert.equal(profile(['tools/site-shell/v18-megamenu-heading-contract.mjs']), 'menu');
});

test('real public surface changes require the full browser profile', () => {
  assert.equal(profile(['index.html']), 'full');
  assert.equal(profile(['assets/stijl.js']), 'full');
  assert.equal(profile(['pages/ai-act.html']), 'full');
});

test('full surface risk dominates menu and control-plane changes', () => {
  assert.equal(profile([
    '.github/workflows/required-test.yml',
    'tools/bouw-v18-production-core.mjs',
    'assets/stijl.js'
  ]), 'full');
});

test('menu risk dominates control-plane-only changes', () => {
  assert.equal(profile([
    'config/website-release-risk.json',
    'tools/site-shell/v18-megamenu-browser-check.mjs'
  ]), 'menu');
});

test('non-site backend or documentation changes do not acquire website browser risk', () => {
  assert.equal(profile(['supabase/migrations/20260907.sql', 'docs/changes/example.md']), 'none');
});

test('unknown files inside a declared public surface fail closed to full', () => {
  assert.equal(profile(['tools/site-shell/future-runtime-transform.mjs']), 'full');
});
