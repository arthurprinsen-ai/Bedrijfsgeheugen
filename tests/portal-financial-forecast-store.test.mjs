import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabasePortalProjectionStore} from '../netlify/functions/_portal-supabase-store.mjs';
const response=data=>({ok:true,status:200,json:async()=>data});
test('financial forecast gateway is tenant scoped and returns only gateway records',async()=>{
  let body;
  const store=createSupabasePortalProjectionStore({
    baseUrl:'https://example.supabase.co',
    serviceToken:'test-only-value',
    fetchFn:async(_url,req)=>{body=JSON.parse(req.body);return response({tenantId:'tenant42',forecasts:[]});}
  });
  assert.deepEqual(await store.getValidatedFinancialForecasts('tenant42'),{forecasts:[]});
  assert.deepEqual(body,{action:'financial_forecasts',tenantId:'tenant42'});
});
test('financial forecast gateway rejects mismatched tenant and malformed response',async()=>{
  for(const data of [{tenantId:'other',forecasts:[]},{tenantId:'tenant42',forecasts:[{tenantId:'other'}]},{tenantId:'tenant42'}]){
    const store=createSupabasePortalProjectionStore({
      baseUrl:'https://example.supabase.co',
      serviceToken:'test-only-value',
      fetchFn:async()=>response(data)
    });
    await assert.rejects(()=>store.getValidatedFinancialForecasts('tenant42'),/tenant scope mismatch/);
  }
});
test('financial forecast gateway fails closed on storage error',async()=>{
  const store=createSupabasePortalProjectionStore({
    baseUrl:'https://example.supabase.co',
    serviceToken:'test-only-value',
    fetchFn:async()=>({ok:false,status:503,json:async()=>({error:'DB_UNAVAILABLE'})})
  });
  await assert.rejects(()=>store.getValidatedFinancialForecasts('tenant42'),/gateway failed/);
});
