import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const start=source.indexOf('function shouldPreserveExisting(');
const end=source.indexOf('\n\nDeno.serve(',start);
assert.ok(start>=0&&end>start,'canonical preserve helper exists');
const helper=source.slice(start,end).replace('(row:any, channel:string, personalSource:any)','(row, channel, personalSource)');
const clean=(value)=>String(value??'').trim();
const covered=new Set(['content_ready','scheduled','published','measured','learned','skipped']);
const preserve=Function('clean','COVERED_STATES',helper+'; return shouldPreserveExisting;')(clean,covered);

test('a repeated unverified first-person claim must not starve due company and blog',()=>{
  const personal={channel:'linkedin_personal',state:'blocked',decision:'publish',priority:100,delivery_evidence:{error:'PERSONAL_SOURCE_UNVERIFIED'}};
  const company={channel:'linkedin_company',state:'decided',decision:'publish',priority:99,delivery_evidence:{}};
  const sourceEvidence={evidence:{ai_native_builder_story_verified:true,build_event_verified:true}};
  assert.equal(preserve(personal,'linkedin_personal',sourceEvidence),true,'hold personal existing claim without source truth');
  assert.equal(preserve(company,'linkedin_company',sourceEvidence),false,'company remains executable');
  const eligible=[personal,company].filter(x=>!preserve(x,x.channel,sourceEvidence)).map(x=>x.channel);
  assert.deepEqual(eligible,['linkedin_company']);
});

test('genuinely new personal evidence resumes same blocked claim, not duplicate post',()=>{
  const blocked={state:'blocked',delivery_evidence:{error:'PERSONAL_SOURCE_UNVERIFIED'}};
  assert.equal(preserve(blocked,'linkedin_personal',{evidence:{personal_truth_verified:true}}),false);
  assert.equal(preserve(blocked,'linkedin_personal',{evidence:{observational_personal_theme_verified:true,public_theme_source_verified:true,first_person_claims_present:false}}),false);
  assert.equal(preserve(blocked,'linkedin_personal',{evidence:{observational_personal_theme_verified:true,public_theme_source_verified:false}}),true);
});

test('provider side effects are never reopened and hard auth failures remain separately recoverable',()=>{
  assert.equal(preserve({state:'published',delivery_evidence:{}},'linkedin_company',null),true);
  assert.equal(preserve({state:'blocked',delivery_ref:'urn:li:share:123',delivery_evidence:{provider_create_success:true}},'linkedin_company',null),true);
  assert.equal(preserve({state:'blocked',delivery_evidence:{error:'LINKEDIN_REAUTH_REQUIRED'}},'linkedin_personal',null),false);
});

test('source preserves existing single owner and does not create a new dispatch loop',()=>{
  assert.match(source,/eq\('state',\s*'decided'\)/);
  assert.match(source,/order\('priority',\{ascending:false\}\)/);
  assert.match(source,/PERSONAL_SOURCE_UNVERIFIED/);
  assert.doesNotMatch(helper,/insert into|net\.http_post|createClient|cron\.schedule/i);
});
