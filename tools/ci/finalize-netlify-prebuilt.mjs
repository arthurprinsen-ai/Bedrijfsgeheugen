import { glob, readFile, writeFile } from 'node:fs/promises';
import { ensureReleaseMarker } from '../site-shell/release-marker.mjs';

const SHA_RE=/^[a-f0-9]{40}$/i;
const commitRef=String(await readFile('.bg-source-commit','utf8')).trim().toLowerCase();
if(!SHA_RE.test(commitRef)) throw new Error('PREBUILT_RELEASE_SOURCE_IDENTITY_INVALID');

const manifest=JSON.parse(await readFile('.bg-prebuilt-manifest.json','utf8'));
if(manifest.contract!=='bedrijfsgeheugen-netlify-prebuilt-v1') throw new Error('PREBUILT_RELEASE_CONTRACT_INVALID');
if(String(manifest.promotion_sha||'').toLowerCase()!==commitRef) throw new Error('PREBUILT_PROMOTION_SHA_MISMATCH');

let releaseStamped=0;
for await (const file of glob('**/*.html')) {
  if(file.startsWith('node_modules/')||file.startsWith('.git/')||file.startsWith('dist/')||file.startsWith('.netlify/')) continue;
  let html;
  try { html=await readFile(file,'utf8'); } catch { continue; }
  if(!/<html\b/i.test(html)||!/<\/head>/i.test(html)) continue;
  const next=ensureReleaseMarker(html,commitRef);
  if(next!==html){
    await writeFile(file,next,'utf8');
    releaseStamped++;
  }
}

const evidence={
  contract:'BRAIN-DELIVERY-v2',
  production_authority:'BG169',
  commit_ref:commitRef,
  context:String(process.env.CONTEXT||'production'),
  deploy_id:String(process.env.DEPLOY_ID||''),
  generated_at:new Date().toISOString(),
  prebuilt:true,
  prebuilt_source_tree:String(manifest.source_tree_sha||''),
  prebuilt_candidate_sha:String(manifest.candidate_sha||''),
};
if(evidence.context==='production' && !evidence.deploy_id) throw new Error('PREBUILT_NETLIFY_DEPLOY_ID_MISSING');
await writeFile('release.json',JSON.stringify(evidence,null,2)+'\n');
console.log('NETLIFY_PREBUILT_FINALIZED',JSON.stringify({commit_ref:commitRef,files:releaseStamped,deploy_id:evidence.deploy_id,tree:evidence.prebuilt_source_tree}));
