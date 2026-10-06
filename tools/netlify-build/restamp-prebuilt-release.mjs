import { readFile, writeFile, glob, unlink } from 'node:fs/promises';
import { ensureReleaseMarker } from '../site-shell/release-marker.mjs';

const markerPath='.bg-prebuilt-artifact.json';
const sourcePath='.bg-source-commit';
const marker=JSON.parse(await readFile(markerPath,'utf8'));
const sourceCommit=(await readFile(sourcePath,'utf8')).trim();
const expected=String(process.env.COMMIT_REF||process.env.GITHUB_SHA||process.env.BG_RELEASE_COMMIT||marker.expected_commit_sha||'').trim();

if(!/^[0-9a-f]{40}$/i.test(String(marker.source_tree_sha||''))) throw new Error('PREBUILT_SOURCE_TREE_INVALID');
if(!/^[0-9a-f]{40}$/i.test(expected)) throw new Error('PREBUILT_EXPECTED_COMMIT_INVALID');
if(sourceCommit!==expected) throw new Error(`PREBUILT_COMMIT_MARKER_MISMATCH:${sourceCommit}:${expected}`);
if(marker.expected_commit_sha && marker.expected_commit_sha!==expected) throw new Error(`PREBUILT_EXPECTED_COMMIT_MISMATCH:${marker.expected_commit_sha}:${expected}`);

let stamped=0;
for await (const file of glob('**/*.html')){
  if(file.startsWith('node_modules/')||file.startsWith('.git/')||file.startsWith('dist/')||file.startsWith('.netlify/')) continue;
  let html;
  try{html=await readFile(file,'utf8')}catch{continue}
  if(!/<html\b/i.test(html)||!/<\/head>/i.test(html)) continue;
  const next=ensureReleaseMarker(html,expected);
  if(next!==html){await writeFile(file,next,'utf8');stamped++;}
}
const evidence={
  contract:'BRAIN-DELIVERY-v2',
  production_authority:'BG169',
  commit_ref:expected,
  context:String(process.env.CONTEXT||''),
  deploy_id:String(process.env.DEPLOY_ID||''),
  generated_at:new Date().toISOString(),
  reused_prebuilt_tree:String(marker.source_tree_sha),
};
await writeFile('release.json',`${JSON.stringify(evidence,null,2)}\n`);
await unlink(markerPath);
console.log('PREBUILT_RELEASE_RESTAMPED',JSON.stringify({commit_ref:expected,files:stamped,source_tree_sha:marker.source_tree_sha}));
