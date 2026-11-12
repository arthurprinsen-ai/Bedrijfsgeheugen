import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planOriginalSeoKeywordCacheProjection} from '../supabase/functions/powerhouse-seo-opportunity-resolver/keyword-cache-bridge.mjs';

const now='2026-11-12T18:00:00Z';
const base={zoekwoord:'api koppeling laten maken',bron:'dataforseo',zoekvolume:90,
 cpc:6.41,concurrentie:0.55,opgehaald_op:'2026-11-09T06:00:08.939Z'};
const canonicalOwner={route:'https://www.bedrijfsgeheugen.nl/api-koppeling-laten-maken',
 match_score:1,role:'money',primary_cta:{url:'https://www.bedrijfsgeheugen.nl/frisse-blik'}};
const resolveOwner=keyword=>keyword==='api koppeling laten maken'?canonicalOwner:null;

test('only eligible fresh original DataForSEO cache is mapped to canonical SEO/BRAIN rows',()=>{
 const r=planOriginalSeoKeywordCacheProjection([base],{resolveOwner,asOf:now});
 assert.equal(r.rows.length,1);
 const item=r.rows[0];
 assert.equal(item.tenant_id,'canonical');assert.equal(item.locale,'nl');assert.equal(item.market,'Netherlands');
 assert.equal(item.keyword,'api koppeling laten maken');
 assert.equal(item.search_volume,90);
 assert.equal(item.canonical_owner,canonicalOwner.route);
 assert.equal(item.conversion_destination,'https://www.bedrijfsgeheugen.nl/frisse-blik');
 assert.equal(item.observed_at,base.opgehaald_op);
 assert.equal(item.cpc_eur,null,'Never mislabel provider paid CPC as verified EUR');
 assert.equal(item.competition_index,null,'Paid ad competition cannot become organic difficulty');
 assert.equal(item.evidence.cache_projection_not_new_provider_fetch,true);
 assert.equal(item.evidence.traffic_visits,'NOT_MEASURED');
 assert.equal(item.evidence.exact_provider_event_id,'NOT_PRESENT_IN_ORIGINAL_CACHE');
 assert.equal(r.noNewScheduler,true);
});

test('stale, future, unrelated, duplicate and missing-owner sources cannot become current growth proof',()=>{
 const rows=[
  {...base,opgehaald_op:'2026-11-01T00:00:00Z'},
  {...base,opgehaald_op:'2026-11-13T00:00:00Z'},
  {...base,bron:'tavily'},
  {...base,zoekwoord:'online dobbelsteen',zoekvolume:50000},
  {...base,zoekvolume:null},
 ];
 const p=planOriginalSeoKeywordCacheProjection(rows,{resolveOwner,asOf:now});
 assert.equal(p.accepted,0);
 assert.equal(p.rejected.old,1);
 assert.equal(p.rejected.timestamp,1);
 assert.equal(p.rejected.source,1);
 assert.equal(p.rejected.owner,1);
 assert.equal(p.rejected.volume,1);
});

test('previous verified newer cache source is immutable against an older replay',()=>{
 const p=planOriginalSeoKeywordCacheProjection([base],{resolveOwner,asOf:now,
 existingRows:[{keyword:base.zoekwoord,observed_at:'2026-11-11T06:00:00Z'}]});
 assert.equal(p.rows.length,0);
 assert.equal(p.rejected.already_projected,1);
});

test('no new fake provider freshness is created from copied cache rows',()=>{
 const p=planOriginalSeoKeywordCacheProjection([base],{resolveOwner,asOf:now});
 assert.equal(p.rows[0].observed_at,'2026-11-09T06:00:08.939Z');
 assert.notEqual(p.rows[0].observed_at,now);
 assert.equal(p.sourceFreshness,'CACHE_OBSERVATION_ONLY');
 assert.equal(p.rows[0].source,'dataforseo-original-keyword-cache');
});

test('the original existing cron #105 owns writes and checks independent durable source readback',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-seo-opportunity-resolver/index.ts',import.meta.url),'utf8');
 assert.match(source,/planOriginalSeoKeywordCacheProjection/);
 assert.match(source,/\.eq\('tenant_id','canonical'\)/);
 assert.match(source,/onConflict:'tenant_id,locale,market,keyword'/);
 assert.match(source,/SEO_ORIGINAL_KEYWORD_PROJECTION_READBACK/);
 assert.match(source,/SEO_ORIGINAL_KEYWORD_CONSUMER_READBACK_MISMATCH/);
 assert.match(source,/observed_at:expectedRow.observed_at|sourceProjection\.rows\.map\(x=>x\.observed_at\)/);
 assert.match(source,/source_projection:sourceProjectionReceipt/);
 assert.match(source,/sourceObservationError/);
 assert.match(source,/sourceProjectionStatus=projectionFresh\?'OBSERVED_ORIGINAL_CACHE_WITH_READBACK':'MISSING_FRESH_OWNED_CACHE'/);
 assert.match(source,/new Date\(Date\.now\(\)-7\*86400000\)/);
 assert.doesNotMatch(source,/cron\.schedule|setInterval\(/);
});

test('the new original tenant alignment migration is strict and preserves all other source users',()=>{
 const source=readFileSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url),'utf8');
 assert.match(source,/powerhouse_daily_source_archive_v1/);
 assert.match(source,/WHERE k\.tenant_id='bedrijfsgeheugen'/);
 assert.match(source,/WHERE k\.tenant_id='canonical'/);
 assert.match(source,/tenant_canonical_only_keyword_projection/);
 assert.match(source,/KEYWORD_TENANT_SOURCE_DEFINITION_DRIFT/);
 assert.doesNotMatch(source,/cron\.schedule|CREATE TABLE|DISABLE TRIGGER/);
});

test('a plausible URL without independently scored original intent-owner confidence cannot authorize projection',()=>{
 const unsignedOwner=()=>({route:'https://www.bedrijfsgeheugen.nl/api-koppeling-laten-maken',
   role:'money',primary_cta:{url:'https://www.bedrijfsgeheugen.nl/frisse-blik'}});
 const r=planOriginalSeoKeywordCacheProjection([base],{resolveOwner:unsignedOwner,asOf:now});
 assert.equal(r.accepted,0);
 assert.equal(r.rejected.owner,1);
});
