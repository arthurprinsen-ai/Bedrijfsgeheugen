import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {assertMeasurementSourceReadOnly,assertObservedSnapshotFloor} from '../supabase/functions/_shared/measured-provider-db-policy.mjs';
import {selectContentFeedback,loadContentFeedback} from '../supabase/functions/_shared/content-feedback-context.mjs';

const now=new Date('2026-10-28T10:00:00Z');
const lesson={tenant_id:'canonical',learning_id:'blog:cta',component_scope:'blog',status:'PROVEN',claim:'A concrete next step correlated with qualified replies',effect_metric:'qualified_leads',effect_size:.2,sample_size:8,confidence:.8,last_validated_at:'2026-10-27T10:00:00Z',expires_or_review_at:'2026-11-27T10:00:00Z',evidence_refs:['evidence:blog:1']};
test('blog consumes only fresh evidenced lessons for its actual tenant and channel',()=>{
 const result=selectContentFeedback({channel:'blog',tenantId:'canonical',rows:[lesson,{...lesson,tenant_id:'other'},{...lesson,learning_id:'email',component_scope:'email'},{...lesson,learning_id:'stale',last_validated_at:'2026-08-01'}],now});
 assert.deepEqual(result.learning_ids,['blog:cta']);
 assert.equal(result.state,'EVIDENCE_AVAILABLE');
 assert.equal(result.business_improvement_proven,false);
});
test('sparse, future, expired, unknown metrics and unproven lessons remain evidence gaps',()=>{
 for(const variant of [{status:'TESTING'},{sample_size:1},{confidence:.2},{last_validated_at:'2026-10-29'},{expires_or_review_at:'2026-10-27'},{evidence_refs:[]},{effect_metric:'views'},{effect_size:0}]){
  const result=selectContentFeedback({channel:'blog',tenantId:'canonical',rows:[{...lesson,...variant}],now});
  assert.equal(result.state,'INSUFFICIENT_VERIFIED_EVIDENCE');
  assert.deepEqual(result.learning_ids,[]);
 }
});
test('email carries the existing play-specific aggregate verdict without treating sends as learning',async()=>{
 const calls=[];
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:{play_key:'value_first',channel:'email',executed_actions:27,observed_outcomes:2,sample_sufficient:false,policy:'PREFER_WHEN_CONTEXT_MATCHES'},error:null};}};
 const result=await loadContentFeedback(db,{channel:'email',tenantId:'canonical',playKey:'value_first',now});
 assert.equal(calls[0].name,'powerhouse_sales_play_learning_v1');
 assert.deepEqual(calls[0].args,{p_play_key:'value_first',p_channel:'email'});
 assert.equal(result.state,'INSUFFICIENT_VERIFIED_EVIDENCE');
 assert.equal(result.play_feedback.policy,'OBSERVE_ONLY');
 assert.equal(result.business_improvement_proven,false);
});
test('email failure is visible and does not invent an empty successful learning result',async()=>{
 const result=await loadContentFeedback({rpc:async()=>({error:{message:'source unavailable'}})},{channel:'email',tenantId:'canonical',playKey:'value_first',now});
 assert.equal(result.state,'SOURCE_UNAVAILABLE');
 assert.deepEqual(result.learning_ids,[]);
});
test('canonical account email aggregates cannot leak into another tenant',async()=>{
 await assert.rejects(()=>loadContentFeedback({},{channel:'email',tenantId:'bedrijfsgeheugen',playKey:'value_first',now}),/SCOPE_REJECTED/);
});
test('revenue context reads stay tenant- and exact-channel-bound',async()=>{
 const calls=[];
 const query={select(){return this;},eq(k,v){calls.push([k,v]);return this;},order(){return this;},limit:async()=>({data:[lesson],error:null})};
 const result=await loadContentFeedback({from(name){assert.equal(name,'revenue_learnings');return query;}},{channel:'blog',tenantId:'canonical',now});
 assert.deepEqual(calls,[['tenant_id','canonical'],['component_scope','blog'],['status','PROVEN']]);
 assert.deepEqual(result.learning_ids,['blog:cta']);
});
test('actual orchestrator SQL adapter binds feedback reads and rejects feedback writes',async()=>{
 const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 const adapter=source.slice(source.indexOf('function dbIdent('),source.indexOf('\nasync function directRpc(')).replace(/^const directSql=.*$/m,'');
 const code=stripTypeScriptTypes(adapter,{mode:'strip'})+'\nreturn DirectQuery;';
 const calls=[];
 const Query=new Function('directSql','DIRECT_TABLES','assertMeasurementSourceReadOnly','assertObservedSnapshotFloor','DB_JSON_COLUMNS','DB_ARRAY_CASTS','DB_DEFAULT_CONFLICT',code)({unsafe:async(sql,values)=>{calls.push({sql,values});return [lesson];}},new Set(['revenue_learnings']),assertMeasurementSourceReadOnly,assertObservedSnapshotFloor,new Set(['revenue_learnings.evidence_refs']),new Map(),new Map());
 const result=await loadContentFeedback({from:table=>new Query(table)},{channel:'blog',tenantId:'canonical',now});
 assert.deepEqual(result.learning_ids,['blog:cta']);
 assert.deepEqual(calls[0].values,['canonical','blog','PROVEN']);
 for(const verb of ['insert','update','upsert']){
  const response=await new Query('revenue_learnings')[verb]({status:'PROVEN'});
  assert.equal(response.error.message,'DB_FEEDBACK_SOURCE_READ_ONLY');
 }
 assert.equal(calls.length,1);
});
test('both canonical generators consume and persist the same feedback context',()=>{
 for(const path of ['powerhouse-content-orchestrator','powerhouse-commercial-message-composer']){
  const source=fs.readFileSync(new URL('../supabase/functions/'+path+'/index.ts',import.meta.url),'utf8');
  assert.ok(source.includes('await loadContentFeedback(db,'),path+' must actually load feedback');
  assert.ok(source.includes('commercial_feedback:commercialFeedback'),path+' must retain consumed context');
  assert.ok(source.includes('CONTENT_FEEDBACK_GUIDE'),path+' must apply the context policy');
 }
 const orchestrator=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.ok(orchestrator.includes('"revenue_learnings"'),'real direct SQL adapter must allow the existing source');
 assert.ok(orchestrator.includes('generation_evidence:{commercial_feedback:commercialFeedback,'),'feedback must survive artifact write');
 assert.ok(orchestrator.includes('AVAILABLE_NOT_CONSUMED_BY_FROZEN_ARTIFACT'),'frozen source must never claim model consumption');
});
test('native Supabase deployment registers both feedback consumers with their existing custom authentication',()=>{
 const config=fs.readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
 for(const slug of ['powerhouse-content-orchestrator','powerhouse-commercial-message-composer']){
  const header='[functions.'+slug+']';
  assert.ok(config.includes(header),slug+' must participate in native protected-main deployment');
  const section=config.slice(config.indexOf(header)+header.length).split('\n[')[0];
  assert.match(section,/enabled\s*=\s*true/);
  assert.match(section,/verify_jwt\s*=\s*false/);
  assert.ok(section.includes('./functions/'+slug+'/index.ts'));
 }
});
