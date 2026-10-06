import path from 'node:path';
import { glob, readFile, writeFile } from 'node:fs/promises';
import { ensureReleaseMarker } from './release-marker.mjs';

const HEX40=/^[0-9a-f]{40}$/i;

export async function restampReleaseIdentity({root=process.cwd(),commitRef,context,deployId}={}) {
  const commit=String(commitRef||'').trim();
  const ctx=String(context||'').trim();
  const deploy=String(deployId||'').trim();
  if(!HEX40.test(commit)) throw new Error('RELEASE_RESTAMP_COMMIT_INVALID');
  if(!ctx) throw new Error('RELEASE_RESTAMP_CONTEXT_MISSING');
  if(!deploy) throw new Error('RELEASE_RESTAMP_DEPLOY_ID_MISSING');

  let files=0;
  for await (const rel of glob('**/*.html',{cwd:root})) {
    const file=String(rel).replace(/\\/g,'/');
    if(file.startsWith('node_modules/')||file.startsWith('.git/')||file.startsWith('dist/')||file.startsWith('.netlify/')||file.startsWith('.cache/')) continue;
    const full=path.join(root,file);
    let html;
    try { html=await readFile(full,'utf8'); } catch { continue; }
    if(!/<html\b/i.test(html)||!/<\/head>/i.test(html)) continue;
    const next=ensureReleaseMarker(html,commit);
    if(next!==html) await writeFile(full,next,'utf8');
    files++;
  }

  const evidence={
    contract:'BRAIN-DELIVERY-v2',
    production_authority:'BG169',
    commit_ref:commit,
    context:ctx,
    deploy_id:deploy,
    generated_at:new Date().toISOString(),
  };
  await writeFile(path.join(root,'release.json'),`${JSON.stringify(evidence,null,2)}\n`,'utf8');
  console.log('RELEASE_IDENTITY_RESTAMP',JSON.stringify({commit_ref:commit,context:ctx,deploy_id:deploy,files}));
  return {files,evidence};
}

if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))) {
  await restampReleaseIdentity({
    root:process.cwd(),
    commitRef:process.env.BG_PREBUILT_COMMIT_REF,
    context:process.env.CONTEXT,
    deployId:process.env.DEPLOY_ID,
  });
}
