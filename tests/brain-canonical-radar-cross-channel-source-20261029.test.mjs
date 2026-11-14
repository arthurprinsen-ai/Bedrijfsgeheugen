import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectCanonicalRadarSourceQueries, classifyObservationalPersonalSource,RADAR_TOTAL_EXTERNAL_QUERIES,RADAR_PERSONAL_EXTERNAL_QUERIES} from '../supabase/functions/_shared/personal-observational-source-routing.mjs';

const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const originalSql=readFileSync('supabase/migrations/20261027190000_mira_entrepreneur_signal_materializer_v1.sql','utf8');
test('keep SAME eight daily external provider calls, without second scheduler or publishing worker',()=>{
 for(const date of ['2026-10-29','2026-10-30','2026-11-02','2027-01-01']){
  const q=selectCanonicalRadarSourceQueries(date);
  assert.equal(q.length,RADAR_TOTAL_EXTERNAL_QUERIES);
  assert.equal(q.filter(x=>x.channel==='linkedin_personal').length,RADAR_PERSONAL_EXTERNAL_QUERIES);
  assert.equal(q.filter(x=>x.channel==='instagram_company').length,6);
  assert.equal(new Set(q.map(x=>x.query)).size,8);
 }
 assert.match(radar,/selectCanonicalRadarSourceQueries\(runDate\)/);
 assert.doesNotMatch(radar,/cron\.schedule|create table|NETLIFY_DEPLOY/i);
 assert.throws(()=>selectCanonicalRadarSourceQueries('not-a-date'),/MIRA_RUN_DATE_INVALID|RADAR_RUN_DATE_INVALID/);
});
test('public source evidence must be a genuine match for the selected personal-life topic',()=>{
 assert.equal(classifyObservationalPersonalSource({topic:'bezorging-en-pakketten',title:'Pakket bezorging niet aangekomen',excerpt:'Buren ontvangen pakket verkeerd'}),'bezorging-en-pakketten');
 assert.equal(classifyObservationalPersonalSource({topic:'schoolapps-en-oudercommunicatie',title:'Ouders klagen over schoolapp meldingen',excerpt:'Ontvangen veel berichten'}),'schoolapps-en-oudercommunicatie');
 assert.equal(classifyObservationalPersonalSource({topic:'bezorging-en-pakketten',title:'Ondernemer wint prijs',excerpt:'Beter dashboard'}),null);
 assert.equal(classifyObservationalPersonalSource({topic:'onbekend',title:'Pakket bezorgen',excerpt:'Nu'}),null);
});
test('strict channel separation leaves original Mira winner protection in place',()=>{
 assert.match(radar,/channel==='linkedin_personal'\?classifyObservationalPersonalSource/);
 assert.match(radar,/contract:personalTopic\?'personal-observational-life-source-v1':'mira-entrepreneur-portal-story-v1'/);
 assert.match(radar,/source_channel:personalTopic\?'linkedin_personal':'instagram_company'/);
 assert.match(radar,/first_person_claims_present:false/);
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/source_published_at:publication\.publishedAt/);
 assert.match(originalSql,/x\.metadata->>'contract'='mira-entrepreneur-portal-story-v1'/);
 assert.ok(originalSql.includes("coalesce(x.metadata->>'portal_problem_id','')"));
 assert.match(originalSql,/WINNER_ALREADY_FROZEN/);
});
test('personal source collection cannot claim personal lived experience nor relax source verification',()=>{
 assert.match(radar,/source_publication_date_evidence:publication\.publishedAt\?'DATED':'UNVERIFIED'/);
 assert.match(radar,/observational_personal_theme_verified:Boolean\(personalTopic\)/);
 assert.match(radar,/first_person_claims_present:false/);
 assert.match(radar,/max_age_days:MAX_AGE_DAYS/);
 assert.match(radar,/ok:errors\.length===0&&supply\.ok/);
 assert.match(radar,/state:supply\.ok\?'SOURCE_READY':'SOURCE_RECOVERY_DUE'/);
 assert.match(radar,/runDate,stored,eligible,personalStored,personalEligible,providers,max_age_days:MAX_AGE_DAYS/);
});
test('existing source-to-recommendation materializer is called within original radar only',()=>{
 assert.match(radar,/db\.rpc\('powerhouse_ensure_personal_source_rotation_v2',\{p_date:runDate\}\)/);
 assert.match(radar,/db\.rpc\('powerhouse_materialize_mira_problem_recommendation_v1',\{p_date:runDate\}\)/);
 assert.match(radar,/if\(personalRotation\.error\)errors\.push\('personal_source_rotation:'/);
 assert.match(radar,/personalSourceRotation:personalRotation\.data\|\|null/);
 assert.doesNotMatch(radar,/linkedin_create_post|INSTAGRAM_PUBLISH|cron\.schedule/i);
});

test('shared source_url cannot silently overwrite the other channel contract',()=>{
 assert.match(radar,/select\('metadata'\)\.eq\('source_url',sourceUrl\)\.maybeSingle\(\)/);
 assert.match(radar,/priorContract && priorContract!==row\.metadata\.contract/);
 assert.match(radar,/source_contract_collision_skipped/);
 assert.match(radar,/if\(prior\.error\)\{errors\.push\('source_contract_read:'\+prior\.error\.message\);continue\}/);
});

// 2026-10-29 production probe #16037 returned 7 DataForSEO 40101/no-news results
// (personalEligible=0). Short news keywords maximize recall without extra calls.
test('personal-life radar queries are short and rotate without relaxing evidence gates',()=>{
 for(const day of ['2026-10-29','2026-10-30','2026-10-31','2026-11-01']){
  const all=selectCanonicalRadarSourceQueries(day);
  const personal=all.filter(x=>x.channel==='linkedin_personal');
  assert.equal(all.length,8);
  assert.equal(personal.length,2);
  assert.ok(personal.every(x=>x.query.trim().split(/\s+/).length<=3));
  assert.ok(personal.every(x=>!x.query.toLowerCase().includes(' ervaringen ')));
 }
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/MAX_AGE_DAYS=45/);
});

import {MIRA_SOURCE_TOPIC_QUERIES,MIRA_SOURCE_ALTERNATE_QUERIES,MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES,selectMiraSourceQueries} from '../supabase/functions/_shared/mira-source-query-rotation.mjs';

test('original Mira low-recall rotating query variants keep 6 business + 2 personal slots and all proof gates',()=>{
 assert.equal(MIRA_SOURCE_TOPIC_QUERIES.length,12);
 assert.equal(Object.keys(MIRA_SOURCE_ALTERNATE_QUERIES).length,12);
 assert.equal(Object.keys(MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES).length,12);
 const original=new Set(),alternates=new Set(),distinct=new Set();
 for(let offset=0;offset<180;offset++){
  const day=new Date(Date.UTC(2026,10,1+offset)).toISOString().slice(0,10);
  const all=selectCanonicalRadarSourceQueries(day);
  const business=all.filter(x=>x.channel==='instagram_company');
  assert.equal(all.length,8);
  assert.equal(business.length,6);
  assert.equal(all.filter(x=>x.channel==='linkedin_personal').length,2);
  assert.deepEqual(business.map(x=>x.query),selectMiraSourceQueries(day).slice(0,6));
  assert.equal(new Set(all.map(x=>x.query)).size,8);
  for(const {query} of business){
   const fam=MIRA_SOURCE_TOPIC_QUERIES.find(f=>f.query===query||MIRA_SOURCE_ALTERNATE_QUERIES[f.topic]===query||MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[f.topic]===query);
   assert.ok(fam,'each query is inside the approved original portal family list');
   assert.ok(query.split(/\s+/).length<=5);
   if(query===fam.query)original.add(fam.topic); else if(query===MIRA_SOURCE_ALTERNATE_QUERIES[fam.topic])alternates.add(fam.topic); else distinct.add(fam.topic);
  }
 }
 assert.equal(original.size,12);
 assert.equal(alternates.size,12);
 assert.equal(distinct.size,12);
 assert.throws(()=>selectMiraSourceQueries('2026-02-30'),/MIRA_RUN_DATE_INVALID/);
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(originalSql,/x\.metadata->>'contract'='mira-entrepreneur-portal-story-v1'/);
 assert.match(originalSql,/prior\.source_url=x\.source_url or prior\.source_hash=x\.source_hash/);
 assert.doesNotMatch(radar,/cron\.schedule|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
});

test('Mira agent and skill preserve original single producer, publisher and consumer ACK',()=>{
 const registry=readFileSync('platform/agents/agent-team.mjs','utf8');
 const guide=readFileSync('AGENTS.md','utf8');
 const skill=readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
 for(const value of ['reconcile-mira-unique-source-to-original-exclusive-producer-claim','verify-canonical-instagram-bedrijfsgeheugen-account-before-provider-write','require-mira-provider-readback-to-brain-heartbeat-portal-consumer-ack'])assert.ok(registry.includes(value));
 for(const value of ['cron #120','powerhouse-content-loop','powerhouse-instagram-media-router','powerhouse-social-publisher','content_publication_obligations','social-learning-store','bedrijfsgeheugen.nl','consumer receipt'])assert.ok(skill.includes(value),value);
 assert.match(guide,/MIRA_UNIQUE_SOURCE_WINNER_REQUIRED/);
 assert.match(guide,/MIRA_PRODUCER_CLAIM_REQUIRED/);
 assert.match(guide,/geen LIVE_PROVEN zonder echte Meta-provider ID/i);
});
