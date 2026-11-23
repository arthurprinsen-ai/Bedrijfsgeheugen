import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPortalForecastHandler,verifiedForecasts}
  from '../platform/api/portal-forecast-handler.mjs';

const point=(date,value)=>({date,value});
function validForecast({sourceAgeHours=1,reviewAgeHours=0.5}={}){
 const now=Date.now();
 return {id:'revenue',metric:'revenue',source:'Finance ledger',model:'time-series-v1',
  updatedAt:new Date(now-sourceAgeHours*3600000).toISOString(),verified:true,tenantId:'tenant42',
  validation:{status:'passed',tenantBound:true,tenantId:'tenant42',
    verifiedAt:new Date(now-reviewAgeHours*3600000).toISOString()},
  history:[point('2026-04',50),point('2026-05',60),point('2026-06',70),
    point('2026-07',80),point('2026-08',90),point('2026-09',100)],
  forecast:[point('2026-11',110)]};
}
const handler=forecast=>createPortalForecastHandler({
 getUser:async()=>({id:'user42',app_metadata:{tenantId:'tenant42'}}),
 getCanonical:async()=>({tenantId:'tenant42',forecasts:[forecast]})
});

test('the original authorized portal finance endpoint accepts an actually recent, later independently reviewed forecast',async()=>{
 const value=validForecast();
 const response=await handler(value)(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.forecasts.length,1);
 assert.deepEqual(payload.forecasts[0].validation,value.validation);
 assert.equal(payload.tenantId,'tenant42');
 assert.equal(response.headers.get('cache-control'),'private, no-store');
});

test('calendar aging of static October 2026 fixture is never fixed by loosening the original 30-day production limit',async()=>{
 const expired=validForecast({sourceAgeHours:35*24,reviewAgeHours:34*24});
 const response=await handler(expired)(new Request('https://example.test/api/portal-forecasts'));
 assert.equal(response.status,200);
 const data=await response.json();
 assert.deepEqual(data.forecasts,[]);
 assert.equal(data.status,'NO_VALIDATED_FINANCIAL_FORECASTS');
 assert.equal(verifiedForecasts({forecasts:[expired]},'tenant42').length,0);
});

test('the original trusted portal policy still checks both source and independent attestation at <=30 days, with tenant identity',()=>{
 const src=readFileSync(new URL('../platform/api/portal-forecast-handler.mjs',import.meta.url),'utf8');
 assert.match(src,/age<=30\*86400000/);
 assert.match(src,/fresh\(f\.validation\.verifiedAt\)/);
 assert.match(src,/fresh\(f\.updatedAt\)/);
 assert.match(src,/f\.tenantId===tenantId/);
 assert.match(src,/Date\.parse\(f\.updatedAt\)<=Date\.parse\(f\.validation\.verifiedAt\)/);
 const testSrc=readFileSync(new URL('./portal-forecast-auth.test.mjs',import.meta.url),'utf8');
 assert.match(testSrc,/freshApiForecast\(\)/);
 assert.match(testSrc,/35\*86400000/);
 assert.match(testSrc,/34\*86400000/);
});
