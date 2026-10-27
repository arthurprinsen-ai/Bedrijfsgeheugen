import { createHash } from 'node:crypto';
import { posix as path } from 'node:path';
const SHA=/^[0-9a-f]{40}$/;
const HASH=/^[0-9a-f]{64}$/;
const OMIT=['.git/','.github/workflows/','supabase/migrations/','supabase/migration-history.lock.json'];
const sha256=x=>createHash('sha256').update(x).digest('hex');
export function verifyHandoffManifest(manifest,{pr,allowedPaths=[]}={}) {
 if(!manifest||manifest.contract!=='brain-writer-patch-handoff-v1')throw Error('INVALID_HANDOFF_CONTRACT');
 if(!pr||!Number.isSafeInteger(pr.number)||!SHA.test(pr.headSha)||!SHA.test(pr.baseSha))throw Error('INVALID_TRUSTED_PR');
 if(manifest.prNumber!==pr.number||manifest.expectedHead!==pr.headSha||manifest.expectedBase!==pr.baseSha||manifest.branch!==pr.branch)throw Error('STALE_CANDIDATE');
 if(!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>20)throw Error('INVALID_FILE_COUNT');
 const seen=new Set();
 for(const file of manifest.files){
   if(typeof file.path!=='string'||file.path.startsWith('/')||file.path.includes('\\')||file.path.split('/').includes('..')||path.normalize(file.path)!==file.path)throw Error('UNSAFE_PATH');
   if(OMIT.some(p=>file.path===p||file.path.startsWith(p)))throw Error('PROTECTED_PATH');
   if(!allowedPaths.includes(file.path))throw Error('PATH_NOT_IN_APPROVED_SCOPE');
   if(seen.has(file.path))throw Error('DUPLICATE_PATH');seen.add(file.path);
   if(!HASH.test(file.contentSha256)||!HASH.test(file.expectedOldSha256))throw Error('INVALID_CONTENT_DIGEST');
 }
 return Object.freeze({prNumber:pr.number,headSha:pr.headSha,files:manifest.files.length,manifestSha256:sha256(JSON.stringify(manifest))});
}
export async function publishThroughExistingWriter({manifest,pr,allowedPaths,readFile,verifyLease,applyCas}){
 const verified=verifyHandoffManifest(manifest,{pr,allowedPaths});
 if(typeof verifyLease!=='function'||typeof applyCas!=='function'||typeof readFile!=='function')throw Error('TRUSTED_WRITER_ADAPTER_REQUIRED');
 const lease=await verifyLease({obligation:manifest.obligation,headSha:pr.headSha,baseSha:pr.baseSha,branch:pr.branch});
 if(!lease||lease.verified!==true||lease.headSha!==pr.headSha||!Number.isSafeInteger(lease.generation)||lease.generation<1)throw Error('EXCLUSIVE_LEASE_NOT_VERIFIED');
 const writes=[];
 for(const file of manifest.files){
   const old=await readFile(file.path);
   if(typeof old!=='string'||sha256(old)!==file.expectedOldSha256)throw Error('SOURCE_DRIFT:'+file.path);
   if(typeof file.content!=='string'||sha256(file.content)!==file.contentSha256)throw Error('PATCH_INTEGRITY_FAILED:'+file.path);
   writes.push({path:file.path,content:file.content});
 }
 const result=await applyCas({expectedHead:pr.headSha,leaseGeneration:lease.generation,obligation:manifest.obligation,writes});
 if(!result||result.applied!==true||!SHA.test(result.newHead)||result.newHead===pr.headSha)throw Error('CAS_PUBLICATION_NOT_VERIFIED');
 return {...verified,newHead:result.newHead,leaseGeneration:lease.generation,status:'PUBLISHED_PENDING_FULL_BRAIN'};
}
export {sha256 as contentSha256};
