// Authenticated discovery only. Does not mutate statuses, refs or protection.
import {createPrivateKey,sign} from 'node:crypto';
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const perms={statuses:'write',contents:'read',pull_requests:'read',checks:'read',administration:'read',metadata:'read'};
const positive=n=>Number.isSafeInteger(n)&&n>0;
const check=(v,c)=>{if(!v)throw Error(c)};
const validPermissions=p=>p&&Object.entries(perms).every(([k,v])=>p[k]===v)&&Object.entries(p).every(([k,v])=>perms[k]===v);
export async function verifyReleaseApp({appId,privateKey,fetchImpl=globalThis.fetch,now=Date.now()}){
 check(positive(appId)&&appId!==15368&&typeof privateKey==='string'&&privateKey.length>0,'DEDICATED_APP_CREDENTIAL_REQUIRED');
 const key=createPrivateKey(privateKey);
 check(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails.modulusLength>=2048,'APP_RSA_KEY_REQUIRED');
 const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const sec=Math.floor(now/1000),body=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iat:sec-60,exp:sec+480,iss:String(appId)});
 const jwt=body+'.'+sign('RSA-SHA256',Buffer.from(body),key).toString('base64url');
 async function api(path){
   const r=await fetchImpl(new URL(path,'https://api.github.com'),{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+jwt,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
   if(!r.ok)throw Error('APP_NATIVE_AUTH_HTTP_'+r.status);
   return r.json();
 }
 const app=await api('/app');
 check(app.id===appId&&app.owner?.login==='arthurprinsen-ai'&&app.owner?.type==='User'&&validPermissions(app.permissions),'APP_IDENTITY_OR_PERMISSIONS_UNPROVEN');
 const inst=await api('/repos/'+repo+'/installation');
 check(positive(inst.id)&&inst.app_id===appId&&inst.account?.login==='arthurprinsen-ai'&&inst.repository_selection==='selected'&&inst.suspended_at===null&&validPermissions(inst.permissions),'APP_INSTALLATION_SCOPE_UNPROVEN');
 return Object.freeze({appId,installationId:inst.id,repository:repo,authenticated:true,exclusiveWriterVerified:false,mutationAuthority:false,state:'APP_IDENTITY_VERIFIED_FENCE_UNPROVEN'});
}
