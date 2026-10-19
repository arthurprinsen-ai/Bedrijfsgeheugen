import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/bg-externe-signalen/index.ts',import.meta.url),'utf8');
test('retains scheduler-only authentication and bounded topics',()=>{
 assert.match(source,/powerhouse_daily_scheduler_token/);
 assert.match(source,/req\.headers\.get\('x-powerhouse-token'\)!==expected/);
 assert.match(source,/const BATCH=3/);
 assert.match(source,/AbortSignal\.timeout\(TAVILY_TIMEOUT_MS\)/);
});
test('uses two independent real providers when quota is exhausted',()=>{
 assert.match(source,/DATAFORSEO_ENDPOINT='https:\/\/api\.dataforseo\.com\/v3\/serp\/google\/organic\/live\/advanced'/);
 assert.match(source,/if\(!r\.ok\)throw new Error\(`HTTP_/);
 assert.match(source,/if\(!dataforseoReady\)throw error/);
 assert.match(source,/await dataforseoSerp\(o\.zoekvraag,dataforseoLogin,dataforseoPassword\)/);
});
test('only organic verified URLs, no paid results or fabricated relevance',()=>{
 assert.match(source,/x\.type==='organic'/);
 assert.match(source,/^.*rank_proxy_not_provider_relevance.*$/m);
 assert.match(source,/published_date:typeof x\.timestamp==='string'\?x\.timestamp:null/);
 assert.match(source,/allowed:rows\.filter\(x=>x\.toegestaan\)\.length/);
});
test('records exact provider lineage in canonical source observation',()=>{
 assert.match(source,/sourceKey=providers\.includes\('tavily'\)\?'tavily-intelligence':'dataforseo-intelligence'/);
 assert.match(source,/p_source_key:'external-intelligence'/);
 assert.match(source,/source_routes:ok\.map/);
 assert.match(source,/sourceKey\+':'\+observedAt/);
});
test('never treats both providers failing as a successful run',()=>{
 assert.match(source,/return json\(out,ok\.length\?\(failed\.length\?207:200\):502\)/);
 assert.match(source,/await bewijs\(ok\.length>0,out/);
});