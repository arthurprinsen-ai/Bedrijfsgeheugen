// Standalone review-time validation proposal. Does not grant authority or write.
import { createHash } from 'node:crypto';
const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const hash=s=>createHash('sha256').update(s).digest('hex');
const fail=code=>{throw new Error(code)};
export async function resolveReviewedEpoch({manifest,manifestBytes,policy,invocationSha,checkoutSha,readMain,readPR,readFile,verifyAncestor}) {
  // Values and manifest bytes must come from the trusted protected-main checkout,
  // never from a PR or untrusted dispatch input. This module is not that trust boundary.
  if(!SHA.test(invocationSha||'')||checkoutSha!==invocationSha)fail('UNTRUSTED_EXECUTION_REVISION');
  if(typeof manifestBytes!=='string'||JSON.stringify(JSON.parse(manifestBytes))!==JSON.stringify(manifest))fail('MANIFEST_BYTES_MISMATCH');
  if(manifest?.contract!=='brain-writer-patch-handoff-v2'||policy?.contract!=='brain-writer-approved-paths-v1')fail('INVALID_CONTRACT');
  if(!SHA.test(manifest.expectedHead||'')||!SHA.test(manifest.expectedBase||'')||!SHA.test(manifest.reviewedMainSha||'')||!Number.isSafeInteger(manifest.prNumber)||manifest.prNumber<1||!manifest.obligation||!manifest.branch)fail('INVALID_IDENTITY');
  if(!Array.isArray(policy.paths)||!policy.paths.length||new Set(policy.paths).size!==policy.paths.length||!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>20)fail('INVALID_SCOPE');
  const verifyIdentity=async()=>{
    const pr=await readPR(manifest.prNumber);
    if(!pr?.open||pr.headSha!==manifest.expectedHead||pr.baseSha!==manifest.expectedBase||pr.branch!==manifest.branch||pr.obligation!==manifest.obligation)fail('CANDIDATE_IDENTITY_DRIFT');
    if(await readMain()!==invocationSha)fail('MAIN_EPOCH_DRIFT');
  };
  await verifyIdentity();
  if(await verifyAncestor(manifest.reviewedMainSha,invocationSha)!==true)fail('REVIEWED_MAIN_NOT_ANCESTOR');
  const seen=new Set();
  for(const f of manifest.files){
    const p=f.path;
    if(typeof p!=='string'||!p||p.startsWith('/')||p.includes('\\')||p.split('/').some(x=>!x||x==='.'||x==='..')||p.startsWith('.git/')||p.startsWith('.github/workflows/')||p.startsWith('supabase/migrations/')||p==='supabase/migration-history.lock.json'||p.startsWith('config/brain-writer-approved-')||!policy.paths.includes(p)||seen.has(p))fail('PATH_NOT_APPROVED');
    seen.add(p);
    if(![f.expectedMainSha256,f.expectedOldSha256,f.contentSha256].every(v=>HASH.test(v||''))||typeof f.content!=='string'||hash(f.content)!==f.contentSha256)fail('INVALID_PATCH_DIGEST');
    const reviewed=await readFile(p,manifest.reviewedMainSha), current=await readFile(p,invocationSha), old=await readFile(p,manifest.expectedHead);
    if(typeof reviewed!=='string'||typeof current!=='string'||hash(reviewed)!==f.expectedMainSha256||hash(current)!==f.expectedMainSha256)fail('APPROVED_MAIN_SOURCE_DRIFT');
    if(typeof old!=='string'||hash(old)!==f.expectedOldSha256)fail('CANDIDATE_SOURCE_DRIFT');
  }
  await verifyIdentity();
  return Object.freeze({obligation:manifest.obligation,branch:manifest.branch,headSha:manifest.expectedHead,prBaseSha:manifest.expectedBase,executionMainSha:invocationSha,manifestSha256:hash(manifestBytes),writeAuthorized:false});
}
