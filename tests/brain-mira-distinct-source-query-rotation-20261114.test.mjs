import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  MIRA_SOURCE_TOPIC_QUERIES,
  MIRA_SOURCE_ALTERNATE_QUERIES,
  selectMiraSourceQueries
} from '../supabase/functions/_shared/mira-source-query-rotation.mjs';
import {MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES,MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES,rotateDistinctMiraQueries}
 from '../supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs';
import {selectCanonicalRadarSourceQueries} from '../supabase/functions/_shared/personal-observational-source-routing.mjs';

const radar=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
const materializer=readFileSync(new URL('../supabase/migrations/20261027190000_mira_entrepreneur_signal_materializer_v1.sql',import.meta.url),'utf8');

test('twelve existing approved family searches diversify to three independent, short phrasings',()=>{
 assert.equal(MIRA_SOURCE_TOPIC_QUERIES.length,12);
 const families=MIRA_SOURCE_TOPIC_QUERIES.map(x=>x.topic);
 assert.deepEqual(Object.keys(MIRA_SOURCE_ALTERNATE_QUERIES).sort(),[...families].sort());
 assert.deepEqual(Object.keys(MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES).sort(),[...families].sort());
 for(const f of MIRA_SOURCE_TOPIC_QUERIES){
  const words=[f.query,MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES[f.topic]||MIRA_SOURCE_ALTERNATE_QUERIES[f.topic],MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[f.topic]];
  assert.equal(new Set(words).size,3,f.topic+' must expand query diversity');
  assert.ok(words.every(x=>x.length>4 && x.split(/\s+/).length<=5),f.topic);
 }
});

test('original same eight daily slots always six Mira + two personal and never duplicate today',()=>{
 const observed=new Set();
 for(let offset=0;offset<150;offset++){
  const date=new Date(Date.UTC(2026,10,1+offset)).toISOString().slice(0,10);
  const canonical=selectCanonicalRadarSourceQueries(date);
  const q=rotateDistinctMiraQueries(date,canonical);
  assert.equal(q.length,8);
  assert.equal(q.filter(x=>x.channel==='instagram_company').length,6);
  assert.equal(q.filter(x=>x.channel==='linkedin_personal').length,2);
  assert.equal(new Set(q.map(x=>x.query)).size,8);
  assert.deepEqual(canonical.filter(x=>x.channel==='instagram_company').map(x=>x.query),selectMiraSourceQueries(date).slice(0,6));
  assert.deepEqual(q.filter(x=>x.channel==='linkedin_personal'),canonical.filter(x=>x.channel==='linkedin_personal'));
  for(const item of q.filter(x=>x.channel==='instagram_company')){
   for(const f of MIRA_SOURCE_TOPIC_QUERIES){
    if([f.query,MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES[f.topic]||MIRA_SOURCE_ALTERNATE_QUERIES[f.topic],MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[f.topic]].includes(item.query)){
      observed.add(f.topic+':'+(item.query===f.query?'primary':item.query===(MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES[f.topic]||MIRA_SOURCE_ALTERNATE_QUERIES[f.topic])?'alternate':'distinct'));
    }
   }
  }
 }
 assert.equal(observed.size,36);
});
test('a different query is never itself accepted as a fresh source or publishing permission',()=>{
 assert.match(radar,/evaluateMiraPublicationFreshness\(/);
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/classifyMiraSourceUrl\(sourceUrl\)\.ok/);
 assert.match(radar,/selectCanonicalRadarSourceQueries\(runDate\)/);
 assert.match(radar,/rotateDistinctMiraQueries\(runDate,selectCanonicalRadarSourceQueries\(runDate\)\)/);
 assert.match(radar,/MAX_AGE_DAYS=45/);
 assert.match(materializer,/p_date-90/);
 assert.match(materializer,/p_date-3/);
 assert.match(materializer,/RECOMMENDATION_MATERIALIZED/);
 assert.doesNotMatch(materializer,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|MEDIA_PUBLISH/i);
 const globalShared=readFileSync(new URL('../supabase/functions/_shared/mira-source-query-rotation.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(globalShared,/MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES/);
 const localized=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs',import.meta.url),'utf8');
 assert.match(localized,/ORIGINAL_RADAR_EIGHT_CALL_SCOPE_REQUIRED/);
 assert.match(localized,/MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES/);
 assert.doesNotMatch(localized,/fetch\(|supabase\.rpc|GMAIL_SEND_EMAIL|cron\.schedule/i);

});

test('Mira quote search targets independent dated customer friction, not vendor-release wording',()=>{
 assert.equal(MIRA_SOURCE_ALTERNATE_QUERIES['offertes-zonder-opvolging'],'ondernemers offertes opvolgen');
 assert.equal(MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES['offertes-zonder-opvolging'],
   'offerte blijft liggen klanten');
 assert.equal(MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES['offertes-zonder-opvolging'],
   'offerte geen reactie ondernemer');
 let alternates=0,distinct=0;
 for(let n=0;n<180;n++){
  const date=new Date(Date.UTC(2026,10,1+n)).toISOString().slice(0,10);
  const q=rotateDistinctMiraQueries(date,selectCanonicalRadarSourceQueries(date));
  assert.equal(q.length,8);
  assert.equal(q.filter(x=>x.channel==='instagram_company').length,6);
  assert.equal(q.filter(x=>x.channel==='linkedin_personal').length,2);
  assert.equal(new Set(q.map(x=>x.query)).size,8);
  assert.equal(q.some(x=>x.query==='ondernemers offertes opvolgen'),false);
  if(q.some(x=>x.query==='offerte blijft liggen klanten'))alternates++;
  if(q.some(x=>x.query==='offerte geen reactie ondernemer'))distinct++;
 }
 assert.ok(alternates>0&&distinct>0);
 // No relaxation of existing evidence eligibility or media proof gates.
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/classifyMiraSourceUrl\(sourceUrl\)\.ok/);
});

test('original company concentration query does not fetch broad finance/stock news as an MKB problem',()=>{
 assert.equal(MIRA_SOURCE_ALTERNATE_QUERIES['klantafhankelijkheid'],'ondernemer afhankelijk grote klant',
   'the globally shared canonical queries are never altered here');
 assert.equal(MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES['klantafhankelijkheid'],
   'mkb klantconcentratie omzet');
 assert.equal(MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES['klantafhankelijkheid'],
   'mkb afhankelijkheid omzetconcentratie');
 let seenAlternate=0,seenDistinct=0;
 for(let n=0;n<160;n++){
   const date=new Date(Date.UTC(2026,10,1+n)).toISOString().slice(0,10);
   const original=selectCanonicalRadarSourceQueries(date);
   const next=rotateDistinctMiraQueries(date,original);
   assert.equal(next.length,8);
   assert.equal(next.filter(x=>x.channel==='instagram_company').length,6);
   assert.equal(next.filter(x=>x.channel==='linkedin_personal').length,2);
   assert.equal(next.some(x=>x.query==='ondernemer afhankelijk grote klant'),false,
     'the off-topic, original broad company query is never used by Mira owner');
   if(next.some(x=>x.query==='mkb klantconcentratie omzet'))seenAlternate++;
   if(next.some(x=>x.query==='mkb afhankelijkheid omzetconcentratie'))seenDistinct++;
 }
 assert.ok(seenAlternate>0&&seenDistinct>0,'both original owner query routes must actually be exercised');
 const source=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs',import.meta.url),'utf8');
 assert.match(source,/MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES/);
 assert.doesNotMatch(source,/cron\.schedule|fetch\(|net\.http_post|MEDIA_PUBLISH/);
 const worker=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 assert.match(worker,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(worker,/MAX_AGE_DAYS=45/);
 assert.match(worker,/sourceIntake/);
 assert.match(worker,/powerhouse_materialize_mira_problem_recommendation_v1/);
});


test('18 Nov same eight slots discover real invoice-processing failures instead of generic unpaid-invoice promotion',()=>{
 const date='2026-11-18';
 const original=selectCanonicalRadarSourceQueries(date);
 const targeted=rotateDistinctMiraQueries(date,original);
 assert.equal(original.length,8);
 assert.equal(targeted.length,8);
 assert.equal(targeted.filter(q=>q.channel==='instagram_company').length,6);
 assert.equal(targeted.filter(q=>q.channel==='linkedin_personal').length,2);
 assert.ok(original.some(x=>x.query==='ondernemers onbetaalde facturen'));
 assert.ok(targeted.some(x=>x.query==='bedrijven factuurfouten betalingsachterstanden'));
 assert.equal(targeted.some(x=>x.query==='ondernemers onbetaalde facturen'),false);
 assert.equal(new Set(targeted.map(x=>x.query)).size,8);
 assert.deepEqual(targeted.filter(x=>x.channel==='linkedin_personal'),original.filter(x=>x.channel==='linkedin_personal'));
 assert.equal(MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES.debiteuren,'bedrijven factuurfouten betalingsachterstanden');
 assert.equal(MIRA_SOURCE_ALTERNATE_QUERIES.debiteuren,'ondernemers onbetaalde facturen');
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/source_published_at:publication\.publishedAt/);
 assert.match(radar,/businessEvidence\?\.admissible!==false/);
 assert.match(materializer,/p_date-90/);
 assert.match(materializer,/p_date-3/);
});


test('Nov 18 keeps exactly the original six business and two personal source searches, using shorter independently researchable MKB problems',()=>{
 const date='2026-11-18';
 const original=selectCanonicalRadarSourceQueries(date);
 const rotated=rotateDistinctMiraQueries(date,original);
 assert.equal(rotated.length,8);
 const business=rotated.filter(x=>x.channel==='instagram_company');
 assert.equal(business.length,6);
 assert.equal(rotated.filter(x=>x.channel==='linkedin_personal').length,2);
 assert.deepEqual(business.map(x=>x.query),[
  'Excel administratie fouten','dubbele invoer administratie','bouw meerwerk kosten',
  'krappe marges mkb','bedrijven personeelstekort',
  'bedrijven factuurfouten betalingsachterstanden'
 ]);
 assert.deepEqual(rotated.filter(x=>x.channel==='linkedin_personal'),
   original.filter(x=>x.channel==='linkedin_personal'));
 const local=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(local,/fetch\(|cron\.schedule|net\.http_post|GMAIL_SEND_EMAIL|MEDIA_PUBLISH/);
 assert.match(radar,/businessEvidence\?\.admissible!==false/);
 assert.match(radar,/source_published_at:publication\.publishedAt/);
 assert.match(materializer,/p_date-90/);
 assert.match(materializer,/p_date-3/);
});
