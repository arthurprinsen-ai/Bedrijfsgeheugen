import { getUser } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const STORE_NAME='portal-feedback';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const clean=value=>String(value||'').trim();
function tenantFor(user){const configured=clean(user?.appMetadata?.tenantId||user?.app_metadata?.tenantId);return configured||user?.id?configured||`user:${user.id}`:''}

export async function handlePortalFeedback(request,{getUserImpl=getUser,getStoreImpl=getStore,now=()=>new Date().toISOString(),uuid=()=>randomUUID()}={}){
 if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
 const user=await getUserImpl();if(!user?.id)return json({error:'UNAUTHORIZED'},401);
 const tenantId=tenantFor(user);if(!tenantId)return json({error:'FORBIDDEN'},403);
 let body;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
 const text=clean(body?.text);if(!text)return json({error:'FEEDBACK_REQUIRED'},400);if(text.length>2000)return json({error:'FEEDBACK_TOO_LONG'},413);
 const context=body?.context&&typeof body.context==='object'?{page:clean(body.context.page).slice(0,120)}:{};
 const feedbackId=uuid();const createdAt=now();
 const record={feedbackId,tenantId,userId:user.id,text,context,createdAt};
 const store=getStoreImpl({name:STORE_NAME,consistency:'strong'});await store.setJSON(`${tenantId}/${createdAt}/${feedbackId}`,record,{onlyIfNew:true});
 return json({stored:true,feedbackId,createdAt},201);
}

export default request=>handlePortalFeedback(request);
export const config={path:'/api/portal-feedback'};
