// CI-only, fail-closed fence. Do not infer canonical production identity
// from DNS or a matching HTML marker. Compare TWO live provider manifests.
const CANONICAL='https://www.bedrijfsgeheugen.nl';
const SHA=/^[0-9a-f]{40}$/;
const DEPLOY=/^[0-9a-f]{24}$/;

export async function verifyPortalCanonicalBrowserRelease({
 immutableUrl,expectedSha,expectedDeployId,fetchImpl=globalThis.fetch
}={}){
 const immutable='https://'+expectedDeployId+'--bedrijfsgeheugen.netlify.app';
 if(!SHA.test(String(expectedSha||''))||!DEPLOY.test(String(expectedDeployId||''))||
   immutableUrl!==immutable)
   throw Error('PORTAL_BROWSER_RELEASE_IDENTITY_INPUT_INVALID');
 async function read(base){
   const url=base+'/release.json?browser_release_fence='+expectedSha;
   const res=await fetchImpl(url,{headers:{'cache-control':'no-cache',accept:'application/json'},
     signal:AbortSignal.timeout(15000),cache:'no-store'});
   if(!res?.ok||res.status!==200)
     throw Error('PORTAL_BROWSER_RELEASE_MANIFEST_NOT_HTTP_200');
   const body=await res.json();
   if(!body||body.contract!=='BRAIN-DELIVERY-v2'||body.context!=='production'||
      body.commit_ref!==expectedSha||body.deploy_id!==expectedDeployId)
     throw Error('PORTAL_BROWSER_RELEASE_SHA_OR_DEPLOY_MISMATCH');
 }
 await read(immutable);
 await read(CANONICAL);
 return Object.freeze({browserUrl:CANONICAL,sha:expectedSha,deployId:expectedDeployId,independentManifests:2});
}
if(process.argv.includes('--verify')){
 try{
  const result=await verifyPortalCanonicalBrowserRelease({
   immutableUrl:process.env.PORTAL_READBACK_URL,
   expectedSha:process.env.PORTAL_EXPECTED_SHA,
   expectedDeployId:process.env.NETLIFY_DEPLOY_ID
  });
  console.log('PORTAL_CANONICAL_BROWSER_RELEASE_PINNED',JSON.stringify(result));
 }catch(error){
  console.error('PORTAL_CANONICAL_BROWSER_RELEASE_UNVERIFIED',error.message);
  process.exitCode=1;
 }
}
