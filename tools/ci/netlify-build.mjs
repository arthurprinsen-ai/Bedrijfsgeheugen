import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PREBUILT_MARKER='.bg-netlify-prebuilt.json';

const steps=[
  ['pricing-capture','tools/site-shell/pricing-build-integrity.mjs','capture'],
  ['bedrijfslek-capture','tools/site-shell/bedrijfslek-build-integrity.mjs','capture'],
  ['powerhouse-auth','tools/bouw-powerhouse-auth.mjs'],
  ['kennisindex','tools/bouw-kennisindex.mjs'],
  ['v18-production','tools/bouw-v18-production.mjs'],
  ['product-led-home','tools/site-shell/apply-product-led-home.mjs'],
  ['tabbladen','tools/apply-tabbladen.mjs'],
  ['v18-views','tools/bouw-v18-views.mjs'],
  ['v18-chrome','tools/bouw-v18-chrome-alles.mjs'],
  ['homepage-pricing','tools/prijzen-uit-de-homepage.mjs'],
  ['normalize-site-ui','tools/normaliseer-site-ui.mjs'],
  ['pricing-restore','tools/site-shell/pricing-build-integrity.mjs','restore'],
  ['bedrijfslek-restore','tools/site-shell/bedrijfslek-build-integrity.mjs','restore'],
  ['seo-apply','tools/seo-order-engine/apply.mjs'],
  ['seo-validate','tools/seo-order-engine/validate.mjs'],
  ['i18n-assets','tools/site-shell/apply-i18n.mjs'],
  ['localized-routes','tools/site-shell/build-localized-routes.mjs'],
  ['commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs'],
  ['revenue-links','tools/seo-order-engine/apply-revenue-links.mjs'],
  ['website-coherence','tools/site-shell/finalize-website-coherence-v1.mjs'],
  ['cms-runtime','tools/site-shell/apply-cms-runtime.mjs'],
  ['sitemap','tools/genereer-sitemap.mjs'],
  ['locale-validation','tools/seo-order-engine/validate-locales.mjs'],
  ['release-evidence','tools/bouw-release-evidence.mjs'],
];

function runNode(label,script,...args){
  const start=Date.now();
  const result=spawnSync(process.execPath,[script,...args],{stdio:'inherit',env:process.env});
  const elapsed_ms=Date.now()-start;
  console.log('NETLIFY_BUILD_STEP',JSON.stringify({label,script,elapsed_ms,status:result.status}));
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status ?? 1);
}

if(existsSync(PREBUILT_MARKER)){
  const marker=JSON.parse(readFileSync(PREBUILT_MARKER,'utf8'));
  if(marker.contract!=='bg-netlify-prebuilt-v1' || marker.build_complete!==true){
    throw new Error('NETLIFY_PREBUILT_MARKER_INVALID');
  }
  const deploymentCommit=String(marker.deployment_commit||'').trim();
  if(!deploymentCommit) throw new Error('NETLIFY_PREBUILT_DEPLOYMENT_COMMIT_MISSING');
  console.log('NETLIFY_PREBUILT_REUSE',JSON.stringify({
    source_tree_sha:marker.source_tree_sha,
    source_commit:marker.source_commit,
    deployment_commit:deploymentCommit,
    required_run_id:marker.required_run_id||null
  }));
  const env={...process.env,COMMIT_REF:deploymentCommit,BG_RELEASE_COMMIT:deploymentCommit};
  const start=Date.now();
  const result=spawnSync(process.execPath,['tools/site-shell/restamp-release-evidence.mjs'],{stdio:'inherit',env});
  console.log('NETLIFY_BUILD_STEP',JSON.stringify({label:'prebuilt-release-restamp',elapsed_ms:Date.now()-start,status:result.status}));
  if(result.error) throw result.error;
  process.exit(result.status ?? 0);
}

for(const [label,script,...args] of steps) runNode(label,script,...args);
