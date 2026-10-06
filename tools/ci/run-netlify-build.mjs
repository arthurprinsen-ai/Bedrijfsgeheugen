import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(script,...args){
  const result=spawnSync(process.execPath,[script,...args],{stdio:'inherit',env:process.env});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`NETLIFY_BUILD_STEP_FAILED:${script}:${result.status}`);
}

if(existsSync('.bg-prebuilt-artifact.json')){
  const marker=JSON.parse(readFileSync('.bg-prebuilt-artifact.json','utf8'));
  const sourceCommit=readFileSync('.bg-source-commit','utf8').trim();
  const expected=String(process.env.COMMIT_REF||process.env.GITHUB_SHA||process.env.BG_RELEASE_COMMIT||marker.expected_commit_sha||'').trim();
  if(!/^[0-9a-f]{40}$/i.test(String(marker.source_tree_sha||''))) throw new Error('PREBUILT_SOURCE_TREE_INVALID');
  if(sourceCommit!==expected) throw new Error(`PREBUILT_SOURCE_COMMIT_MISMATCH:${sourceCommit}:${expected}`);
  console.log('NETLIFY_PREBUILT_REUSE',JSON.stringify({source_tree_sha:marker.source_tree_sha,commit_ref:expected}));
  run('tools/ci/restamp-prebuilt-release.mjs');
  run('tools/seo-order-engine/validate-locales.mjs');
  process.exit(0);
}

const steps=[
  ['tools/site-shell/pricing-build-integrity.mjs','capture'],
  ['tools/site-shell/bedrijfslek-build-integrity.mjs','capture'],
  ['tools/bouw-powerhouse-auth.mjs'],
  ['tools/bouw-kennisindex.mjs'],
  ['tools/bouw-v18-production.mjs'],
  ['tools/site-shell/apply-product-led-home.mjs'],
  ['tools/apply-tabbladen.mjs'],
  ['tools/bouw-v18-views.mjs'],
  ['tools/bouw-v18-chrome-alles.mjs'],
  ['tools/prijzen-uit-de-homepage.mjs'],
  ['tools/normaliseer-site-ui.mjs'],
  ['tools/site-shell/pricing-build-integrity.mjs','restore'],
  ['tools/site-shell/bedrijfslek-build-integrity.mjs','restore'],
  ['tools/seo-order-engine/apply.mjs'],
  ['tools/seo-order-engine/validate.mjs'],
  ['tools/site-shell/apply-i18n.mjs'],
  ['tools/ci/run-localized-routes-parallel.mjs'],
  ['tools/site-shell/apply-commercial-pricing-v1.mjs'],
  ['tools/seo-order-engine/apply-revenue-links.mjs'],
  ['tools/site-shell/finalize-website-coherence-v1.mjs'],
  ['tools/site-shell/apply-cms-runtime.mjs'],
  ['tools/genereer-sitemap.mjs'],
  ['tools/seo-order-engine/validate-locales.mjs'],
  ['tools/bouw-release-evidence.mjs'],
];
for(const [script,...args] of steps) run(script,...args);
