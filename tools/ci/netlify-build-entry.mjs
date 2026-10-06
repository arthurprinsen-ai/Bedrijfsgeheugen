import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { restampReleaseIdentity } from '../site-shell/restamp-release-identity.mjs';

const PREBUILT_MARKER = '.bg-prebuilt-deploy.json';
const PREBUILT_MANIFEST = '.bg-prebuilt-manifest.json';
const HEX40 = /^[0-9a-f]{40}$/i;

const phases = Object.freeze([
  ['pricing-capture','tools/site-shell/pricing-build-integrity.mjs','capture'],
  ['bedrijfslek-capture','tools/site-shell/bedrijfslek-build-integrity.mjs','capture'],
  ['powerhouse-auth','tools/bouw-powerhouse-auth.mjs'],
  ['kennisindex','tools/bouw-kennisindex.mjs'],
  ['v18-production','tools/bouw-v18-production.mjs'],
  ['product-led-home','tools/site-shell/apply-product-led-home.mjs'],
  ['tabbladen','tools/apply-tabbladen.mjs'],
  ['v18-views','tools/bouw-v18-views.mjs'],
  ['v18-chrome','tools/bouw-v18-chrome-alles.mjs'],
  ['homepage-pricing-cleanup','tools/prijzen-uit-de-homepage.mjs'],
  ['site-ui','tools/normaliseer-site-ui.mjs'],
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
]);

async function runPrebuiltReuse() {
  let marker;
  let manifest;
  try {
    marker=JSON.parse(await readFile(PREBUILT_MARKER,'utf8'));
    manifest=JSON.parse(await readFile(PREBUILT_MANIFEST,'utf8'));
  } catch (error) {
    throw new Error(`NETLIFY_PREBUILT_METADATA_INVALID: ${error?.message||error}`);
  }
  const commitRef=String(marker?.commit_ref||'').trim();
  const treeSha=String(marker?.tree_sha||'').trim();
  if(!HEX40.test(commitRef)||!HEX40.test(treeSha)) throw new Error('NETLIFY_PREBUILT_IDENTITY_INVALID');
  if(manifest?.contract!=='NETLIFY_PREBUILT_ARTIFACT_V1') throw new Error('NETLIFY_PREBUILT_CONTRACT_INVALID');
  if(String(manifest?.source_tree_sha||'')!==treeSha) throw new Error('NETLIFY_PREBUILT_TREE_MISMATCH');
  const context=String(process.env.CONTEXT||'').trim();
  const deployId=String(process.env.DEPLOY_ID||'').trim();
  if(context!=='production') throw new Error(`NETLIFY_PREBUILT_CONTEXT_INVALID:${context||'missing'}`);
  if(!deployId) throw new Error('NETLIFY_PREBUILT_DEPLOY_ID_MISSING');

  const result=await restampReleaseIdentity({root:process.cwd(),commitRef,context,deployId});
  await rm(PREBUILT_MARKER,{force:true});
  await rm(PREBUILT_MANIFEST,{force:true});
  console.log('NETLIFY_PREBUILT_REUSE',JSON.stringify({
    commit_ref:commitRef,
    tree_sha:treeSha,
    source_head_sha:manifest.source_head_sha||null,
    artifact_id:marker.artifact_id||null,
    source_run_id:marker.source_run_id||null,
    release_files:result.files,
  }));
}

async function runFullBuild() {
  const started=Date.now();
  const timings=[];
  for(const [name,script,...args] of phases) {
    const phaseStarted=Date.now();
    const result=spawnSync(process.execPath,[script,...args],{
      cwd:process.cwd(),
      env:process.env,
      stdio:'inherit',
    });
    const elapsed_ms=Date.now()-phaseStarted;
    timings.push({name,script,args,elapsed_ms,status:result.status});
    if(result.error) throw result.error;
    if(result.status!==0) throw new Error(`NETLIFY_BUILD_PHASE_FAILED:${name}:${result.status}`);
  }
  const profile={
    contract:'NETLIFY_BUILD_PROFILE_V1',
    commit_ref:String(process.env.COMMIT_REF||process.env.GITHUB_SHA||''),
    context:String(process.env.CONTEXT||''),
    total_ms:Date.now()-started,
    phases:timings,
    generated_at:new Date().toISOString(),
  };
  const profilePath=String(process.env.NETLIFY_BUILD_PROFILE_PATH||'').trim();
  if(profilePath) {
    await mkdir(path.dirname(profilePath),{recursive:true});
    await writeFile(profilePath,`${JSON.stringify(profile,null,2)}\n`);
  }
  console.log('NETLIFY_BUILD_PROFILE',JSON.stringify(profile));
}

try {
  await readFile(PREBUILT_MARKER,'utf8');
  await runPrebuiltReuse();
} catch (error) {
  if(error?.code==='ENOENT') await runFullBuild();
  else throw error;
}
