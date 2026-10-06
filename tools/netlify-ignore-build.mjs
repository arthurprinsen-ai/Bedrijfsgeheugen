import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SAFE_PREFIXES=Object.freeze([
  '.agents/',
  '.github/',
  'docs/',
  'tests/',
  'supabase/',
  'brain/learning/',
  'brain/policies/',
  'tools/delivery/',
]);

const SAFE_EXACT=new Set([
  'AGENTS.md',
  'config/delivery-prevention-rules.json',
  'config/powerhouse-agent-delivery-scheduler-v1.json',
  'platform/system-map/canonical-system-map.mjs',
  'tools/brain-delivery-system.mjs',
  'tools/site-shell/verify-targeted-website-routes.mjs',
]);

function normalize(path=''){
  return String(path||'').trim().replace(/^\.\//,'');
}
export function isNetlifyBuildIrrelevantPath(path=''){
  const value=normalize(path);
  if(!value)return false;
  return SAFE_EXACT.has(value)||SAFE_PREFIXES.some(prefix=>value.startsWith(prefix));
}
export function canSkipNetlifyBuild(changedPaths=[]){
  const paths=[...new Set((changedPaths||[]).map(normalize).filter(Boolean))];
  return paths.length>0&&paths.every(isNetlifyBuildIrrelevantPath);
}
export function netlifyIgnoreDecision(env=process.env,{execFile=execFileSync}={}){
  const base=String(env.CACHED_COMMIT_REF||'').trim();
  const head=String(env.COMMIT_REF||'').trim();
  const sha=/^[0-9a-f]{40}$/i;
  if(!sha.test(base)||!sha.test(head)||base===head){
    return {skip:false,reason:'immutable-git-range-unavailable',base,head,changedPaths:[]};
  }
  try{
    const raw=execFile('git',['diff','--name-only',base,head],{encoding:'utf8'});
    const changedPaths=String(raw||'').split(/\r?\n/).map(normalize).filter(Boolean);
    const skip=canSkipNetlifyBuild(changedPaths);
    return {skip,reason:skip?'all-paths-proven-non-netlify':'netlify-impact-or-unknown-path',base,head,changedPaths};
  }catch(error){
    return {skip:false,reason:'git-diff-failed',base,head,changedPaths:[],error:String(error?.message||error)};
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const decision=netlifyIgnoreDecision();
  console.log(JSON.stringify(decision));
  process.exit(decision.skip?0:1);
}
