import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  NETLIFY_GOVERNANCE_EXACT,
  NETLIFY_GOVERNANCE_PREFIXES,
  NETLIFY_BUILD_RUNTIME_EXACT
} from '../tools/delivery/netlify-deployment-applicability.mjs';

const workflow=readFileSync('.github/workflows/canonical-brand-shell-live-readback.yml','utf8');
function governanceOnly(paths){
  return paths.every(path=>!NETLIFY_BUILD_RUNTIME_EXACT.has(path)
    && (NETLIFY_GOVERNANCE_EXACT.has(path)
      || NETLIFY_GOVERNANCE_PREFIXES.some(prefix=>path.startsWith(prefix))));
}
test('original canonical brand shell reuses exact provider deploy classifier, not an independently drifting allowlist',()=>{
  assert.match(workflow,/await import\("\.\/tools\/delivery\/netlify-deployment-applicability\.mjs"\)/);
  assert.match(workflow,/NETLIFY_GOVERNANCE_EXACT:exact/);
  assert.match(workflow,/NETLIFY_GOVERNANCE_PREFIXES:prefixes/);
  assert.match(workflow,/NETLIFY_BUILD_RUNTIME_EXACT:buildRuntime/);
  assert.equal(workflow.includes('const ok=paths.every(p=>!buildRuntime.has(p)&&(exact.has(p)||prefixes.some(prefix=>p.startsWith(prefix))));'),true);
  assert.doesNotMatch(workflow,/const prefixes=\["docs\/","tests\/","\.github\/","brain\/learning\/"\]/);
});
test('real PR 6085 original source-only innovation browser repair remains non-deployment governance',()=>{
  const paths=[
    '.agents/skills/powerhouse-delivery-self-optimization/SKILL.md',
    'brain/learning/2026-11-20-production-route-visible-readiness-timeout-v1.json',
    'docs/changes/2026-11-20-production-browser-visible-readiness-repair.md',
    'docs/development-ledger-events/2026-11-20-production-browser-visible-readiness-repair.md',
    'tests/brain-production-route-visible-nested-readiness-20261120.test.mjs',
    'tools/site-shell/verify-targeted-website-routes.mjs'
  ];
  assert.equal(governanceOnly(paths),true);
});
test('real hosted website, server code and Netlify build entries never inherit governance skip',()=>{
  for(const path of [
    'portal-v2/index.html','portal-v2/app.js','site/index.html','index.html',
    'netlify/functions/portal-authenticated-production-proof.mjs',
    'netlify.toml','tools/ci/netlify-build-entry.mjs',
    'platform/api/portal-authenticated-production-proof-core.mjs'
  ]) assert.equal(governanceOnly([path]),false,path);
  assert.equal(governanceOnly([
    'tools/site-shell/verify-targeted-website-routes.mjs','portal-v2/index.html'
  ]),false);
});
test('brand shell still requires public exact ancestor, complete landing + SEO + growth and visible browser gates',()=>{
  assert.match(workflow,/git merge-base --is-ancestor "\$observed" "\$HEAD_COMMIT"/);
  assert.match(workflow,/if \[ "\$safe" = "true" \]/);
  assert.match(workflow,/mode="control-plane-ancestor"/);
  assert.match(workflow,/--expected "\$EXPECTED_COMMIT" --observed "\$observed_commit"/);
  assert.match(workflow,/tools\/site-shell\/check-live-production\.mjs/);
  assert.match(workflow,/tools\/seo-order-engine\/live-readback\.mjs/);
  assert.match(workflow,/\[ "\$growth_status" = "405" \]/);
  assert.match(workflow,/standalone-visibility-check\.mjs/);
  assert.match(workflow,/ui-visual-regression\/browser-check\.mjs/);
});
