import { glob, readFile, writeFile } from 'node:fs/promises';
import { ensureReleaseMarker } from './release-marker.mjs';
import { resolveReleaseCommitRef } from './release-source-identity.mjs';

let sourceMarker='';
try { sourceMarker=await readFile('.bg-source-commit','utf8'); } catch (error) {
  if(error?.code!=='ENOENT') throw error;
}
const commitRef=resolveReleaseCommitRef({env:process.env,markerText:sourceMarker});
let files=0;
for await (const file of glob('**/*.html')){
  if(file.startsWith('node_modules/')||file.startsWith('.git/')||file.startsWith('.netlify/')||file.startsWith('.cache/')) continue;
  let html;
  try { html=await readFile(file,'utf8'); } catch { continue; }
  if(!/<html\b/i.test(html)||!/<\/head>/i.test(html)) continue;
  const next=ensureReleaseMarker(html,commitRef);
  if(next!==html){ await writeFile(file,next,'utf8'); files++; }
}
const evidence={
  contract:'BRAIN-DELIVERY-v2',
  production_authority:'BG169',
  commit_ref:commitRef,
  context:String(process.env.CONTEXT||''),
  deploy_id:String(process.env.DEPLOY_ID||''),
  generated_at:new Date().toISOString(),
  prebuilt_reuse:true,
};
await writeFile('release.json',`${JSON.stringify(evidence,null,2)}\n`);
console.log('RELEASE_PREBUILT_RESTAMP',JSON.stringify({commit_ref:commitRef,files,deploy_id:evidence.deploy_id,context:evidence.context}));
