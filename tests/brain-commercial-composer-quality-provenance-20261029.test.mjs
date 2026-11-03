import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composerQualityProvenance,COMPOSER_ACTOR_ID} from '../supabase/functions/_shared/composer-quality-provenance.mjs';

const id='123e4567-e89b-12d3-a456-426614174000', hash='a'.repeat(64);
const make=(values={})=>composerQualityProvenance({actionId:id,hash,contract:'powerhouse-human-commercial-message-composer-v2',previousScore:null,currentScore:0.92,...values});

test('composer identity and evidence reference derive from the actual source writer',()=>{
 const p=make();
 assert.equal(p.agent_id,COMPOSER_ACTOR_ID);
 assert.equal(p.skill_version,'powerhouse-human-commercial-message-composer-v2');
 assert.equal(p.actor_scope,'message_composition');
 assert.equal(p.metric_evidence_ref,`powerhouse_message_quality_v1:${id}:${hash}`);
 assert.equal(p.metric_truth_class,'observed_draft_quality_not_customer_outcome');
 assert.equal(p.before_metric,null);
 assert.equal(p.after_metric,0.92);
 assert.ok(!('revenue_eur' in p)&&!('provider_id' in p));
});
test('measured zero is valid, missing or invalid previous measurement stays UNKNOWN',()=>{
 assert.equal(make({previousScore:0,currentScore:0}).before_metric,0);
 assert.equal(make({previousScore:0,currentScore:0}).after_metric,0);
 assert.equal(make({previousScore:undefined}).before_metric,null);
 assert.equal(make({previousScore:'0.8'}).before_metric,null);
 assert.equal(make({previousScore:Infinity}).before_metric,null);
});
test('cannot create a fake quality metric or a malformed proof reference',()=>{
 for(const score of ['0.9',null,undefined,NaN,Infinity,-1,1.2]){
  assert.throws(()=>make({currentScore:score}),/COMPOSER_QUALITY_PROVENANCE_INVALID/);
 }
 assert.throws(()=>make({actionId:'../../other'}),/COMPOSER_QUALITY_PROVENANCE_INVALID/);
 assert.throws(()=>make({hash:'not-a-hash'}),/COMPOSER_QUALITY_PROVENANCE_INVALID/);
 assert.throws(()=>make({contract:'made-up-agent'}),/COMPOSER_QUALITY_PROVENANCE_INVALID/);
});
test('composer validates quality evidence persistence before updating source action',()=>{
 const src=readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
 const stored=src.indexOf("if(qualityEvidenceError)throw new Error('COMPOSER_QUALITY_PROOF_WRITE:");
 const next=src.indexOf("const provenance=composerQualityProvenance(");
 const actionUpdate=src.indexOf("const {error:uErr}=await db.from('powerhouse_sales_actions').update(update)");
 assert.ok(stored>=0&&next>stored&&actionUpdate>next);
 assert.match(src,/composer:\{contract:CONTRACT,\.\.\.provenance,model:gen\.model/);
 assert.match(src,/if\(qv\.passed\)update\.message_draft=message/);
 assert.match(src,/if\(uErr\)throw new Error\('ACTION_WRITE:/);
});

test('source preflight enforces same real-evidence contract before model invocation',async()=>{
 const {composerSourcePreflight}=await import('../supabase/functions/_shared/composer-quality-provenance.mjs');
 const ready={source_url:'https://example.com/real-story',evidence:{headline:'Concrete verifieerbare wijziging met impact op proces'}};
 const plan={human_readable_context:true,source_trigger_relevance:true};
 assert.deepEqual(composerSourcePreflight(ready,plan).missing,[]);
 assert.equal(composerSourcePreflight(ready,plan).ok,true);
 assert.equal(composerSourcePreflight({...ready,source_url:'http://example.com'},plan).ok,false);
 assert.ok(composerSourcePreflight({...ready,evidence:{headline:'vaag'}},plan).missing.includes('specific_source_context'));
 assert.ok(composerSourcePreflight(ready,{...plan,source_trigger_relevance:false}).missing.includes('source_trigger_relevance'));
 assert.ok(composerSourcePreflight(ready,{...plan,human_readable_context:false}).missing.includes('human_readable_context'));
 const source=readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
 const guard=source.indexOf('const sourceGate=composerSourcePreflight(workingAction,workingAction.message_plan)');
 const modelCall=source.indexOf('const gen=await generate(');
 const gateResult=source.indexOf("status:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'");
 assert.ok(guard>=0&&gateResult>guard&&modelCall>gateResult);
 assert.match(source,/const sourceSpecificEvidenceOk=composerSourcePreflight\(action,plan\)\.ok/);
 assert.match(source,/model_generated:false/);
});
