import { publishThroughExistingWriter } from './writer-patch-handoff.mjs';
export async function integrateHandoffAfterLease({manifest,writer,github,database,approvedPaths}){
  if(!writer||!github||!database||!Array.isArray(approvedPaths))throw Error('TRUSTED_WRITER_CONTEXT_REQUIRED');
  if(writer.obligation!==manifest?.obligation||!writer.holder||!Number.isSafeInteger(writer.token))throw Error('WRITER_IDENTITY_MISMATCH');
  for(const key of ['readPR','readFile','applyExpectedHeadCas','readHead'])if(typeof github[key]!=='function')throw Error('MISSING_GITHUB_ADAPTER:'+key);
  if(typeof database.verifyLease!=='function')throw Error('MISSING_DB_VERIFIER');
  const pr=await github.readPR(manifest.prNumber);
  const leaseCheck=async()=> {
    const valid=await database.verifyLease({obligation:writer.obligation,holder:writer.holder,token:writer.token,branch:pr.branch,head:pr.headSha,main:pr.baseSha});
    return valid===true?{verified:true,generation:writer.token,headSha:pr.headSha}:null;
  };
  const published=await publishThroughExistingWriter({
    manifest,pr,allowedPaths:approvedPaths,readFile:(path)=>github.readFile(path,pr.headSha),verifyLease:leaseCheck,
    applyCas:async({expectedHead,leaseGeneration,writes})=>{
      if(leaseGeneration!==writer.token||!(await leaseCheck()))throw Error('LEASE_LOST_BEFORE_CAS');
      const current=await github.readPR(pr.number);
      if(current.headSha!==expectedHead||current.baseSha!==pr.baseSha||current.branch!==pr.branch)throw Error('PR_DRIFT_BEFORE_CAS');
      const result=await github.applyExpectedHeadCas({prNumber:pr.number,branch:pr.branch,expectedHead,writes});
      if(result?.applied!==true||!result.newHead)throw Error('PROVIDER_CAS_REJECTED');
      if(await github.readHead(pr.branch)!==result.newHead)throw Error('GITHUB_READBACK_MISMATCH');
      return result;
    }
  });
  return {...published,releaseGate:'FULL_BRAIN_REQUIRED',mergeAuthorized:false,productionVerified:false};
}
