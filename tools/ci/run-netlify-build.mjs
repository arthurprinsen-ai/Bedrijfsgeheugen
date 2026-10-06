import { spawnSync } from 'node:child_process';

export const NETLIFY_BUILD_STEPS = Object.freeze([
  ['node',['tools/site-shell/pricing-build-integrity.mjs','capture']],
  ['node',['tools/site-shell/bedrijfslek-build-integrity.mjs','capture']],
  ['node',['tools/bouw-powerhouse-auth.mjs']],
  ['node',['tools/bouw-kennisindex.mjs']],
  ['node',['tools/bouw-v18-production.mjs']],
  ['node',['tools/site-shell/apply-product-led-home.mjs']],
  ['node',['tools/apply-tabbladen.mjs']],
  ['node',['tools/bouw-v18-views.mjs']],
  ['node',['tools/bouw-v18-chrome-alles.mjs']],
  ['node',['tools/prijzen-uit-de-homepage.mjs']],
  ['node',['tools/normaliseer-site-ui.mjs']],
  ['node',['tools/site-shell/pricing-build-integrity.mjs','restore']],
  ['node',['tools/site-shell/bedrijfslek-build-integrity.mjs','restore']],
  ['node',['tools/seo-order-engine/apply.mjs']],
  ['node',['tools/seo-order-engine/validate.mjs']],
  ['node',['tools/site-shell/apply-i18n.mjs']],
  ['node',['tools/site-shell/build-localized-routes.mjs']],
  ['node',['tools/site-shell/apply-commercial-pricing-v1.mjs']],
  ['node',['tools/seo-order-engine/apply-revenue-links.mjs']],
  ['node',['tools/site-shell/finalize-website-coherence-v1.mjs']],
  ['node',['tools/site-shell/apply-cms-runtime.mjs']],
  ['node',['tools/genereer-sitemap.mjs']],
  ['node',['tools/seo-order-engine/validate-locales.mjs']],
  ['node',['tools/bouw-release-evidence.mjs']],
]);

export function runNetlifyBuild({ env=process.env }={}) {
  const started=Date.now();
  const timings=[];
  for(const [command,args] of NETLIFY_BUILD_STEPS){
    const stepStarted=Date.now();
    const label=[command,...args].join(' ');
    console.log('NETLIFY_BUILD_STEP_START',label);
    const result=spawnSync(command,args,{stdio:'inherit',env});
    const durationMs=Date.now()-stepStarted;
    timings.push({label,duration_ms:durationMs,status:result.status});
    console.log('NETLIFY_BUILD_STEP_END',JSON.stringify({label,duration_ms:durationMs,status:result.status}));
    if(result.error) throw result.error;
    if(result.status!==0) {
      const error=new Error(`NETLIFY_BUILD_STEP_FAILED: ${label} status=${result.status}`);
      error.exitCode=result.status ?? 1;
      throw error;
    }
  }
  console.log('NETLIFY_BUILD_PROFILE',JSON.stringify({total_ms:Date.now()-started,steps:timings}));
  return timings;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    runNetlifyBuild();
  } catch (error) {
    console.error(error?.stack || error);
    process.exit(Number.isInteger(error?.exitCode) ? error.exitCode : 1);
  }
}
