import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file='supabase/functions/_shared/blog-quality-recovery.mjs';
const mod=fs.existsSync(file)?await import('../'+file):{};
const date='2026-10-28';
const fixture=()=>({runDate:date,violations:['EDITORIAL_PUBLICATION_INSTRUCTIONS'],artifact:{run_date:date,channel:'blog',status:'content_ready'},decision:{run_date:date,channel:'blog',state:'content_ready',decision:'publish',updated_at:'2026-10-28T08:00:00Z',delivery_ref:null,delivery_evidence:{}},obligation:{tenant_id:'canonical',publication_date:date,channel:'blog',status:'GENERATED',external_id:null,published_at:null,live_proven_at:null,evidence:{}}});
test('canonical writer can reopen its exact unsent quality-rejected blog',()=>{
 assert.equal(typeof mod.planBlogQualityRepair,'function','missing canonical blog repair policy');
 assert.equal(mod.planBlogQualityRepair(fixture()).eligible,true);
});
test('provider side effects, uncertain delivery and a good artifact stay immutable',()=>{
 assert.equal(typeof mod.planBlogQualityRepair,'function');
 const cases=[x=>x.violations=[],x=>x.obligation.status='DISPATCHED',x=>x.obligation.external_id='provider-1',x=>x.obligation.live_proven_at='2026-10-28T08:10:00Z',x=>x.obligation.published_at='2026-10-28T08:10:00Z',x=>x.decision.delivery_ref='provider-1',x=>x.artifact.status='published',x=>x.decision.channel='linkedin_company',x=>x.obligation.tenant_id='another',x=>x.artifact.run_date='2026-10-27',x=>delete x.decision.updated_at];
 for(const flag of ['provider_create_success','republish_forbidden','possible_provider_side_effect','provider_publication_ack_verified','provider_truth_verified'])for(const field of ['obligation','decision'])cases.push(x=>(x[field][field==='decision'?'delivery_evidence':'evidence'][flag]=true));
 for(const mutate of cases){const x=fixture();mutate(x);assert.equal(mod.planBlogQualityRepair(x).eligible,false);}
});

const refreshFile='tools/content-growth/reviewed-blog-refresh.mjs';
const refresh=fs.existsSync(refreshFile)?await import('../'+refreshFile):{};
const refreshFixture=()=>({date,repository:'arthurprinsen-ai/Bedrijfsgeheugen',expectedHead:'a'.repeat(40),pr:{state:'open',draft:true,body:'Obligation-ID: content-publication:'+date+':blog',base:{ref:'main'},head:{sha:'a'.repeat(40),ref:'automation/powerhouse-blog-'+date,repo:{full_name:'arthurprinsen-ai/Bedrijfsgeheugen'}}},previous:{canonical_url:'https://www.bedrijfsgeheugen.nl/blog/topic/'},artifact:{ok:true,run_date:date,slug:'topic',canonical_url:'https://www.bedrijfsgeheugen.nl/blog/topic/',body:'New useful reader copy',reader_ready:true,blog_quality_repair:{contract:'same-obligation-unsent-blog-quality-repair-v1',rejected_body_sha256:'b'.repeat(64),rejection_codes:['EDITORIAL_PUBLICATION_INSTRUCTIONS']}}});
test('only the exact draft writer may refresh changed canonical reader-ready content at the same URL',()=>{
 assert.equal(typeof refresh.planDraftBlogRefresh,'function','missing exact draft refresh policy');
 assert.equal(refresh.planDraftBlogRefresh(refreshFixture()).eligible,true);
 for(const mutate of [x=>x.pr.draft=false,x=>x.pr.state='closed',x=>x.expectedHead='c'.repeat(40),x=>x.pr.head.repo.full_name='another/repo',x=>x.artifact.reader_ready=false,x=>x.artifact.blog_quality_repair=null,x=>x.previous.canonical_url='https://www.bedrijfsgeheugen.nl/blog/another/',x=>x.pr.body+='\nWriter-Lease-State: TERMINAL_DELIVERY']){const x=refreshFixture();mutate(x);assert.equal(refresh.planDraftBlogRefresh(x).eligible,false);}
});

import {spawnSync} from 'node:child_process';
test('same-URL revision replaces index and RSS text without duplicating entries',()=>{
 const py=String.raw`import importlib.util,json
s=importlib.util.spec_from_file_location('p','tools/site-shell/publish_powerhouse_blog_artifact.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
f=getattr(m,'upsert_publication_entry',None)
if not f: print(json.dumps({'missing':True}))
else:
 card='<a class="kaart" href="https://www.bedrijfsgeheugen.nl/blog/topic/">NEW reader text</a>'
 source='<div class="artikelen">\n<a class="kaart" href="/blog/other/">KEEP</a><a class="kaart" href="/blog/topic/">OLD SEO directions</a>'
 out=f(source,card,['/blog/topic/','https://www.bedrijfsgeheugen.nl/blog/topic/'],'card')
 rss='<channel>\n<item><link>https://www.bedrijfsgeheugen.nl/blog/other/</link><description>KEEP</description></item><item><link>https://www.bedrijfsgeheugen.nl/blog/topic/</link><description>OLD</description></item>'
 item='<item><link>https://www.bedrijfsgeheugen.nl/blog/topic/</link><description>NEW</description></item>'
 r=f(rss,item,['https://www.bedrijfsgeheugen.nl/blog/topic/'],'rss')
 print(json.dumps({'card':out,'rss':r,'idempotent':f(out,card,['/blog/topic/','https://www.bedrijfsgeheugen.nl/blog/topic/'],'card')==out}))`;
 const p=spawnSync('python3',['-B','-c',py],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const j=JSON.parse(p.stdout);
 assert.equal(j.missing,undefined,'missing same-URL registry refresh');assert.match(j.card,/KEEP/);assert.match(j.card,/NEW reader text/);assert.doesNotMatch(j.card,/OLD SEO/);assert.match(j.rss,/KEEP/);assert.doesNotMatch(j.rss,/OLD/);assert.equal((j.rss.match(/<item>/g)||[]).length,2);assert.equal(j.idempotent,true);
});

import {stripTypeScriptTypes} from 'node:module';
import {assertMeasurementSourceReadOnly,assertObservedSnapshotFloor} from '../supabase/functions/_shared/measured-provider-db-policy.mjs';
test('repair runs through the real SQL adapter with exact date, channel, state and timestamp CAS',async()=>{
 const src=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const adapter=src.slice(src.indexOf('function dbIdent('),src.indexOf('\nasync function directRpc(')).replace(/^const directSql=.*$/m,'');
 const f=fixture();const writes=[];
 const sql={unsafe:async(query,values)=>{
  if(query.startsWith('update ')){writes.push({query,values});return [{channel:'blog'}];}
  if(query.includes('"powerhouse_content_artifacts"'))return [f.artifact];
  if(query.includes('"powerhouse_channel_decisions"'))return [f.decision];
  return [f.obligation];
 }};
 const Q=new Function('directSql','DIRECT_TABLES','assertMeasurementSourceReadOnly','assertObservedSnapshotFloor','DB_JSON_COLUMNS','DB_ARRAY_CASTS','DB_DEFAULT_CONFLICT',stripTypeScriptTypes(adapter,{mode:'strip'})+'\nreturn DirectQuery;')(sql,new Set(['powerhouse_content_artifacts','powerhouse_channel_decisions','content_publication_obligations']),assertMeasurementSourceReadOnly,assertObservedSnapshotFloor,new Set(['powerhouse_channel_decisions.delivery_evidence']),new Map(),new Map());
 const db={from:table=>new Q(table)};
 assert.equal((await mod.reopenRejectedBlog(db,date,()=>f.violations)).reopened,true);
 assert.equal(writes.length,1);assert.match(writes[0].query,/"delivery_ref" is null/);assert.match(writes[0].query,/"updated_at" = \$\d+/);assert.ok(writes[0].values.includes(date));assert.ok(writes[0].values.includes(f.decision.updated_at));assert.ok(writes[0].values.includes('blog'));assert.ok(writes[0].values.includes('content_ready'));
 sql.unsafe=async q=>q.startsWith('update ')?[]:q.includes('"powerhouse_content_artifacts"')?[f.artifact]:q.includes('"powerhouse_channel_decisions"')?[f.decision]:[f.obligation];
 assert.equal((await mod.reopenRejectedBlog(db,date,()=>f.violations)).reopened,false);
});

test('always-run cleanup cannot make an old rejected head ready after failed refresh',()=>{
 const src=fs.readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
 const guard=src.match(/# BEGIN BLOG_REFRESH_RELEASE_FENCE\n([\s\S]*?)\n\s*# END BLOG_REFRESH_RELEASE_FENCE/);
 assert.ok(guard,'missing success-and-head release fence');
 const script=guard[1].split('\n').map(s=>s.trimStart()).join('\n');
 const run=(extra={})=>spawnSync('bash',['-c',script],{encoding:'utf8',env:{...process.env,QUALITY_REFRESH:'true',BLOG_REFRESHED_HEAD:'a'.repeat(40),BLOG_VERIFIED_HEAD:'b'.repeat(40),head_sha:'b'.repeat(40),...extra}}).status;
 assert.equal(run(),0);assert.notEqual(run({BLOG_REFRESHED_HEAD:''}),0);assert.notEqual(run({BLOG_VERIFIED_HEAD:''}),0);assert.notEqual(run({head_sha:'c'.repeat(40)}),0);
 assert.match(src,/steps\.candidate\.outcome == 'success'/);
});

test('repair pins the rejected source and final persistence requires the same owner and still-unsent rows',()=>{
 assert.equal(typeof mod.canCommitBlogQualityRepair,'function','missing final owner fence');
 const x=fixture();x.artifact.generation_evidence={recommendation_id:'source-1'};
 const claim={token:'owner-1',recommendation_id:'source-1',rejected_body:'old',rejected_updated_at:'v1'};
 x.artifact.body='old';x.artifact.updated_at='v1';x.decision.state='decided';x.decision.delivery_evidence.blog_quality_repair=claim;
 assert.equal(mod.canCommitBlogQualityRepair({...x,claim}).eligible,true);
 for(const mutate of [a=>a.obligation.status='DISPATCHED',a=>a.obligation.external_id='sent',a=>a.artifact.body='new elsewhere',a=>a.artifact.updated_at='v2',a=>a.decision.delivery_evidence.blog_quality_repair={...claim,token:'owner-2'},a=>a.artifact.generation_evidence.recommendation_id='source-2']){const a=structuredClone({...x,claim});mutate(a);assert.equal(mod.canCommitBlogQualityRepair(a).eligible,false);}
});

test('two concurrent canonical repairs have one owner and late provider/artifact changes stay blocked',async()=>{
 const state=fixture();state.artifact.body='rejected';state.artifact.updated_at='old';state.artifact.generation_evidence={recommendation_id:'source-1'};
 let queue=Promise.resolve(),writes=0;
 const tables={powerhouse_content_artifacts:'artifact',powerhouse_channel_decisions:'decision',content_publication_obligations:'obligation'};
 const locked={from(table){let payload=null,filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},update(v){payload=v;return q;},async maybeSingle(){const row=state[tables[table]];if(filters.some(([k,v])=>(row[k]??null)!==v))return{data:null,error:null};if(payload){Object.assign(row,payload);writes++;}return{data:structuredClone(row),error:null};}};return q;}};
 const db={withBlogQualityLock(date,work){const p=queue.then(()=>work(locked));queue=p.catch(()=>{});return p;}};
 const result=await Promise.all([mod.reopenRejectedBlog(db,date,()=>['EDITORIAL_PUBLICATION_INSTRUCTIONS']),mod.reopenRejectedBlog(db,date,()=>['EDITORIAL_PUBLICATION_INSTRUCTIONS'])]);
 assert.equal(result.filter(x=>x.reopened).length,1);assert.equal(writes,1);
 const claim=result.find(x=>x.reopened).claim;state.obligation.status='DISPATCHED';
 await assert.rejects(mod.persistRepairedBlog(db,date,claim,{},{}),/OWNERSHIP_OR_DELIVERY_CHANGED/);assert.equal(writes,1);
 state.obligation.status='GENERATED';state.artifact.body='changed by another owner';
 await assert.rejects(mod.persistRepairedBlog(db,date,claim,{},{}),/OWNERSHIP_OR_DELIVERY_CHANGED/);assert.equal(writes,1);
});

test('renderer uses the authorized source snapshot instead of fetching a second source',()=>{
 const py=String.raw`import importlib.util,os,json,tempfile,sys
s=importlib.util.spec_from_file_location('p','tools/site-shell/publish_powerhouse_blog_artifact.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def forbidden(*args): raise Exception('SECOND_SOURCE_FETCH_FORBIDDEN')
m.fetch=forbidden
with tempfile.NamedTemporaryFile(mode='w',suffix='.json') as f:
 json.dump({'run_date':'2026-10-27'},f);f.flush();os.environ['POWERHOUSE_BLOG_SOURCE_SNAPSHOT']=f.name;sys.argv=['publisher','2026-10-28']
 try:m.main()
 except SystemExit as e:print(str(e))`;
 const p=spawnSync('python3',['-B','-c',py],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/BLOG_SOURCE_SNAPSHOT_DATE_MISMATCH/);
});

test('Postgres timestamp Date objects and persisted JSON timestamps retain the same repair identity',()=>{
 const x=fixture();x.artifact.body='old';x.artifact.updated_at=new Date('2026-10-28T08:00:00.123Z');x.artifact.generation_evidence={recommendation_id:'source-1'};const claim={token:'owner',recommendation_id:'source-1',rejected_body:'old',rejected_updated_at:'2026-10-28T08:00:00.123Z'};x.decision.state='decided';x.decision.delivery_evidence.blog_quality_repair=claim;
 assert.equal(mod.canCommitBlogQualityRepair({...x,claim}).eligible,true);
});

test('postgres3.4.7 DATE values match the same canonical calendar day in claim and final write',()=>{
 const x=fixture();x.artifact.run_date=new Date('2026-10-28T00:00:00.000Z');x.decision.run_date=new Date('2026-10-28T00:00:00.000Z');x.obligation.publication_date=new Date('2026-10-28T00:00:00.000Z');
 assert.equal(mod.planBlogQualityRepair(x).eligible,true);
 x.artifact.body='old';x.artifact.updated_at='2026-10-28T08:00:00.123Z';x.artifact.generation_evidence={recommendation_id:'source-1'};const claim={token:'owner',recommendation_id:'source-1',rejected_body:'old',rejected_updated_at:x.artifact.updated_at};x.decision.state='decided';x.decision.delivery_evidence.blog_quality_repair=claim;
 assert.equal(mod.canCommitBlogQualityRepair({...x,claim}).eligible,true);
 x.obligation.publication_date=new Date('2026-10-27T00:00:00.000Z');assert.equal(mod.canCommitBlogQualityRepair({...x,claim}).eligible,false);
 x.obligation.publication_date=new Date('invalid');assert.equal(mod.canCommitBlogQualityRepair({...x,claim}).eligible,false);
});
