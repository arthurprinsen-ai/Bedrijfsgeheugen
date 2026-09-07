import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteReleaseRisk } from '../tools/website-release-risk.mjs';

const policy = JSON.parse(await readFile(new URL('../config/website-release-risk.json', import.meta.url), 'utf8'));

function classify(paths) {
  return classifyWebsiteReleaseRisk({ changedPaths: paths, policy });
}
function profile(paths) { return classify(paths).profile; }

test('pure release control-plane changes do not require deploy-preview UI checks', () => {
  assert.equal(profile(['config/website-release-risk.json','tools/website-release-risk.mjs','tests/website-release-risk.test.mjs','.github/workflows/required-test.yml']), 'none');
});

test('megamenu implementation changes require the focused menu browser gate', () => {
  assert.equal(profile(['tools/bouw-v18-production-core.mjs']), 'menu');
  assert.equal(profile(['tools/site-shell/v18-megamenu-heading-contract.mjs']), 'menu');
  assert.equal(profile(['tools/site-shell/v18-megamenu-browser-check.mjs']), 'menu');
});

test('page-local public surface changes use targeted browser verification', () => {
  const homepage=classify(['index.html']);
  assert.equal(homepage.profile,'targeted');
  assert.deepEqual(homepage.affectedRoutes,['/']);
  const aiAct=classify(['pages/ai-act.html']);
  assert.equal(aiAct.profile,'targeted');
  assert.deepEqual(aiAct.affectedRoutes,['/ai-act']);
});

test('shared public surface changes retain full browser profile', () => {
  assert.equal(profile(['assets/stijl.js']), 'full');
  assert.equal(profile(['styles.css']), 'full');
  assert.equal(profile(['components/header.html']), 'full');
});

test('full surface risk dominates menu targeted and control-plane changes', () => {
  assert.equal(profile(['.github/workflows/required-test.yml','tools/bouw-v18-production-core.mjs','index.html','assets/stijl.js']), 'full');
});

test('menu risk dominates targeted and control-plane changes when no full path exists', () => {
  assert.equal(profile(['config/website-release-risk.json','index.html','tools/site-shell/v18-megamenu-browser-check.mjs']), 'menu');
});

test('non-site backend or documentation changes do not acquire website browser risk', () => {
  assert.equal(profile(['supabase/migrations/20260907.sql','docs/changes/example.md']), 'none');
});

test('unknown files inside shared site-shell runtime fail closed to full', () => {
  assert.equal(profile(['tools/site-shell/future-runtime-transform.mjs']), 'full');
});
