import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateMiraPublicationFreshness} from '../supabase/functions/_shared/mira-publication-freshness.mjs';

const now=Date.parse('2026-10-25T10:00:00Z');
test('2022 parking article retrieved in 2026 cannot be claimed fresh',()=>{
 const r=evaluateMiraPublicationFreshness({excerpt:'3 okt 2022 — De afgelopen jaren zijn er steeds meer apps',observedAt:now});
 assert.equal(r.status,'STALE_PUBLICATION');assert.equal(r.publishedAt,'2022-10-03T00:00:00.000Z');
 assert.equal(r.score,0);assert.equal(r.eligible,false);
});
test('recent genuine Netherlands source earns recency only from publication date',()=>{
 const r=evaluateMiraPublicationFreshness({excerpt:'24 okt 2026 — Vandaag iets ontdekt',observedAt:now});
 assert.equal(r.status,'FRESH_PUBLICATION_CONFIRMED');assert.equal(r.ageDays,1);assert.equal(r.score,1);assert.equal(r.eligible,true);
});
test('unknown and relative crawl dates are not accepted as proof of publication',()=>{
 for(const x of [{excerpt:'Dit bericht wordt nu gevonden',observedAt:now},
                  {excerpt:'3 days ago — a forum complaint',observedAt:now},
                  {providerPublishedAt:'2 hours ago',observedAt:now}]){
  const r=evaluateMiraPublicationFreshness(x);assert.equal(r.status,'PUBLICATION_DATE_UNKNOWN');assert.equal(r.score,0);assert.equal(r.eligible,false);
 }
});
test('future/invalid dates and conflicts fail closed, leap dates still validate',()=>{
 assert.equal(evaluateMiraPublicationFreshness({excerpt:'27 okt 2026 — test',observedAt:now}).status,'FUTURE_PUBLICATION_DATE');
 assert.equal(evaluateMiraPublicationFreshness({excerpt:'31 feb 2026 — impossible',observedAt:now}).status,'PUBLICATION_DATE_UNKNOWN');
 assert.equal(evaluateMiraPublicationFreshness({excerpt:'3 okt 2022 — old news',providerPublishedAt:'2026-10-24',observedAt:now}).status,'CONFLICTING_PUBLICATION_DATES');
 assert.equal(evaluateMiraPublicationFreshness({excerpt:'29 feb 2024 — leap day',observedAt:now}).status,'STALE_PUBLICATION');
});
test('publisher and materializer must reject stale or unknown records',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../supabase/migrations/20261025113000_mira_source_publication_freshness_guard.sql',import.meta.url),'utf8');
 assert.match(source,/evaluateMiraPublicationFreshness/);
 assert.match(source,/source_published_at:publication\.publishedAt/);
 assert.match(source,/eligible:total>=0\.72&&publication\.eligible/);
 assert.doesNotMatch(source,/const recency=0\.8/);
 assert.match(sql,/x\.source_published_at\s+>=/);
 assert.match(sql,/s\.source_published_at\s+IS NULL/);
 assert.match(sql,/source_publication_date_status/);
 assert.match(sql,/REVOKE EXECUTE/);
 assert.match(sql,/GRANT EXECUTE.*service_role/);
 assert.doesNotMatch(sql,/cron\.schedule|create table|create trigger|net\.http_post/i);
});
