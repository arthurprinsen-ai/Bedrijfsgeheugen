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
 assert.ok(source.includes('projectionFresh?200:207'));
 assert.match(source,/sourceObservationError/);
 assert.match(source,/sourceProjectionStatus=projectionFresh\?'OBSERVED_ORIGINAL_CACHE_WITH_READBACK':'MISSING_FRESH_OWNED_CACHE'/);
 assert.match(source,/new Date\(Date\.now\(\)-7\*86400000\)/);
 assert.doesNotMatch(source,/cron\.schedule|setInterval\(/);
});

test('the new original tenant alignment migration is strict and preserves all other source users',()=>{
 const source=readFileSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url),'utf8');
 assert.match(source,/powerhouse_daily_source_archive_v1/);
 assert.ok(source.includes("WHERE k.tenant_id=''bedrijfsgeheugen''"));
 assert.ok(source.includes("WHERE k.tenant_id=''canonical''"));
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

test('original direct DataForSEO producer logs an empty response without falsely green current keywords',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-dataforseo-intelligence/index.ts',import.meta.url),'utf8');
 assert.ok(source.includes("status:stored>0?'ok':'onvolledig'"));
 assert.ok(source.includes('source_data_available:stored>0'));
 assert.ok(source.includes('provider_response_empty:items.length===0'));
 assert.ok(source.includes("status:stored>0?'KEYWORD_SOURCE_OBSERVED':'NO_NEW_PROVIDER_KEYWORDS'"));
 assert.ok(source.includes('stored>0?200:207'));
 assert.ok(source.includes("p_source_key:'dataforseo-intelligence'"));
 assert.ok(source.includes('no_data_returned:items.length===0'));
});

test('daily Brain archives recent source truth, never claims an older provider cache was retrieved today',()=>{
 const source=readFileSync(new URL('../supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql',import.meta.url),'utf8');
 assert.ok(source.includes("v_end-interval ''7 days''"));
 assert.ok(source.includes("CACHED_PROVIDER_KEYWORDS_WITHIN_7D"));
 assert.ok(source.includes("max(k.observed_at)>=v_start"));
 assert.ok(source.includes("k.observed_at::text"));
 assert.ok(source.includes("k.search_volume::text"));
 assert.ok(source.includes("k.canonical_owner"));
 assert.ok(source.includes("k.locale||'':''||k.market"));
 assert.ok(source.includes("KEYWORD_TENANT_SOURCE_READBACK_FAILED"));
 assert.doesNotMatch(source,/cron\.schedule|CREATE TABLE|DROP TABLE|DISABLE TRIGGER/);
});

test('original DataForSEO Edge function is explicitly registered for protected-main release parity',()=>{
 const cfg=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
 const marker='[functions.powerhouse-dataforseo-intelligence]';
 assert.equal(cfg.split(marker).length-1,1,'the same original producer must have exactly one declaration');
 const body=cfg.slice(cfg.indexOf(marker),cfg.indexOf('[functions.',cfg.indexOf(marker)+marker.length));
 assert.match(body,/enabled\s*=\s*true/);
 assert.match(body,/verify_jwt\s*=\s*false/);
 assert.match(body,/entrypoint\s*=\s*"\.\/functions\/powerhouse-dataforseo-intelligence\/index\.ts"/);
 const edge=readFileSync(new URL('../supabase/functions/powerhouse-dataforseo-intelligence/index.ts',import.meta.url),'utf8');
 assert.match(edge,/x-powerhouse-token/);
 assert.match(edge,/powerhouse_daily_scheduler_token/);
 assert.match(edge,/NO_NEW_PROVIDER_KEYWORDS/);
});
