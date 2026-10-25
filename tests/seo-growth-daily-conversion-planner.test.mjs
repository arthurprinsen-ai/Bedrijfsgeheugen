import test from 'node:test';
import assert from 'node:assert/strict';
import { planDailyConversion } from '../tools/seo-growth/daily-conversion-planner.mjs';
import { mayAutoPublish } from '../tools/seo-growth/optimization-contract.mjs';

const now = new Date('2026-10-23T12:00:00Z');
const home = 'https://www.bedrijfsgeheugen.nl/';
const money = 'https://www.bedrijfsgeheugen.nl/afas-koppeling';
const registry = { pages: [
  { route: home, role: 'pillar', primary_cta: { action: 'zelfscan', url: home + 'zelfscan' } },
  { route: money, role: 'money', primary_cta: { action: 'frisse-blik', url: home + 'frisse-blik' } },
  { route: home + 'blog/article', role: 'support' }
] };
const gsc = (page, impressions, clicks, position = 5) =>
  ({ pagina: page, datum: '2026-10-21', opgehaald_op: '2026-10-22T05:00:00Z',
    zoekterm: 'afas koppeling', vertoningen: impressions, klikken: clicks, positie: position });
const events = (page, name, count) => Array.from({ length: count }, (_, i) => ({
  event_id: name + ':' + i, canonical: page, occurred_at: '2026-10-22T08:00:00Z', event_type: name
}));

test('prioritizes observed low-CTA pages, preserves real downstream outcomes, never auto-publishes', () => {
  const result = planDailyConversion({ now, registry, searchRows: [gsc(money, 300, 30)],
    events: [...events(money, 'page_view', 80), ...events(money, 'engaged_view', 25),
      ...events(money, 'primary_cta_click', 1)],
    outcomes: [{ canonical: money, stage: 'qualified_lead', occurred_at: '2026-10-22T10:00:00Z' }] });
  assert.equal(result.sourceStatus, 'GSC_AND_BEHAVIOR_FRESH');
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].action, 'cta-copy-position');
  assert.equal(result.candidates[0].actual_business_outcomes.qualifiedLeads, 1);
  assert.equal(mayAutoPublish(result.candidates[0]), false);
  assert.equal(result.publicationStatus, 'NOT_PUBLISHED_REQUIRES_PROTECTED_DELIVERY');
});

test('search demand yields CTR candidate or ranking gap, not a new doorway page', () => {
  const candidate = planDailyConversion({ now, registry, searchRows: [gsc(money, 400, 4, 4)] }).candidates[0];
  assert.equal(candidate.action, 'title-meta');
  assert.equal(candidate.target_metric, 'organic_click_through_rate');
  const ranked = planDailyConversion({ now, registry, searchRows: [gsc(money, 400, 4, 18)] }).candidates[0];
  assert.equal(ranked.action, 'content-gap');
});

test('missing sources, samples and stale telemetry fail closed instead of pretending zero conversions', () => {
  const empty = planDailyConversion({ now, registry });
  assert.equal(empty.candidates.length, 0);
  assert.equal(empty.pages[0].views, null);
  const few = planDailyConversion({ now, registry, events: events(money, 'page_view', 3),
    searchRows: [gsc(money, 5, 0)] });
  assert.equal(few.candidates.length, 0);
  const stale = planDailyConversion({ now, registry,
    searchRows: [{ ...gsc(money, 900, 0), opgehaald_op: '2026-09-01T00:00:00Z' }],
    events: [{ ...events(money, 'page_view', 1)[0], occurred_at: '2026-09-01T00:00:00Z' }] });
  assert.equal(stale.candidates.length, 0);
  assert.equal(stale.sourceStatus, 'MISSING_OR_STALE');
});

test('truncated inputs block actions and do not present incomplete outcomes as a zero', () => {
  const result = planDailyConversion({ now, registry,
    searchRows: [gsc(money, 400, 0)], events: events(money, 'page_view', 60),
    searchLimit: 1, outcomes: [] });
  assert.equal(result.sourceStatus, 'PARTIAL_TRUNCATED');
  assert.equal(result.candidates.length, 0);
  assert.equal(result.pages.find(p => p.canonical === money).qualifiedLeads, null);
});

test('unsupported and external URLs are excluded from commercial candidate set', () => {
  const result = planDailyConversion({ now, registry,
    searchRows: [gsc('https://example.com/afas-koppeling', 1000, 0)],
    events: [...events('https://example.com/', 'page_view', 100), ...events(home + 'blog/article', 'page_view', 100)] });
  assert.equal(result.candidates.length, 0);
  assert.equal(result.pagesReviewed, 2);
});


test('bounded existing page-day rollup remains usable when raw pageviews are intentionally not fetched', () => {
  const pageDailyRows = [
    { day: '2026-10-22', updated_at: '2026-10-23T06:00:00Z', canonical: money,
      intent_owner: 'afas', page_views: 80, cta_clicks: 0, qualified_leads: 0, won_orders: 0, revenue_eur: 0 }
  ];
  const result = planDailyConversion({now,registry,searchRows:[gsc(money,400,25)],
    pageDailyRows,events:events(money,'engaged_view',25)});
  assert.equal(result.sourceStatus, 'GSC_AND_BEHAVIOR_FRESH');
  assert.equal(result.pages.find(p=>p.canonical===money).views,80);
  assert.equal(result.pages.find(p=>p.canonical===money).qualifiedLeads,0);
  assert.equal(result.candidates[0].action,'cta-copy-position');
});

test('stale day rollups never imply a current page-wide zero-CTA problem', () => {
  const pageDailyRows = [{ day:'2026-09-29',updated_at:'2026-09-29T10:00:00Z',
    canonical:money,intent_owner:'afas',page_views:900,cta_clicks:0 }];
  const result = planDailyConversion({now,registry,pageDailyRows,events:events(money,'engaged_view',30)});
  assert.equal(result.candidates.length,0);
  assert.equal(result.pages.find(p=>p.canonical===money).views,null);
});

test('daily rollups and sparse events are still bounded and cannot silently truncate',()=>{
  const pageDailyRows=[{day:'2026-10-22',updated_at:'2026-10-23T06:00:00Z',
    canonical:money,page_views:200,cta_clicks:0,intent_owner:'afas'}];
  const result=planDailyConversion({now,registry,pageDailyRows,dailyLimit:1,events:events(money,'engaged_view',20)});
  assert.equal(result.sourceStatus,'PARTIAL_TRUNCATED');
  assert.equal(result.candidates.length,0);
});
