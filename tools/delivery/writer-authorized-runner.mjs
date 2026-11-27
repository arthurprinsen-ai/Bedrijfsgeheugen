import { createGitHubWriterAdapter, createSupabaseLeaseVerifier } from './writer-real-adapters.mjs';
import { resolveReviewedEpoch } from './reviewed-epoch.mjs';
import { integrateHandoffAfterLease } from './writer-handoff-integration.mjs';
export async function runAuthorizedWriterHandoff({
 owner,repo,githubToken,authorizedPgQuery,manifest,approvedPaths,
 holder,expectedHead,expectedBase,expectedBranch,ttlSeconds=180,fetchImpl
}) {
 if(typeof authorizedPgQuery!=='function'||!holder||!manifest||!Array.isArray(approvedPaths))throw Error('AUTHORIZED_WRITER_CONTEXT_REQUIRED');
 if(!Number.isInteger(ttlSeconds)||ttlSeconds<1||ttlSeconds>300)throw Error('INVALID_LEASE_TTL');
 const github=createGitHubWriterAdapter({owner,repo,token:githubToken,fetchImpl});
 const current=await github.readPR(manifest.prNumber);
 if(!current.open||current.headSha!==expectedHead||current.baseSha!==expectedBase||current.branch!==expectedBranch)throw Error('WRITER_CANDIDATE_IDENTITY_DRIFT');
 if(await github.readHead('main')!==expectedBase)throw Error('MAIN_EPOCH_DRIFT');
 if(manifest.expectedHead!==expectedHead||manifest.expectedBase!==expectedBase||manifest.branch!==expectedBranch)throw Error('HANDOFF_IDENTITY_DRIFT');
 const leaseRows=await authorizedPgQuery('select token, valid_until from writer_control.acquire($1,$2,$3,$4,$5,$6)',
 [manifest.obligation,holder,expectedBranch,expectedHead,expectedBase,ttlSeconds]);
 const token=Number(leaseRows?.[0]?.token);
 if(!Number.isSafeInteger(token)||token<1)throw Error('ACQUIRE_NOT_CONFIRMED');
 const database=createSupabaseLeaseVerifier({query:authorizedPgQuery});
 try {
   return await integrateHandoffAfterLease({manifest,writer:{obligation:manifest.obligation,holder,token},github,database,approvedPaths});
 } finally {
   const rows=await authorizedPgQuery('select writer_control.release($1,$2,$3) as released',[manifest.obligation,holder,token]);
   if(rows?.[0]?.released!==true)throw Error('WRITER_LEASE_RELEASE_NOT_CONFIRMED');
 }
}

// Existing writer's native read-only preflight for reviewed v2. Does not acquire
// a lease or publish; a separate protected consumer must establish exact CAS.
export async function preflightReviewedWriterHandoff({
 owner,repo,githubToken,manifest,manifestBytes,policy,policyBytes,
 invocationSha,checkoutSha,fetchImpl
}){
 if(typeof policyBytes!=='string'||JSON.stringify(JSON.parse(policyBytes))!==JSON.stringify(policy))throw Error('POLICY_BYTES_MISMATCH');
 const github=createGitHubWriterAdapter({owner,repo,token:githubToken,fetchImpl});
 // Re-read immutable protected checkout bytes independently from the provider.
 const [nativeManifest,nativePolicy]=await Promise.all([
   github.readFile('config/brain-writer-approved-handoff.json',invocationSha),
   github.readFile('config/brain-writer-approved-paths.json',invocationSha)
 ]);
 if(nativeManifest!==manifestBytes||nativePolicy!==policyBytes)throw Error('PROTECTED_REVIEW_BYTES_MISMATCH');
 return resolveReviewedEpoch({manifest,manifestBytes,policy,invocationSha,checkoutSha,
   readMain:()=>github.readHead('main'),readPR:n=>github.readReviewedPR(n),
   readFile:(p,ref)=>github.readFile(p,ref),verifyAncestor:(a,b)=>github.verifyReviewedAncestor(a,b)});
}
