const SECRET_KEY=/password|secret|token|authorization|api[-_]?key|client[-_]?secret/i;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

function tenantFromUser(user){return user?.tenantId||user?.app_metadata?.tenantId||user?.app_metadata?.tenant_id||null;}
function clean(value){
  if(Array.isArray(value))return value.map(clean);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).filter(([key])=>!SECRET_KEY.test(key)).map(([key,val])=>[key,clean(val)]));
}
function normalizedRequest(request){
  const rawPath=request?.path||request?.url||'/api/connectors';
  let path=rawPath;
  try{path=new URL(rawPath,'https://portal.local').pathname;}catch{}
  return {method:String(request?.method||'GET').toUpperCase(),path,body:request?.body};
}
async function requestBody(request,normalized){
  if(normalized.body!==undefined){if(typeof normalized.body==='string'){try{return JSON.parse(normalized.body);}catch{return {};}}return normalized.body||{};}
  if(typeof request?.json==='function'){try{return await request.json();}catch{return {};}}
  return {};
}

export async function handlePortalConnectorsRequest({request,user,store}={}){
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  if(!store?.configured&&store?.configured!==undefined)return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
  const tenantId=tenantFromUser(user);
  if(!tenantId)return json({error:'TENANT_NOT_CONFIGURED'},403);
  const normalized=normalizedRequest(request);
  const base='/api/connectors';
  const suffix=normalized.path.startsWith(base)?normalized.path.slice(base.length):'';
  const id=suffix.replace(/^\//,'').split('/')[0]||null;

  if(normalized.method==='GET'&&!id){
    if(typeof store?.list!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    return json(clean(await store.list(tenantId)));
  }
  if(normalized.method==='GET'&&id){
    if(typeof store?.get!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    const record=await store.get(tenantId,id);
    return record?json(clean(record)):json({error:'NOT_FOUND'},404);
  }
  if(normalized.method==='POST'&&!id){
    if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    const body=clean(await requestBody(request,normalized));
    const saved=await store.saveDraft(tenantId,{...body,state:body.state||'Draft'});
    return json(clean(saved),201);
  }
  if(normalized.method==='PUT'&&id&&suffix.endsWith('/draft')){
    if(typeof store?.saveDraft!=='function')return json({error:'CONNECTOR_STORE_NOT_CONFIGURED'},503);
    const body=clean(await requestBody(request,normalized));
    const saved=await store.saveDraft(tenantId,{...body,id,state:body.state||'Draft'});
    return json(clean(saved));
  }
  return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST, PUT'}});
}
