/**
 * Tenant-bound financial readouts from the *existing* independently reviewed
 * /api/portal-forecasts endpoint. No financial actuals come from demo state,
 * market signals, local storage, an LLM, or the unreviewed business profile.
 */
const clean=value=>String(value??'').trim();
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const validDate=value=>{
 if(typeof value!=='string'||!/^\d{4}-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?$/.test(value))return false;
 if(value.length===7)return true;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
};
const fresh=(date,now)=>{const ms=Date.parse(date||'');const age=now-ms;return Number.isFinite(age)&&age>=0&&age<=30*86_400_000;};
const seriesValid=series=>Array.isArray(series)&&series.length>0&&series.length<=120&&
 series.every((point,i)=>validDate(point?.date)&&finite(point?.value)&&
   (i===0||point.date>series[i-1].date)&&point.date.length===series[0].date.length);
const preferred=Object.freeze({
 revenue:new Set(['revenue','net_revenue','turnover']),
 cash:new Set(['cash_balance','cash_position','cash_at_bank']),
 margin:new Set(['gross_margin_pct','gross_margin_percentage'])
});
const fmtEuro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
const fmtPercent=value=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value)+'%';
function valueFor(record,kind,point,forecast=false){
 const value=point?.value;
 if(!finite(value))return null;
 const metric=clean(record.metric).toLowerCase();
 if(!preferred[kind].has(metric))return null;
 const unit=clean(record.unit).toLowerCase();
 if(kind==='margin'&& !['percent','percentage','%'].includes(unit))return null;
 if(kind!=='margin'&&!['eur','currency','€'].includes(unit))return null;
 if(kind==='margin'&&(value<0||value>100))return null;
 const observedLabel=forecast?'Gecontroleerde prognose':'Gevalideerde historische reeks';
 return Object.freeze({
  value:kind==='margin'?fmtPercent(value):fmtEuro(value),
  raw:value,period:point.date,kind,forecast,
  note:`${observedLabel} · ${point.date}`,
  source:record.source,model:record.model,verifiedAt:record.validation.verifiedAt,
 });
}
export function ownerFinancialReadouts(payload,{tenantId,now=Date.now()}={}){
 const cleanTenant=clean(tenantId);
 const none=Object.freeze({revenue:null,cash:null,margin:null,records:0,status:'NOT_VERIFIED'});
 if(!cleanTenant||!payload||!Array.isArray(payload.forecasts)||!['OK','NO_VALIDATED_FINANCIAL_FORECASTS','NO_CANONICAL_FORECASTS'].includes(payload.status))return none;
 const candidates=payload.forecasts.filter(f=>{
  if(!f||f.tenantId!==cleanTenant||f.validation?.tenantId!==cleanTenant||
    f.verified!==true||f.validation?.status!=='passed'||f.validation?.tenantBound!==true||
    !clean(f.source)||!clean(f.model)||!fresh(f.updatedAt,now)||!fresh(f.validation?.verifiedAt,now)||
    Date.parse(f.updatedAt)>Date.parse(f.validation.verifiedAt))return false;
  if(!seriesValid(f.history)||f.history.length<6||!seriesValid(f.forecast))return false;
  if(f.history.at(-1).date>=f.forecast[0].date||
    f.history[0].date.length!==f.forecast[0].date.length)return false;
  return true;
 }).sort((a,b)=>Date.parse(b.validation.verifiedAt)-Date.parse(a.validation.verifiedAt));
 const result={revenue:null,cash:null,margin:null,records:candidates.length,status:candidates.length?'VALIDATED':'NOT_VERIFIED'};
 for(const row of candidates){
  const history=row.history.at(-1),forecast=row.forecast[0];
  if(!result.revenue)result.revenue=valueFor(row,'revenue',history);
  if(!result.margin)result.margin=valueFor(row,'margin',history);
  if(!result.cash)result.cash=valueFor(row,'cash',forecast,true);
 }
 return Object.freeze(result);
}
export function createOwnerFinancialClient({fetchImpl=globalThis.fetch,authHeadersProvider=async()=>({})}={}){
 return Object.freeze({async load(tenantId){
  const expectedTenant=clean(tenantId);
  const auth=await authHeadersProvider();
  if(!/^Bearer\s+.+$/i.test(clean(auth?.authorization)))throw new Error('AUTH_REQUIRED');
  const response=await fetchImpl('/api/portal-forecasts',{
   method:'GET',credentials:'same-origin',cache:'no-store',
   headers:{accept:'application/json',...auth}
  });
  if(!response.ok)throw new Error(`FINANCIAL_SOURCE_HTTP_${response.status}`);
  const payload=await response.json();
  if(!payload||!Array.isArray(payload.forecasts)||!clean(payload.tenantId))throw new Error('FINANCIAL_RESPONSE_INVALID');
  if(expectedTenant&&expectedTenant!==payload.tenantId)throw new Error('TENANT_SCOPE_MISMATCH');
  return ownerFinancialReadouts(payload,{tenantId:payload.tenantId});
 }});
}
