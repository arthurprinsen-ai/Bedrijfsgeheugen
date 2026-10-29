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
 assert.match(radar,/return json\(\{ok:errors\.length===0,runDate,stored,eligible,personalStored,personalEligible/);
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
