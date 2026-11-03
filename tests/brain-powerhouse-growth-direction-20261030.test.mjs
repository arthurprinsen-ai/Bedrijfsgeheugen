import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectPowerhouseGrowthDirection} from '../netlify/functions/_powerhouse-growth-direction.mjs';
const at='2026-10-30T12:00:00Z';
const rows=Array.from({length:14},(_,i)=>{
 const d=new Date(Date.parse('2026-10-29T00:00:00Z')-i*86400000).toISOString().slice(0,10);
 return {metric_date:d,source_key:'website_interactions',quality:'OBSERVED',source_observed_at:d+'T23:00:00Z',
  metrics:{human_sessions:i<7?10:5,human_clicks:i<7?8:4,robot_events:10000}};
});
const states={growthDaily:'LIVE',emailReplies:'LIVE'};
test('observed complete nonrobot weekly windows yield rising direction without claiming orders',()=>{
 const v=projectPowerhouseGrowthDirection({dailySources:rows,replyEvents:[],readStates:states,at});
 assert.equal(v.website.metrics.human_sessions.direction,'RISING');
 assert.equal(v.website.metrics.human_sessions.relative_change_pct,100);
 assert.equal(v.website.metrics.human_sessions.recent_days,7);
 assert.equal(v.website.metrics.human_clicks.current,56);
 assert.equal(v.qualifiedOrders.paidOrders,null);
 assert.equal(v.qualifiedOrders.websiteToPaidOrderRate,null);
 assert.equal(v.guaranteedUpwardTrend,false);
 assert.equal(v.automatedActionExecution,false);
 assert.ok(v.priorities.every(x=>x.executed===false&&x.verified===false));
});
test('missing 5/7 coverage never becomes zero or a false decline',()=>{
 const v=projectPowerhouseGrowthDirection({dailySources:[...rows.slice(0,4),...rows.slice(7,11)],
   replyEvents:[],readStates:states,at});
 assert.equal(v.website.metrics.human_sessions.direction,'INSUFFICIENT_COMPARABLE_DATA');
 assert.equal(v.website.metrics.human_sessions.current,null);
 assert.equal(v.website.metrics.human_sessions.previous,null);
 assert.equal(v.website.metrics.human_clicks.relative_change_pct,null);
});
test('historic reply events are deduped by source ID and not interpreted as total replies',()=>{
 const a='2026-10-25T12:00:00Z';
 const v=projectPowerhouseGrowthDirection({dailySources:rows,
   replyEvents:[{reply_event_id:'1',occurred_at:a},{reply_event_id:'1',occurred_at:a},
                {reply_event_id:'2',occurred_at:'2026-09-10T12:00:00Z'}],
   readStates:states,at});
 assert.equal(v.email.recordedEvents14d,1);
 assert.equal(v.email.providerCoverage,'NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(v.email.replyRate,null);
 assert.equal(v.email.ordersFromEmail,null);
 assert.equal(v.email.ordersFromConnections,null);
});
test('social provider samples are reused from original age-aligned owner without pooling other identities',()=>{
 const social={status:'COMPARABLE_DESCRIPTIVE_METRICS',channels:[
  {channel:'linkedin_personal',trend_evidence_state:'COMPARABLE_DESCRIPTIVE_METRICS',
    metrics:{views:{direction:'RISING',relative_change_pct:12,recent_samples:6,baseline_samples:10}}},
  {channel:'linkedin_company',trend_evidence_state:'INSUFFICIENT_COMPARABLE_48H_PROVIDER_EVIDENCE',metrics:{}}
 ]};
 const v=projectPowerhouseGrowthDirection({dailySources:rows,replyEvents:[],socialFunnel:social,readStates:states,at});
 assert.equal(v.social[0].metrics.views.direction,'RISING');
 assert.equal(v.social[0].metrics.views.pct,12);
 assert.equal(v.social[1].metrics.views.direction,'INSUFFICIENT_COMPARABLE_SAMPLE');
 assert.equal(v.qualifiedOrders.paidOrders,null);
});
test('missing original source readback fails closed, never simulates zero outcomes',()=>{
 const x=projectPowerhouseGrowthDirection({dailySources:rows,readStates:{growthDaily:'LIVE',emailReplies:'UNAVAILABLE'},at});
 assert.equal(x.status,'UNVERIFIED');
 assert.equal(x.website,null);
 assert.equal(x.qualifiedOrders,null);
 assert.deepEqual(x.priorities,[]);
 assert.throws(()=>projectPowerhouseGrowthDirection({at:'not a date'}),/INVALID_GROWTH_DIRECTION_CLOCK/);
});
test('original owner-only API and portal retain 15-loop, social and CRO gates alongside growth direction',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/projectPowerhouseGrowthDirection/);
 assert.match(api,/select=metric_date,source_key,quality,metrics,source_observed_at&tenant_id=eq.bedrijfsgeheugen/);
 assert.match(api,/select=reply_event_id,occurred_at,provider,reply_class/);
 assert.match(api,/oneLoopAssurance,outreachActions:datasets\[11\],outreachResearch:datasets\[12\]/);
 assert.match(api,/growthDaily:datasets\[13\],emailReplies:datasets\[14\]/);
 assert.match(ui,/Powerhouse · stijgende lijn van bereik naar betaalde orders/);
 assert.match(ui,/Social CRO · LinkedIn persoonlijk, bedrijf en Instagram/);
 assert.match(ui,/ONE BRAIN · commerciële CRO-terugkoppeling/);
 assert.doesNotMatch(ui,/reply_text|sender_email|recipient_email/);
});
