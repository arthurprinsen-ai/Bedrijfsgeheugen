import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
const dates=items=>Array.isArray(items)&&items.length>0&&items.length<=120&&items.every(x=>x&&typeof x.date==='string'&&x.date.length<=32&&numeric(x.value));
export function verifiedForecasts(projection,tenantId,{now=new Date()}={}){
 if(typeof tenantId!=='string'||!tenantId.trim())return [];
 const reference=now instanceof Date?now.getTime():Date.parse(now);
 if(!Number.isFinite(reference))return [];
 const declaredTenant=projection?.tenantId||projection?.tenant_id||projection?.payload?.tenantId||projection?.payload?.tenant_id;
 if(declaredTenant&&declaredTenant!==tenantId)return [];
 const fresh=updatedAt=>{const observed=Date.parse(updatedAt);const age=reference-observed;
  return Number.isFinite(age)&&age>=0&&age<=30*86400000;};
 const source=projection?.payload?.data||projection?.payload||projection?.data||{};
 const forecasts=Array.isArray(source?.forecasts)?source.forecasts:[];
 return forecasts.filter(f=>f&&f.verified===true&&f.validation?.status==='passed'&&f.validation?.tenantBound===true&&typeof f.validation?.verifiedAt==='string'&&fresh(f.validation.verifiedAt)&&f.tenantId===tenantId&&f.validation?.tenantId===tenantId&&
 typeof f.source==='string'&&f.source.trim()&&typeof f.model==='string'&&f.model.trim()&&
 typeof f.updatedAt==='string'&&fresh(f.updatedAt)&&
 dates(f.history)&&dates(f.forecast)&&
 (!f.low||dates(f.low))&&(!f.high||dates(f.high)))
 .slice(0,30).map(f=>({
 id:String(f.id||f.metric||'forecast').slice(0,80),metric:String(f.metric||'custom').slice(0,30),
 title:String(f.title||'Prognose').slice(0,120),unit:String(f.unit||'').slice(0,20),
 source:f.source.slice(0,160),model:f.model.slice(0,120),updatedAt:f.updatedAt,
 verified:true,history:f.history,forecast:f.forecast,
 ...(f.low?{low:f.low}:{}),...(f.high?{high:f.high}:{})
 }));
}
export function createPortalForecastHandler({getUser,getCanonical}={}){
 if(typeof getUser!=='function'||typeof getCanonical!=='function')throw new TypeError('identity and canonical store required');
 return async request=>{
 if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
 const user=await getUser();
 if(!user?.id)return json({error:'UNAUTHORIZED'},401);
 const tenantId=resolveIdentityTenant(user);
 if(!tenantId)return json({error:'FORBIDDEN'},403);
 try{
  const projection=await getCanonical(tenantId);
  if(!projection)return json({forecasts:[],status:'NO_CANONICAL_FORECASTS'});
  const forecasts=verifiedForecasts(projection,tenantId);
  return json({forecasts,status:forecasts.length?'OK':'NO_VALIDATED_FINANCIAL_FORECASTS'});
 }catch{return json({error:'FORECAST_SOURCE_UNAVAILABLE'},503)}
 };
}
