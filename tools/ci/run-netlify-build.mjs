import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';

const startedAt=new Date().toISOString();
const started=performance.now();
const routeWorkers=Math.max(1,Math.min(4,Number(process.env.STATIC_I18N_ROUTE_WORKERS||2)||2));
process.env.STATIC_I18N_ROUTE_WORKERS=String(routeWorkers);

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
  ['prijzen-homepage','tools/prijzen-uit-de-homepage.mjs'],
  ['normaliseer-site-ui','tools/normaliseer-site-ui.mjs'],
  ['pricing-restore','tools/site-shell/pricing-build-integrity.mjs','restore'],
  ['bedrijfslek-restore','tools/site-shell/bedrijfslek-build-integrity.mjs','restore'],
  ['seo-apply','tools/seo-order-engine/apply.mjs'],
  ['seo-validate','tools/seo-order-engine/validate.mjs'],
  ['apply-i18n','tools/site-shell/apply-i18n.mjs'],
  ['localized-routes','tools/site-shell/build-localized-routes.mjs'],
  ['commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs'],
  ['revenue-links','tools/seo-order-engine/apply-revenue-links.mjs'],
  ['website-coherence','tools/site-shell/finalize-website-coherence-v1.mjs'],
  ['cms-runtime','tools/site-shell/apply-cms-runtime.mjs'],
  ['sitemap','tools/genereer-sitemap.mjs'],
  ['seo-locales','tools/seo-order-engine/validate-locales.mjs'],
  ['release-evidence','tools/bouw-release-evidence.mjs'],
];

const profile={
  version:'NETLIFY_BUILD_PROFILE_V1',
  commit_ref:String(process.env.COMMIT_REF||''),
  context:String(process.env.CONTEXT||''),
  deploy_id:String(process.env.DEPLOY_ID||''),
  route_workers:routeWorkers,
  started_at:startedAt,
  steps:[],
  status:'running'
};

const profilePath=String(process.env.NETLIFY_BUILD_PROFILE_PATH||join(mkdtempSync(join(tmpdir(),'bg-netlify-profile-')),'netlify-build-profile.json'));
mkdirSync(dirname(profilePath),{recursive:true});
const persist=()=>{
  profile.duration_ms=Math.round(performance.now()-started);
  writeFileSync(profilePath,JSON.stringify(profile,null,2)+'\n');
};

try{
  for(const [id,script,...args] of steps){
    const stepStart=performance.now();
    console.log(`NETLIFY_BUILD_STEP_START ${id}`);
    try{
      execFileSync(process.execPath,[script,...args],{stdio:'inherit',env:process.env});
    }catch(error){
      const durationMs=Math.round(performance.now()-stepStart);
      profile.steps.push({id,script,args,duration_ms:durationMs,status:'failed'});
      profile.status='failed';
      profile.failed_step=id;
      profile.finished_at=new Date().toISOString();
      persist();
      console.error(`NETLIFY_BUILD_STEP_FAILED ${id} ${durationMs}ms`);
      throw error;
    }
    const durationMs=Math.round(performance.now()-stepStart);
    profile.steps.push({id,script,args,duration_ms:durationMs,status:'success'});
    console.log(`NETLIFY_BUILD_STEP_DONE ${id} ${durationMs}ms`);
  }
  profile.status='success';
  profile.finished_at=new Date().toISOString();
  persist();
  console.log('NETLIFY_BUILD_PROFILE',JSON.stringify({duration_ms:profile.duration_ms,route_workers:routeWorkers,steps:profile.steps.map(x=>[x.id,x.duration_ms])}));
}catch(error){
  if(profile.status!=='failed'){
    profile.status='failed';
    profile.finished_at=new Date().toISOString();
    persist();
  }
  throw error;
}
