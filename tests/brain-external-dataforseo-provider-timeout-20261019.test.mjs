import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/bg-externe-signalen/index.ts',import.meta.url),'utf8');
test('Tavily remains 12s, DataForSEO is separately bounded at 35s',()=>{
 assert.match(source,/const TAVILY_TIMEOUT_MS=12000/);
 assert.match(source,/const DATAFORSEO_TIMEOUT_MS=35000/);
 const a=source.slice(source.indexOf('async function dataforseoSerp'),source.indexOf('Deno.serve('));
 assert.match(a,/signal:AbortSignal.timeout\(DATAFORSEO_TIMEOUT_MS\)/);
 assert.doesNotMatch(a,/signal:AbortSignal.timeout\(TAVILY_TIMEOUT_MS\)/);
 assert.match(source,/max_results:6,search_depth:'basic'/);
});
test('preserves bounded batches, scheduler authority and truthful partial results',()=>{
 assert.match(source,/const BATCH=3/);
 assert.match(source,/req.headers.get\('x-powerhouse-token'\)!==expected/);
 assert.match(source,/failed\.length\?207:200/);
 assert.match(source,/await bewijs\(ok\.length>0,out/);
 assert.match(source,/error:safeFailure\(e\)/);
});
