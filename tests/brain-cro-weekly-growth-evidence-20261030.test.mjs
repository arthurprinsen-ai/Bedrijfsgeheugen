import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectWebsiteWeeklyGrowth,projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const at='2026-10-30T12:00:00Z'; // Europe/Amsterdam local day = 30 October.
const rows=Array.from({length:14},(_,i)=>{
  const day=new Date(Date.UTC(2026,9,16+i)).toISOString().slice(0,10);
  return {day,canonical:'/',page_views:i<7?50:70,cta_clicks:i<7?5:9,
    qualified_leads:0,won_orders:0,revenue_eur:0,updated_at:at};
});

test('two seven-day CLOSED calendar windows produce descriptive trends, never order proof',()=>{
  const v=projectWebsiteWeeklyGrowth(rows,{state:'LIVE',at});
  assert.equal(v.status,'COMPARABLE_DESCRIPTIVE_OBSERVATIONS');
  assert.deepEqual(v.baseline,{from:'2026-10-16',through:'2026-10-22'});
  assert.deepEqual(v.recent,{from:'2026-10-23',through:'2026-10-29'});
  assert.deepEqual(v.metrics.page_views,{previous:350,current:490,changePct:40,direction:'UP'});
  assert.equal(v.metrics.cta_clicks.current,63);
  assert.equal(v.ctaRate.previous,10);
  assert.equal(v.ctaRate.current,12.86);
  assert.equal(v.businessClaims.paidOrdersVerified,false);
  assert.equal(v.businessClaims.uniqueVisitorsKnown,false);
});

test('missing days are UNKNOWN and prevent false upward growth or fabricated zero traffic',()=>{
  const v=projectWebsiteWeeklyGrowth(rows.filter(r=>r.day!=='2026-10-25'),{state:'LIVE',at});
  assert.equal(v.status,'UNVERIFIED');
  assert.equal(v.reason,'INCOMPLETE_DAILY_COVERAGE');
  assert.deepEqual(v.missingDays,['2026-10-25']);
  assert.equal(v.metrics,null);
  const summary=projectOtherData({at,daily:rows.slice(0,13),readStates:{daily:'LIVE'}});
  assert.equal(summary.websiteWeeklyGrowth.status,'UNVERIFIED');
  assert.ok(summary.quality.flags.includes('WEEKLY_WEBSITE_GROWTH_EVIDENCE_INCOMPLETE'));
});

test('baseline zero is not silently converted to 100 percent growth',()=>{
  const zeros=rows.map((r,i)=>({...r,page_views:i<7?0:50,cta_clicks:i<7?0:2}));
  const v=projectWebsiteWeeklyGrowth(zeros,{state:'LIVE',at});
  assert.equal(v.status,'LOW_SAMPLE_DESCRIPTIVE_ONLY');
  assert.equal(v.metrics.page_views.changePct,null);
  assert.equal(v.metrics.page_views.direction,'BASELINE_ZERO');
  assert.equal(v.ctaRate.previous,null);
});

test('missing provider/source evidence and malformed metrics fail closed',()=>{
  assert.equal(projectWebsiteWeeklyGrowth(rows,{state:'TRUNCATED',at}).status,'UNVERIFIED');
  assert.equal(projectWebsiteWeeklyGrowth(rows.map(r=>r.day==='2026-10-29'?{...r,page_views:null}:r),{state:'LIVE',at}).reason,'INVALID_OR_MISSING_DAY_METRIC');
  assert.equal(projectWebsiteWeeklyGrowth(rows,{state:'LIVE',at:'not a date'}).reason,'INVALID_OBSERVATION_DATE');
});

test('same original read-only CRO endpoint and portal: no second owner or paid-outcome claim',()=>{
  const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
  const portal=readFileSync('portal-v2/modules/andere-data.js','utf8');
  assert.match(api,/projectWebsiteWeeklyGrowth\(daily,/);
  assert.match(api,/growth_page_daily/);
  assert.match(portal,/Websitegroei · twee volledig afgesloten weken/);
  assert.match(portal,/geen berekende unieke bezoekers/);
  assert.match(portal,/betaalde-orders-conversie/);
  assert.doesNotMatch(api,/setInterval|cron\.schedule|CREATE TABLE/);
});
