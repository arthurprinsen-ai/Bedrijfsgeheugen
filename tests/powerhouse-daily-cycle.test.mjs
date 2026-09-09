import test from 'node:test';
import assert from 'node:assert/strict';
import { runDailyCycle, config } from '../netlify/functions/powerhouse-daily-cycle.mjs';

test('daily cycle runs only against healthy unified no-Make core',async()=>{
  const calls=[];
  const fetchFn=async (url,options={})=>{
    calls.push({url:String(url),method:options.method||'GET'});
    if(String(url).endsWith('/health'))return Response.json({ok:true,unifiedCore:true,makeCriticalPath:false});
    if(String(url).endsWith('/daily'))return Response.json({ok:true,state:'completed',runDate:'2026-09-09',actions:Array(15).fill({}),recommendations:Array(10).fill({})});
    return Response.json({ok:false},{status:404});
  };
  const result=await runDailyCycle({runDate:'2026-09-09',coreOptions:{fetchFn,env:{POWERHOUSE_CORE_URL:'https://core.invalid',POWERHOUSE_CORE_TOKEN:'t'}}});
  assert.equal(result.state,'completed');
  assert.equal(result.actions.length,15);
  assert.equal(result.recommendations.length,10);
  assert.deepEqual(calls.map(x=>x.url),['https://core.invalid/health','https://core.invalid/daily']);
});

test('daily cycle fails closed when unified health is false',async()=>{
  const fetchFn=async()=>Response.json({ok:true,unifiedCore:false,makeCriticalPath:false});
  await assert.rejects(()=>runDailyCycle({coreOptions:{fetchFn,env:{POWERHOUSE_CORE_URL:'https://core.invalid',POWERHOUSE_CORE_TOKEN:'t'}}}),/POWERHOUSE_UNIFIED_CORE_UNHEALTHY/);
});

test('daily schedule executes every day at 06:30 UTC',()=>{
  assert.equal(config.schedule,'30 6 * * *');
});
