import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkHistoricalMiraHistoryRejection} from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const known=new Set([
  'router:openart:qAUQW2ZzqdasS0ePb1PD:instagram:2026-10-25:start',
  'router:openart:a6sdR46HDe58uRlardNl:instagram:2026-10-25:temporal',
  'router:openart:oGeS7GbhttgNCxnq0tCg:instagram:2026-10-25:start',
  'router:openart:K3NqiqlKMGWDM3UEJGu0:instagram:2026-10-25:middle',
  'router:openart:7lGMacfGJcGL3WGCF4XN:instagram:2026-10-25:start',
  'router:openart:7lGMacfGJcGL3WGCF4XN:instagram:2026-10-25:middle'
]);
function fakeStore({error=null,noData=false}={}){
  const calls=[];
  return {calls,db:{from(table){calls.push(['table',table]);return {
    select(field){calls.push(['select',field]);return this;},
    like(field,prefix){calls.push(['like',field,prefix]);this.prefix=prefix;return this;},
    async limit(n){calls.push(['limit',n]);return {data:noData?undefined:[...known].filter(k=>k.startsWith(this.prefix.slice(0,-1))).slice(0,n).map(occurrence_id=>({occurrence_id})),error};}
  };}}};
}
test('rejects ALL known failed provider histories from durable Brain, not just last',async()=>{
  for(const history of ['qAUQW2ZzqdasS0ePb1PD','a6sdR46HDe58uRlardNl','oGeS7GbhttgNCxnq0tCg','K3NqiqlKMGWDM3UEJGu0','7lGMacfGJcGL3WGCF4XN']){
    const x=fakeStore(),result=await checkHistoricalMiraHistoryRejection(x.db,history);
    assert.equal(result.kind,'rejected',history);
    assert.equal(x.calls[0][1],'brain_failure_occurrences');
    assert.equal(x.calls.find(v=>v[0]==='like')[2],`router:openart:${history}:instagram:%`);
    assert.deepEqual(x.calls.at(-1),['limit',1]);
  }
});
test('different, not-yet-rejected history can reach independent ORIGINAL verifier',async()=>{
 const x=fakeStore();const result=await checkHistoricalMiraHistoryRejection(x.db,'NewDistinctProviderHistory1234');
 assert.deepEqual(result,{kind:'clear',historyId:'NewDistinctProviderHistory1234'});
});
test('schema errors, provider outage, missing result and malicious history fail closed',async()=>{
 assert.equal((await checkHistoricalMiraHistoryRejection(fakeStore({error:{code:'42P01'}}).db,'NewDistinctProviderHistory1234')).kind,'unavailable');
 assert.equal((await checkHistoricalMiraHistoryRejection(fakeStore({noData:true}).db,'NewDistinctProviderHistory1234')).kind,'unavailable');
 assert.equal((await checkHistoricalMiraHistoryRejection({from(){throw new Error('offline');}},'NewDistinctProviderHistory1234')).kind,'unavailable');
 assert.equal((await checkHistoricalMiraHistoryRejection(fakeStore().db,'foo%:instagram:')).kind,'invalid');
});
test('Router refuses previous rejection BEFORE any MP4 hash, native probe or OpenAI frame call',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 const submit=src.indexOf("if(action==='submit_asset'){"),guard=src.indexOf('checkHistoricalMiraHistoryRejection(db,manifest.openart_history_id)',submit);
 const remote=src.indexOf('const final=await hashRemote(u)',submit),face=src.indexOf("'powerhouse-instagram-media-verifier',payload",submit);
 assert.ok(submit>=0&&guard>submit&&guard<remote&&remote<face);
 assert.match(src,/MIRA_REJECTED_HISTORY_READBACK_UNAVAILABLE/);
 assert.match(src,/MIRA_OPENART_HISTORY_PREVIOUSLY_REJECTED/);
 assert.match(src,/if\(postType==='reel'\)\{/);
 assert.doesNotMatch(src,/historyProof.kind==='rejected'[\s\S]*?(?:allowVisionOverride|bypass)/);
});
