// Staging proof only: no status, ref, permission, or policy mutation.
// This module is not connected to the production entrypoint.
import {verifyReleaseApp} from './release-app-identity.mjs';
const ORIGIN='https://api.github.com';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const REPO_ID=1303700955;
const APP_ID=5916428;
const INSTALLATION_ID=185660155;
const need=(v,c)=>{if(v!==true)throw Error(c)};
const statusOnly=p=>p&&p.statuses==='write'&&p.metadata==='read'&&Object.keys(p).length===2;
// Provider-issued credential is opaque; only enforce safe Bearer transport syntax.
const safeToken=t=>typeof t==='string'&&/^[A-Za-z0-9._~+/-]+=*$/.test(t);
export async function proveScopedPromotionToken({appId,privateKey,fetchImpl=globalThis.fetch,now=Date.now()}){
 need(appId===APP_ID,'PROMOTION_APP_ID_UNPROVEN');
 let appAuth;
 // Reuse the reviewed identity verifier. JWT stays only in this function.
 const identity=await verifyReleaseApp({appId,privateKey,now,fetchImpl:async(url,opts)=>{
   need(url.origin===ORIGIN&&opts.method==='GET'&&opts.redirect==='error'&&['/app','/repos/'+REPO+'/installation'].includes(url.pathname),'PROMOTION_IDENTITY_REQUEST_INVALID');
   need(typeof opts.headers.Authorization==='string'&&opts.headers.Authorization.startsWith('Bearer '),'PROMOTION_APP_AUTH_UNPROVEN');
   if(appAuth!==undefined)need(opts.headers.Authorization===appAuth,'PROMOTION_APP_AUTH_CHANGED');
   appAuth=opts.headers.Authorization;
   return fetchImpl(url,opts);
 }});
 need(identity.authenticated===true&&identity.appId===APP_ID&&identity.installationId===INSTALLATION_ID&&identity.repository===REPO&&identity.mutationAuthority===false&&identity.exclusiveWriterVerified===false&&typeof appAuth==='string','PROMOTION_IDENTITY_UNPROVEN');
 const request=async(path,method,auth,body)=>{
   let res;
   try {res=await fetchImpl(new URL(path,ORIGIN),{method,redirect:'error',headers:{Authorization:auth,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}catch{throw Error('PROMOTION_TOKEN_TRANSPORT_UNPROVEN')}
   need(Number.isInteger(res?.status),'PROMOTION_TOKEN_RESPONSE_INVALID');return res;
 };
 const json=async(res)=>{try{return await res.json()}catch{throw Error('PROMOTION_TOKEN_RESPONSE_INVALID')}};
 const issued=await request('/app/installations/'+INSTALLATION_ID+'/access_tokens','POST',appAuth,{repository_ids:[REPO_ID],permissions:{statuses:'write',metadata:'read'}});
 appAuth=undefined;
 need(issued.status===201,'PROMOTION_TOKEN_ISSUANCE_UNPROVEN');
 const receipt=await json(issued);
 // An unknown or malformed issuance receipt is never retried blindly.
 const token=receipt?.token;
 need(safeToken(token),'PROMOTION_TOKEN_ISSUANCE_AMBIGUOUS');
 const tokenAuth='Bearer '+token;
 try{
   need(statusOnly(receipt.permissions)===true,'PROMOTION_TOKEN_PERMISSIONS_UNPROVEN');
   const expiry=Date.parse(receipt.expires_at);
   need(Number.isFinite(expiry)&&expiry>now&&expiry<=now+3660000,'PROMOTION_TOKEN_EXPIRY_UNPROVEN');
   const inventory=await request('/installation/repositories?per_page=100','GET',tokenAuth);
   need(inventory.status===200,'PROMOTION_TOKEN_SCOPE_READBACK_FAILED');
   const body=await json(inventory);
   need(body?.total_count===1&&Array.isArray(body.repositories)&&body.repositories.length===1&&body.repositories[0]?.id===REPO_ID&&body.repositories[0]?.full_name===REPO,'PROMOTION_TOKEN_REPOSITORY_SCOPE_UNPROVEN');
 }finally{
   const revoked=await request('/installation/token','DELETE',tokenAuth);
   need(revoked.status===204,'PROMOTION_TOKEN_REVOCATION_UNPROVEN');
   const denied=await request('/installation/repositories?per_page=100','GET',tokenAuth);
   need(denied.status===401,'PROMOTION_TOKEN_REVOCATION_READBACK_UNPROVEN');
 }
 return Object.freeze({state:'SCOPED_TOKEN_REVOKED_FENCE_UNPROVEN',appId:APP_ID,installationId:INSTALLATION_ID,repository:REPO,scopeVerified:true,revocationVerified:true,exclusiveWriterVerified:false,mutationAuthority:false});
}
