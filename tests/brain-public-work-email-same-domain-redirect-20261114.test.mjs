import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url);
const source=readFileSync(file,'utf8');
function publicPageReader(fakeFetch){
 const begin=source.indexOf('async function readBoundedPublicPage(');
 const end=source.indexOf('async function writePublicBusinessSourceReceipt(',begin);
 assert.ok(begin>=0&&end>begin,'original existing worker remains source owner');
 const js=source.slice(begin,end).replace('url:string):Promise<string|null>','url)')
   .replace('chunks:Uint8Array[]=[]','chunks=[]');
 return new Function('fetch','AbortSignal','URL','TextDecoder','Uint8Array',
   js+'\nreturn readBoundedPublicPage;')(fakeFetch,AbortSignal,URL,TextDecoder,Uint8Array);
}
test('same company HTTPS www redirect is bounded and returns public HTML',async()=>{
 const urls=[];
 const reader=publicPageReader(async url=>{
  urls.push(String(url));
  if(urls.length===1)return new Response(null,{status:302,headers:{location:'https://www.acmeresearch.com/our-team'}});
  return new Response('<html>Acme Research, Jane Doe</html>',{status:200,headers:{'content-type':'text/html'}});
 });
 assert.match(await reader('https://acmeresearch.com/team'),/Jane Doe/);
 assert.equal(urls.length,2);
 assert.equal(new URL(urls[1]).hostname,'www.acmeresearch.com');
});
test('cross-domain or HTTPS downgrade redirect fails closed before unsafe fetch',async()=>{
 for(const location of ['https://example.org/steal','http://acmeresearch.com/team','https://127.0.0.1/internal']){
  const urls=[];
  const reader=publicPageReader(async url=>{
    urls.push(String(url));
    return new Response(null,{status:301,headers:{location}});
  });
  assert.equal(await reader('https://acmeresearch.com/team'),null);
  assert.equal(urls.length,1,'never fetch the unsafe redirected URL');
 }
});
test('unbounded redirects and private original URLs are rejected',async()=>{
 let calls=0;
 const reader=publicPageReader(async()=>{
  calls++;
  return new Response(null,{status:302,headers:{location:'https://www.acmeresearch.com/team'}});
 });
 assert.equal(await reader('https://acmeresearch.com/team'),null);
 assert.equal(calls,3);
 assert.equal(await reader('https://127.0.0.1/team'),null);
 assert.equal(calls,3);
});
test('source worker uses Amsterdam business day and three capped first-party URLs, no parallel or outbound call',()=>{
 assert.match(source,/timeZone:'Europe\/Amsterdam'/);
 assert.match(source,/eligibleSlots<8/);
 assert.match(source,/url:'https:\/\/'\+domain\+'\/team'/);
 assert.match(source,/url:'https:\/\/'\+domain\+'\/contact'/);
 assert.match(source,/url:'https:\/\/'\+domain\+'\/'/);
 assert.match(source,/public_email_source_status:result\.status/);
 assert.match(source,/public_email_next_attempt_at/);
 assert.match(source,/FIRST_PARTY_RESEARCH_DISPOSITION_ACK/);
 assert.match(source,/originalFirstPartyDomainCandidatePass\(db,observedAt\)/);
 assert.doesNotMatch(source,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|APOLLO_PEOPLE_ENRICHMENT|HUNTER_EMAIL_FINDER/i);
});
