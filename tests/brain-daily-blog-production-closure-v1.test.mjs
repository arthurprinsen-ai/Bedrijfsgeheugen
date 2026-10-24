import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileMergedDailyBlog} from '../tools/content-growth/reconcile-merged-blog-live.mjs';
const date='2026-10-24',slug='cyberdreigingen-voor-ondernemers-van-signaal-naar-besluit-in-een-geslo';
const canonical='https://www.bedrijfsgeheugen.nl/blog/'+slug+'/';
const merge='dcbc8cb5e532c5c335245d23ab3ae86598df9a87';
const deploy='f7a3fb64254562f30f0aeba28b10b79db2b8f13c';
const expected={date,gitHubToken:'test-gh',supabaseKey:'test-db',supabaseUrl:'https://adhjwmvyoixzjtmiroln.supabase.co',now:new Date('2026-10-24T13:20:00Z')};
const fixture={
 pr:[{number:4820,head:{ref:'automation/powerhouse-blog-'+date},base:{ref:'main'},merged_at:'2026-10-24T09:48:35Z',merge_commit_sha:merge}],
 obligation:[{status:'GENERATED',slug,content_id:'blog:'+slug,canonical_url:canonical,external_id:null}],
 release:{context:'production',production_authority:'BG169',commit_ref:deploy,deploy_id:'6adc82cbce4be5e81dfcb273'},
 relation:{status:'ahead'},
 html:'<!doctype html><html><head><link rel="canonical" href="'+canonical+'"></head><body><article data-content-id="blog:'+slug+'"><h1>Real blog title</h1></article></body></html>',
 recorded:{status:'LIVE_PROVEN'},reconciled:{run_date:date,live_proven_reconciled:1},
 final:[{status:'LIVE_PROVEN',slug,content_id:'blog:'+slug,canonical_url:canonical,external_id:'6adc82cbce4be5e81dfcb273'}]
};
function mock(overrides={}){
 const data={...fixture,...overrides},calls=[];
 const fetcher=async(url,opts={})=>{
  const u=new URL(url);let value;
  if(u.hostname==='api.github.com')value=u.pathname.includes('/compare/')?data.relation:data.pr;
  else if(u.pathname==='/release.json')value=data.release;
  else if(u.pathname==='/blog/'+slug+'/')value=data.html;
  else if(u.pathname.endsWith('/rpc/record_content_publication_state'))value=data.recorded;
  else if(u.pathname.endsWith('/rpc/powerhouse_reconcile_terminal_publication_state'))value=data.reconciled;
  else if(u.pathname.endsWith('/content_publication_obligations'))value=calls.filter(x=>x.url.includes('content_publication_obligations')).length===0?data.obligation:data.final;
  else throw Error('UNMOCKED_OUTBOUND_URL:'+url);
  calls.push({url,opts});
  if(typeof value==='string')return {ok:true,status:200,headers:{get:()=> 'text/html; charset=utf-8'},text:async()=>value};
  return {ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>value};
 };
 return {fetcher,calls};
}
test('merged plus exact canonical article and production ancestor closes ONLY the existing proof obligation',async()=>{
 const t=mock(),result=await reconcileMergedDailyBlog({...expected,fetcher:t.fetcher});
 assert.equal(result.state,'LIVE_PROVEN');assert.equal(result.netlify_deploy_id,fixture.release.deploy_id);
 assert.equal(t.calls.filter(x=>x.opts.method==='POST').length,2);
 const closure=t.calls.find(x=>x.url.endsWith('rpc/record_content_publication_state'));
 const json=JSON.parse(closure.opts.body);
 assert.equal(json.p_status,'LIVE_PROVEN');assert.equal(json.p_channel,'blog');assert.equal(json.p_evidence.outcome_scope,'PUBLICATION_ONLY_NOT_MEASURED_LEADS_OR_REVENUE');
 assert.equal(t.calls.filter(x=>x.url===canonical).length,1);
});
test('not merged means never write, even if public URL happens to resolve',async()=>{
 const t=mock({pr:[]});const result=await reconcileMergedDailyBlog({...expected,fetcher:t.fetcher});
 assert.equal(result.state,'NO_MERGED_DAILY_BLOG');assert.equal(t.calls.length,1);
});
test('existing LIVE_PROVEN state is idempotent; no extra write or public assumption',async()=>{
 const t=mock({obligation:[{...fixture.obligation[0],status:'LIVE_PROVEN'}]});
 const result=await reconcileMergedDailyBlog({...expected,fetcher:t.fetcher});
 assert.equal(result.state,'ALREADY_LIVE_RECORDED');
 assert.equal(t.calls.filter(x=>x.opts.method==='POST').length,0);
});
test('preview, unauthorized deploy or non-descendant release cannot close the obligation',async()=>{
 for(const override of [{release:{...fixture.release,context:'deploy-preview'}},{release:{...fixture.release,production_authority:'unknown'}},{relation:{status:'diverged'}}]){
  const t=mock(override);
  await assert.rejects(reconcileMergedDailyBlog({...expected,fetcher:t.fetcher}),/BLOG_PROOF_/);
  assert.equal(t.calls.filter(x=>x.opts.method==='POST').length,0);
 }
});
test('200 homepage/SPA fallback is not a proven blog even when status is 200',async()=>{
 const t=mock({html:'<!doctype html><html><head><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/"></head><body><h1>Homepage</h1></body></html>'});
 await assert.rejects(reconcileMergedDailyBlog({...expected,fetcher:t.fetcher}),/WRONG_PUBLIC_PAGE/);
 assert.equal(t.calls.filter(x=>x.opts.method==='POST').length,0);
});
test('inconsistent tenant canonical URL/identifier or unknown provider token never writes',async()=>{
 for(const data of [
  {obligation:[{...fixture.obligation[0],slug:'../billing'}]},
  {obligation:[{...fixture.obligation[0],canonical_url:'https://attacker.invalid/blog/'+slug+'/'}]}
 ]){
  const t=mock(data);
  await assert.rejects(reconcileMergedDailyBlog({...expected,fetcher:t.fetcher}),/ARTIFACT_LINEAGE/);
  assert.equal(t.calls.filter(x=>x.opts.method==='POST').length,0);
 }
 const t=mock();await assert.rejects(reconcileMergedDailyBlog({...expected,gitHubToken:'',fetcher:t.fetcher}),/AUTH_REQUIRED/);
 assert.equal(t.calls.length,0);
});
