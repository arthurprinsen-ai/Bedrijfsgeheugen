import { getStore } from '@netlify/blobs';
import { getUser,verifyRequestOrigin } from '@netlify/identity';
import { readPortalState,writePortalState } from './_portal-state-store.mjs';
const STORE_NAME='portal-canonical-state';const MAX_BYTES=1500000;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export default async function portalState(request){const user=await getUser();if(!user?.id)return json({error:'UNAUTHORIZED'},401);const store=getStore({name:STORE_NAME,consistency:'strong'});if(request.method==='GET'){const record=await readPortalState(store,user.id);return record?json(record):json({error:'NOT_FOUND'},404)}if(request.method==='PUT'){try{verifyRequestOrigin(request)}catch{return json({error:'FORBIDDEN_ORIGIN'},403)}const declared=Number(request.headers.get('content-length')||0);if(declared>MAX_BYTES)return json({error:'PAYLOAD_TOO_LARGE'},413);const raw=await request.text();if(raw.length>MAX_BYTES)return json({error:'PAYLOAD_TOO_LARGE'},413);let body;try{body=JSON.parse(raw)}catch{return json({error:'INVALID_JSON'},400)};try{const record=await writePortalState(store,user.id,body?.state??body);return json(record)}catch(error){return json({error:'INVALID_STATE',message:String(error?.message||error)},400)}}return new Response(null,{status:405,headers:{allow:'GET, PUT','cache-control':'no-store'}})}
export const config={path:'/api/portal-state'};
