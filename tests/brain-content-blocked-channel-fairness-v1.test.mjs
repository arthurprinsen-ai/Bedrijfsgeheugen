import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const start=source.indexOf('function shouldPreserveExisting(');
const end=source.indexOf('\n\nDeno.serve(',start);
assert.ok(start>=0&&end>start,'canonical preserve helper exists');
const helper=source.slice(start,end);

// Evaluate the canonical helper with its real dependencies (no copied logic).
function functionSource(name){
  const from=source.indexOf(`function ${name}(`);
  assert.ok(from>=0,`${name} exists`);
  const to=source.indexOf('\n}\n',from);
  return source.slice(from,to+3);
}
const constants=(source.match(/^const (?:PERSONAL_[A-Z_]+|COVERED_STATES) = .*$/gm)||[]).join('\n');
const deps=['validPersonalSource','recoverableUniquenessDenial','recoverableObligationUniquenessDenial'].map(functionSource).join('\n');
const clean=(value)=>String(value??'').trim();
const code=stripTypeScriptTypes(`${constants}\n${deps}\n${helper}`,{mode:'strip'});
const canonicalPreserve=new Function('clean',code+'\nreturn shouldPreserveExisting;')(clean);
const preserve=(row,channel,personalSource,obligation=null)=>canonicalPreserve(row,channel,personalSource,new Set(),obligation);

const identity={identity_contract:'arthur-personal-linkedin-identity-v4',identity_gate_version:'channel-identity-hard-gate-v3',content_id:'content-1',source_lineage:['lineage-1'],arthur_anchor_verified:true,corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false};
const builderSource=(over={})=>({status:'accepted',target_channel:'linkedin_personal',evidence:{...identity,ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',build_event_verified:true,source_backed:true,business_topic:true,...over}});
const observationalSource=(over={})=>({status:'accepted',target_channel:'linkedin_personal',evidence:{...identity,observational_personal_theme_verified:true,public_theme_source_verified:true,first_person_claims_present:false,personal_life_topic:true,business_topic:false,personal_life_only_verified:true,...over}});

test('a repeated unverified first-person claim must not starve due company and blog',()=>{
  const personal={channel:'linkedin_personal',state:'blocked',decision:'publish',priority:100,delivery_evidence:{error:'PERSONAL_SOURCE_UNVERIFIED'}};
  const company={channel:'linkedin_company',state:'decided',decision:'publish',priority:99,delivery_evidence:{}};
  const incompleteSource={status:'accepted',target_channel:'linkedin_personal',evidence:{ai_native_builder_story_verified:true,build_event_verified:true}};
  assert.equal(preserve(personal,'linkedin_personal',incompleteSource),true,'hold personal existing claim without complete source truth');
  assert.equal(preserve(company,'linkedin_company',incompleteSource),false,'company remains executable');
  const eligible=[personal,company].filter(x=>!preserve(x,x.channel,incompleteSource)).map(x=>x.channel);
  assert.deepEqual(eligible,['linkedin_company']);
});

test('genuinely new personal evidence resumes same blocked claim, not duplicate post',()=>{
  const blocked={state:'blocked',delivery_evidence:{error:'PERSONAL_SOURCE_UNVERIFIED'}};
  assert.equal(preserve(blocked,'linkedin_personal',builderSource()),false);
  assert.equal(preserve(blocked,'linkedin_personal',observationalSource()),false);
  assert.equal(preserve(blocked,'linkedin_personal',observationalSource({public_theme_source_verified:false})),true);
});

test('provider side effects are never reopened and hard auth failures remain separately recoverable',()=>{
  assert.equal(preserve({state:'published',delivery_evidence:{}},'linkedin_company',null),true);
  assert.equal(preserve({state:'blocked',delivery_ref:'urn:li:share:123',delivery_evidence:{provider_create_success:true}},'linkedin_company',null),true);
  assert.equal(preserve({state:'blocked',delivery_evidence:{error:'LINKEDIN_REAUTH_REQUIRED'}},'linkedin_personal',null),false);
  // A consumed daily publication authority without a delivery ref may hide a provider mutation: never re-decide.
  assert.equal(canonicalPreserve({state:'blocked',delivery_evidence:{}},'linkedin_company',null,new Set(['linkedin_company'])),true);
});

test('source preserves existing single owner and does not create a new dispatch loop',()=>{
  assert.match(source,/eq\('state',\s*'decided'\)/);
  assert.match(source,/order\('priority',\{ascending:false\}\)/);
  assert.match(source,/PERSONAL_SOURCE_UNVERIFIED/);
  assert.doesNotMatch(helper,/insert into|net\.http_post|createClient|cron\.schedule/i);
});
