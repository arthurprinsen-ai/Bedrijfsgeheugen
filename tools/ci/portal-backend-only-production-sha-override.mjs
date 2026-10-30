// CI-only protected-readback source drift gate. Retain immutable Netlify SHA,
// and permit only independently classified non-Netlify backend diffs on main.
import {execFileSync} from 'node:child_process';
import {deriveNetlifyDeploymentApplicability} from '../delivery/netlify-deployment-applicability.mjs';
import policy from '../../config/brain-delivery-system.json' with {type:'json'};

const GOVERNANCE_EXACT=new Set([
  'supabase/functions/netlify-deploy-bridge/index.ts',
  'brain/skills/powerhouse-portal-dom-bridge-only-override-v1.json',
  'platform/system-map/canonical-system-map.mjs'
]);
const governance=p=>GOVERNANCE_EXACT.has(p) ||
  ['.github/workflows/','tests/','docs/','brain/learning/','tools/ci/'].some(prefix=>p.startsWith(prefix));
const backend=p=>/^supabase\/migrations\/[a-zA-Z0-9_-]+\.sql$/.test(p) ||
  /^supabase\/functions\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+\.(?:ts|mjs|js|json)$/.test(p);
const valid=p=>typeof p==='string'&&p&&!p.includes('..')&&!p.includes('\\')&&!p.includes('\0')&&!p.startsWith('/');
const sha=p=>/^[a-f0-9]{40}$/.test(String(p||''));

export function verifyBackendOnlyPublishedPortalOverride(changedPaths,{
  classify=paths=>deriveNetlifyDeploymentApplicability({changedPaths:paths,headSha:'a'.repeat(40),policy})
}={}){
  if(!Array.isArray(changedPaths)||changedPaths.some(p=>!valid(p))||
    new Set(changedPaths).size!==changedPaths.length)
    throw Error('PORTAL_PUBLISHED_SOURCE_DIFF_MALFORMED');
  const unexpected=changedPaths.filter(p=>!governance(p)&&!backend(p));
  if(unexpected.length) throw Error('PORTAL_PUBLISHED_SOURCE_DRIFT_BLOCKED:'+unexpected.join(','));
  const backendOnly=changedPaths.filter(p=>backend(p)&&!governance(p));
  if(backendOnly.length){
    // New code may not redefine its own trusted classifier while asserting
    // that backend changes leave Netlify/Portal browser source unaffected.
    if(changedPaths.some(p=>p.startsWith('tools/delivery/')||p==='config/brain-delivery-system.json'))
      throw Error('PORTAL_PUBLISHED_CLASSIFIER_CHANGED');
    const applicability=classify(changedPaths);
    if(!applicability||applicability.deploymentRequired!==false||
      applicability.websiteRequired!==false||applicability.portalRequired!==false||
      applicability.browserRequired!==false||applicability.netlifyRuntimeRequired!==false||
      !Array.isArray(applicability.deliveryLanes)||
      applicability.deliveryLanes.some(lane=>lane!=='backend'))
      throw Error('PORTAL_PUBLISHED_BACKEND_NETLIFY_IMPACT_UNVERIFIED');
  }
  return Object.freeze({status:'PROVEN_NON_NETLIFY_SOURCE_DIFF',changedFiles:changedPaths.length,
    allowedBackendFiles:backendOnly.length,requiresIndependentExactImmutableAndPublicManifest:true});
}

if(process.argv.includes('--verify')){
  try{
    const published=process.env.PORTAL_EXPECTED_SHA,main=process.env.GITHUB_SHA;
    if(!sha(published)||!sha(main))throw Error('PORTAL_PUBLISHED_SOURCE_SHAS_INVALID');
    // Exact ancestor relation is separately enforced by the existing workflow.
    const changed=execFileSync('git',['diff','--name-only','-z',published,main],
      {encoding:'utf8'}).split('\0').filter(Boolean);
    const result=verifyBackendOnlyPublishedPortalOverride(changed);
    console.log('PORTAL_PUBLISHED_SOURCE_SCOPE_VALIDATED',JSON.stringify(result));
  }catch(error){
    console.error('PORTAL_PUBLISHED_SOURCE_SCOPE_REJECTED',error.message);
    process.exitCode=1;
  }
}
