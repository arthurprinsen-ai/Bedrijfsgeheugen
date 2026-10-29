import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decideSeoBlogCandidate as decide } from '../supabase/functions/powerhouse-seo-opportunity-resolver/blog-decision.mjs';

const pages = [
  {role:'money',route:'https://www.bedrijfsgeheugen.nl/twinfield-koppeling',primary_keyword:'twinfield koppeling'},
  {role:'money',route:'https://www.bedrijfsgeheugen.nl/erp',primary_keyword:'erp proces automatisering',secondary_keywords:['erp software integratie']}
];
const base = {keyword:'erp data integratie',pages,asOf:'2026-10-29T11:00:00Z',
  score:83,search:{impressions:9},
  market:{search_volume:130,cpc:5,observed_at:'2026-10-26T06:00:00Z'}};

test('existing canonical money page and branded alias take priority',()=>{
  assert.equal(decide({...base,existingOwner:pages[0]}).action,'UPDATE_MONEY_PAGE');
  const alias=decide({...base,keyword:'twinfield api'});
  assert.equal(alias.action,'UPDATE_MONEY_PAGE');
  assert.equal(alias.canonical_owner,pages[0].route);
});
test('pending or previous topic prevents duplicate article',()=>{
  const x=decide({...base,blogSlugs:['erp-data-integratie']});
  assert.equal(x.reason,'EXISTING_OR_PENDING_BLOG_INTENT');
});
test('unrelated terms, stale market data and weak commercial evidence reject',()=>{
  assert.equal(decide({...base,keyword:'zomerreizen met korting'}).action,'NO_ACTION_EVIDENCE_INSUFFICIENT');
  assert.equal(decide({...base,market:{...base.market,observed_at:'2026-09-01T00:00:00Z'}}).reason,'DATAFORSEO_MISSING_OR_STALE');
  assert.equal(decide({...base,score:30}).reason,'COMMERCIAL_EVIDENCE_WEAK');
});
test('new content must have independent source evidence',()=>{
  assert.equal(decide({...base,search:null}).reason,'INTENT_OR_SOURCE_UNVERIFIED');
  const evidence={external_sources:[{allowed:true,trust:0.8,published_at:'2026-10-20T00:00:00Z',
    topic:'ERP data',title:'ERP data uitwisseling via integratie'}]};
  const x=decide({...base,search:null,forecast:evidence});
  assert.equal(x.action,'CREATE_INTENT_GAP_CONTENT');
  assert.equal(x.public_release_authorized,false);
});

test('existing resolver uses a single candidate and canonical evidence sources',()=>{
  const source=readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
  assert.match(source,/decideSeoBlogCandidate/);
  assert.match(source,/content_publication_obligations/);
  assert.match(source,/bg_externe_signalen/);
  assert.match(source,/recommendations < 1/);
});

test('skipped legacy blog recommendations never reserve the daily publication slot',()=>{
  const source=readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
  assert.match(source,/\.in\('status',\['suggested','accepted','done'\]\)/);
  assert.match(source,/!hasDailyBlogReservation && recommendations < 1/);
  assert.doesNotMatch(source,/\.eq\('recommendation_type','seo_first_mover_intent_gap'\)\.limit\(1\)/);
});

test('TypeScript status filter contains a real newline, not an escaped two-character sequence',()=>{
  const source=readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
  const escaped=String.fromCharCode(92)+"n        .in('status'";
  const correct=String.fromCharCode(10)+"        .in('status'";
  assert.equal(source.includes(escaped),false,'literal backslash-n prevents the Edge Function bundler from parsing');
  assert.equal(source.includes(correct),true,'status filter must have a genuine newline separator');
});
