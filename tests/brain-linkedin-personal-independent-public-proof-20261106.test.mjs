import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');
const begin=source.indexOf('async function originalLinkedInPersonalPublicReadback(');
const end=source.indexOf('async function reconcileExistingProviderTruth(',begin);
assert.ok(begin>0 && end>begin,'Must use the original publisher function, not duplicate a verifier');
const originalHelper=source.slice(begin,end);
const urn='urn:li:share:7524468222708948994';
const canonicalUrl='https://www.linkedin.com/feed/update/'+urn+'/';
const copy='Ochtendroutine: telefoon vol met meldingen uit de schoolapp, WhatsApp-groepjes en afgezonderde e-mails. Een studiedag blijkt ergens gestaan te hebben in een nieuwsbrief van maanden geleden. Niemand wist wie thuis kon blijven. Informatie uit schoolapps, mails, brieven en sportclubs valt verspreid binnen. Belangrijke berichten kun je één keer markeren en in een gedeelde agenda opslaan. Hoe bewaar je overzicht zonder dat alle meldingen elkaar voortdurend verdringen?';
const sample={
 success:true,
 description:copy.replace('Een studiedag','\n\nEen studiedag')+'  ',
 author:{name:'Arthur Prinsen Power BI Data Consultant',url:'https://nl.linkedin.com/in/arthurprinsen/en'},
 date_published:'2026-11-06T13:50:22.309Z',
 url:'https://nl.linkedin.com/posts/arthurprinsen_ochtendroutine-telefoon-vol-met-meldingen-activity-7524468223367450625-A7WR'
};
function fixture({post={},body=copy,setup={user_id:'canonical-original-identity'},http=200,sourceError=false}={}){
 let calls=0,lastCall=null;
 const fakeFetch=async(url,opts)=>{calls++;lastCall={url,opts};return {ok:http===200,status:http,json:async()=>({successful:http===200,data:{...sample,...post}})};};
 const db={from(name){
  assert.ok(['powerhouse_content_artifacts','brain_records'].includes(name),'Never write original table state');
  return {select(){return this},eq(){return this},maybeSingle:async()=>({data:name==='brain_records'?{result:setup}:{body},error:sourceError?{message:'failed'}:null})};
 }};
 const creator=new Function('clean','jsonObject','secret','COMPOSIO_BASE','fetch',originalHelper+';return originalLinkedInPersonalPublicReadback;');
 const fn=creator(value=>String(value??'').trim(),x=>x,async()=> 'test-api-key','https://backend.composio.dev/api/v3.1',fakeFetch);
 return {go:()=>fn(db,urn,'2026-11-06',canonicalUrl),goWrongUrl:()=>fn(db,urn,'2026-11-06','https://example.com/other'),getCalls:()=>calls,getLast:()=>lastCall};
}
test('exact public body + author + date + existing URN are independently read back through the ORIGINAL publisher',async()=>{
 const f=fixture();const out=await f.go();
 assert.equal(out.ok,true);
 assert.equal(out.evidence.independent_public_readback_verified,true);
 assert.equal(out.evidence.readback_exact_first_85_characters_matched,true);
 assert.equal(out.evidence.readback_exact_last_90_characters_matched,true);
 assert.equal(out.evidence.independent_public_full_copy_matched,true);
 assert.equal(out.evidence.public_linkedin_urn,urn);
 assert.equal(f.getCalls(),1);
 assert.ok(f.getLast().url.endsWith('/tools/execute/SCRAPECREATORS_GET_LINKEDIN_POST'));
 const sent=JSON.parse(f.getLast().opts.body);
 assert.equal(sent.arguments.url,canonicalUrl);
 assert.equal(sent.user_id,'canonical-original-identity');
 assert.equal(sent.entity_id,'canonical-original-identity');
});
test('fail closed for copy, author, permalink, day, missing first-party source, provider failure and wrong immutable URN URL',async()=>{
 const negatives=[
  {post:{description:'A different article on a similar subject.'}},
  {post:{author:{name:'Someone Else',url:sample.author.url}}},
  {post:{author:{name:sample.author.name,url:'https://nl.linkedin.com/in/someone-else/'}}},
  {post:{url:'https://other-site.example.com/posts/not-the-owner'}},
  {post:{date_published:'2026-11-05T13:50:22.309Z'}},
  {body:'Absent'},
  {setup:{}},
  {http:403},
  {sourceError:true}
 ];
 for(const item of negatives){const f=fixture(item);const res=await f.go();assert.equal(res.ok,false,JSON.stringify(item).slice(0,100))}
 const wrong=fixture();assert.equal((await wrong.goWrongUrl()).ok,false);assert.equal(wrong.getCalls(),0);
});
test('public proof path is gated by prior provider create, 401/403 and exact original obligation, never creates another post',()=>{
 for(const literal of [
 'providerCreateProven && permissionLimited && !independentPublicProof',
 'await originalLinkedInPersonalPublicReadback(db,ref,runDate,clean(obligation?.canonical_url))',
 "verifiedPublicPage?.ok===true",
 "recordObligation(db,runDate,row.channel,'LIVE_PROVEN'",
 'independent_public_readback_verified:true',
 'readback_exact_first_85_characters_matched:true',
 'readback_exact_last_90_characters_matched:true'
 ])assert.ok(source.includes(literal),literal);
 assert.ok(!originalHelper.includes('LINKEDIN_CREATE'));
 assert.ok(!originalHelper.includes('INSTAGRAM_POST_'));
 assert.ok(!originalHelper.includes(".update("));
 assert.ok(!originalHelper.includes("net.http_post"));
});
