import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { restampReleaseIdentity } from '../site-shell/restamp-release-identity.mjs';
import { resolveFinalReleaseIdentity } from '../site-shell/release-source-identity.mjs';

const PREBUILT_MARKER = '.bg-prebuilt-deploy.json';
const PREBUILT_MANIFEST = '.bg-prebuilt-manifest.json';
const HEX40 = /^[0-9a-f]{40}$/i;

const phases = Object.freeze([
  ['portal-explanation-inventory','scripts/brain/portal-explanation-inventory.mjs','--write','--stamp-assets'],
  ['pricing-capture','tools/site-shell/pricing-build-integrity.mjs','capture'],
  ['checkout-capture','tools/site-shell/checkout-build-integrity.mjs','capture'],
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
  ['checkout-restore','tools/site-shell/checkout-build-integrity.mjs','restore'],
  ['seo-apply','tools/seo-order-engine/apply.mjs'],
  ['seo-validate','tools/seo-order-engine/validate.mjs'],
  ['i18n-assets','tools/site-shell/apply-i18n.mjs'],
  ['localized-routes','tools/site-shell/build-localized-routes.mjs'],
  ['commercial-pricing','tools/site-shell/apply-commercial-pricing-v1.mjs'],
  ['revenue-links','tools/seo-order-engine/apply-revenue-links.mjs'],
  ['website-coherence','tools/site-shell/finalize-website-coherence-v1.mjs'],
  ['daily-steering-positioning','tools/site-shell/apply-daily-steering-positioning.mjs'],
  ['cms-runtime','tools/site-shell/apply-cms-runtime.mjs'],
  ['sitemap','tools/genereer-sitemap.mjs'],
  ['locale-validation','tools/seo-order-engine/validate-locales.mjs'],
  ['checkout-final-contract','tools/site-shell/checkout-build-integrity.mjs','verify'],
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

async function runFullBuild({cacheOnlyPatch=''}={}) {
  const started=Date.now();
  const timings=[];
  // Preserve the original provider build failure *phase* even if Netlify only
  // exposes a generic build exit code in its deploy metadata.
  async function recordPhaseFailure({name,script,status,error}) {
    const failure={
      contract:'NETLIFY_BUILD_PHASE_FAILURE_V1',
      phase:name,
      script,
      exit_code:Number.isInteger(status)?status:null,
      spawn_error_code:typeof error?.code==='string'?error.code.replace(/[^A-Z0-9_]/gi,'').slice(0,48):null,
      completed:false,
      context:String(process.env.CONTEXT||'').slice(0,40),
      observed_at:new Date().toISOString(),
      phases:timings,
    };
    // Never log environment variables, connector tokens, command output, or PII.
    console.error('NETLIFY_BUILD_PHASE_FAILURE',JSON.stringify(failure));
    const profilePath=String(process.env.NETLIFY_BUILD_PROFILE_PATH||'').trim();
    if(profilePath){
      try{
        await mkdir(path.dirname(profilePath),{recursive:true});
        await writeFile(profilePath,`${JSON.stringify(failure,null,2)}\\n`);
      }catch(writeError){
        console.error('NETLIFY_BUILD_FAILURE_PROFILE_WRITE_ERROR',String(writeError?.code||'unknown').slice(0,48));
      }
    }
  }
  for(const [name,script,...args] of phases) {
    const phaseStarted=Date.now();
    const effectiveArgs = cacheOnlyPatch && name==='localized-routes' ? [...args,'--prepare-cache='+cacheOnlyPatch] : args;
    const result=spawnSync(process.execPath,[script,...effectiveArgs],{
      cwd:process.cwd(),
      env:process.env,
      stdio:'inherit',
    });
    const elapsed_ms=Date.now()-phaseStarted;
    timings.push({name,script,args,elapsed_ms,status:result.status});
    if(result.error || result.status!==0){
      await recordPhaseFailure({name,script,status:result.status,error:result.error});
      if(result.error) throw result.error;
      throw new Error(`NETLIFY_BUILD_PHASE_FAILED:${name}:${result.status}`);
    }
    if(cacheOnlyPatch && name==='localized-routes'){
      console.log('NETLIFY_I18N_CACHE_PREPARED',JSON.stringify({
        patch:cacheOnlyPatch, phaseCount:timings.length,
      }));
      return;
    }
  }
  // Publish independently observable deployment identity on normal builds too.
  const providedCommit=String(process.env.COMMIT_REF||'').trim();
  const context=String(process.env.CONTEXT||'').trim();
  const deployId=String(process.env.DEPLOY_ID||'').trim();
  // Native Netlify builds can omit COMMIT_REF; use the checked-out Git HEAD,
  // never a manually configured or stale release SHA. Fail closed otherwise.
  const gitHeadResult=spawnSync('git',['rev-parse','--verify','HEAD'],{
    cwd:process.cwd(),encoding:'utf8',timeout:5000,
  });
  const gitHead=gitHeadResult.status===0?String(gitHeadResult.stdout||'').trim():'';
  if(providedCommit && !HEX40.test(providedCommit)) throw new Error('PRODUCTION_RELEASE_COMMIT_REF_INVALID');
  // GitHub PR parity checks out a synthetic merge commit while COMMIT_REF is
  // intentionally the candidate PR head. Only native provider builds require
  // checkout HEAD equality; retain the explicit candidate identity in CI.
  if(process.env.GITHUB_ACTIONS!=='true'&&HEX40.test(providedCommit)&&HEX40.test(gitHead)&&providedCommit.toLowerCase()!==gitHead.toLowerCase()){
    throw new Error('PRODUCTION_RELEASE_GIT_HEAD_MISMATCH');
  }
  let commitRef=providedCommit||gitHead;
  if(context==='production'){
    // The earlier release-evidence phase has already resolved source identity.
    // Never overwrite that attestation with an unrelated temporary build HEAD.
    let markerText='';
    try{markerText=await readFile('.bg-source-commit','utf8');}
    catch(error){if(error?.code!=='ENOENT')throw error;}
    const releaseEvidence=JSON.parse(await readFile('release.json','utf8'));
    const originResult=spawnSync('git',['remote','get-url','origin'],{
      cwd:process.cwd(),encoding:'utf8',timeout:5000,
    });
    const remoteMainResult=spawnSync('git',['rev-parse','--verify','refs/remotes/origin/main'],{
      cwd:process.cwd(),encoding:'utf8',timeout:5000,
    });
    commitRef=resolveFinalReleaseIdentity({
      env:process.env,markerText,existingRelease:releaseEvidence,gitHead,
      gitOrigin:originResult.status===0?String(originResult.stdout||'').trim():'',
      gitRemoteMain:remoteMainResult.status===0?String(remoteMainResult.stdout||'').trim():'',
    });
    if(!deployId) throw new Error('PRODUCTION_RELEASE_DEPLOY_ID_MISSING');
    await restampReleaseIdentity({root:process.cwd(),commitRef,context,deployId});
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

// Reuse the exact production transforms up to i18n. The publisher records
// only a scoped translation patch; it never commits generated website outputs.
const prepareArg=process.argv.find(arg=>arg.startsWith('--prepare-i18n-cache='));
if(prepareArg){
  const patchName=prepareArg.slice('--prepare-i18n-cache='.length);
  await runFullBuild({cacheOnlyPatch:patchName});
}else{
  try {
    await readFile(PREBUILT_MARKER,'utf8');
    await runPrebuiltReuse();
  } catch (error) {
    if(error?.code==='ENOENT') await runFullBuild();
    else throw error;
  }
}
