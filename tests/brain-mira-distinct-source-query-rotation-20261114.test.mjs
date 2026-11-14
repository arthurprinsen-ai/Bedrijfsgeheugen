import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  MIRA_SOURCE_TOPIC_QUERIES,
  MIRA_SOURCE_ALTERNATE_QUERIES,
  selectMiraSourceQueries
} from '../supabase/functions/_shared/mira-source-query-rotation.mjs';
import {MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES,rotateDistinctMiraQueries}
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
  const words=[f.query,MIRA_SOURCE_ALTERNATE_QUERIES[f.topic],MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[f.topic]];
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
    if([f.query,MIRA_SOURCE_ALTERNATE_QUERIES[f.topic],MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[f.topic]].includes(item.query)){
      observed.add(f.topic+':'+(item.query===f.query?'primary':item.query===MIRA_SOURCE_ALTERNATE_QUERIES[f.topic]?'alternate':'distinct'));
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
