import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
// Canonical monthly or daily financial periods; reject gaps disguised as invalid dates,
// out-of-order points, duplicates and silently discarded null observations.
const period=date=>{
 if(typeof date!=='string'|| !/^[0-9]{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?$/.test(date))return false;
 if(date.length===7)return true;
 const parsed=new Date(date+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
};
const dates=(items,min=1)=>{
 if(!Array.isArray(items)||items.length<min||items.length>120)return false;
 const granularity=items[0]?.date?.length;
 return items.every((x,i)=>x&&period(x.date)&&x.date.length===granularity&&numeric(x.value)&&
   (i===0||x.date>items[i-1].date));
};
const bandsValid=f=>{
 if(!f.low&&!f.high)return true;
 if(!dates(f.low)||!dates(f.high)||
    f.low.length!==f.forecast.length||f.high.length!==f.forecast.length)return false;
 return f.forecast.every((p,i)=>p.date===f.low[i].date&&p.date===f.high[i].date&&
   f.low[i].value<=p.value&&p.value<=f.high[i].value);
};
export function verifiedForecasts(projection,tenantId,{now=new Date()}={}){
 if(typeof tenantId!=='string'||!tenantId.trim())return [];
 const reference=now instanceof Date?now.getTime():Date.parse(now);
 if(!Number.isFinite(reference))return [];
 const declaredTenant=projection?.tenantId||projection?.tenant_id||projection?.payload?.tenantId||projection?.payload?.tenant_id;
 if(declaredTenant&&declaredTenant!==tenantId)return [];
 const fresh=updatedAt=>{const observed=Date.parse(updatedAt);const age=reference-observed;
  return Number.isFinite(age)&&age>=0&&age<=30*86400000;};
 const source=projection?.payload?.data||projection?.payload||projection?.data||projection||{};
 const forecasts=Array.isArray(source?.forecasts)?source.forecasts:[];
 return forecasts.filter(f=>f&&f.verified===true&&f.validation?.status==='passed'&&f.validation?.tenantBound===true&&typeof f.validation?.verifiedAt==='string'&&fresh(f.validation.verifiedAt)&&f.tenantId===tenantId&&f.validation?.tenantId===tenantId&&
 typeof f.source==='string'&&f.source.trim()&&typeof f.model==='string'&&f.model.trim()&&
 typeof f.updatedAt==='string'&&fresh(f.updatedAt)&&
 // A changed ledger/source requires a new independent review, not the prior approval.
 Date.parse(f.updatedAt)<=Date.parse(f.validation.verifiedAt)&&
 // Must match the authoritative six-observation independent financial review gate.
 dates(f.history,6)&&dates(f.forecast)&&
 f.history.at(-1).date<f.forecast[0].date&&f.history[0].date.length===f.forecast[0].date.length&&
 bandsValid(f))
 .slice(0,30).map(f=>({
 id:String(f.id||f.metric||'forecast').slice(0,80),metric:String(f.metric||'custom').slice(0,30),
 title:String(f.title||'Prognose').slice(0,120),unit:String(f.unit||'').slice(0,20),
 source:f.source.slice(0,160),model:f.model.slice(0,120),updatedAt:f.updatedAt,
 verified:true,tenantId:f.tenantId,validation:{status:'passed',tenantBound:true,tenantId:f.validation.tenantId,verifiedAt:f.validation.verifiedAt},history:f.history,forecast:f.forecast,
 ...(f.low?{low:f.low}:{}),...(f.high?{high:f.high}:{})
 }));
}
export function createPortalForecastHandler({getUser,getCanonical}={}){
 if(typeof getUser!=='function'||typeof getCanonical!=='function')throw new TypeError('identity and canonical store required');
 return async request=>{
 if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
 let user;
 try{user=await getUser()}
 catch{return json({error:'FORECAST_IDENTITY_UNAVAILABLE'},503)}
 if(!user?.id)return json({error:'UNAUTHORIZED'},401);
 const tenantId=resolveIdentityTenant(user);
 if(!tenantId)return json({error:'FORBIDDEN'},403);
 try{
  const projection=await getCanonical(tenantId);
  if(!projection)return json({forecasts:[],status:'NO_CANONICAL_FORECASTS'});
  const forecasts=verifiedForecasts(projection,tenantId);
  return json(forecasts.length?{tenantId,forecasts,status:'OK'}:{forecasts:[],status:'NO_VALIDATED_FINANCIAL_FORECASTS'});
 }catch{return json({error:'FORECAST_SOURCE_UNAVAILABLE'},503)}
 };
}
