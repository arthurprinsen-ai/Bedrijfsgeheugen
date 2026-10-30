import test from 'node:test';
import assert from 'node:assert/strict';
import {socialChannel,buildChannelTrends} from '../tools/content-growth/social-funnel-trend.mjs';
import {diagnoseDailyPerformance} from '../tools/content-growth/daily-performance-diagnostics.mjs';
import {queries} from '../tools/content-growth/collect-canonical-evidence.mjs';
const now=new Date('2026-10-30T10:00:00Z');
const post=(channel,ageDays,score,i=0)=>({
 tenant_id:channel==='linkedin_personal'?'canonical':'bedrijfsgeheugen',
 channel_kind:channel==='instagram'?'instagram_business':channel,
 platform:channel==='instagram'?'instagram':'linkedin',
 post_id:channel+':'+ageDays+':'+i,
 published_at:new Date(now.getTime()-ageDays*86400000).toISOString(),
 trend_observed_at:new Date(now.getTime()-ageDays*86400000+48*3600000).toISOString(),
 trend_data_quality:'OBSERVED',trend_metrics:{likes:score,comments:score,shares:score},
 observed_at:new Date(now.getTime()-3600000).toISOString(),
 data_quality:'OBSERVED',metrics:{likes:score,comments:score,shares:score,reach:100}
});
test('only bounded explicitly owned channels are admitted',()=>{
 assert.equal(socialChannel(post('linkedin_personal',4,1)), 'linkedin_personal');
 assert.equal(socialChannel(post('linkedin_company',4,1)), 'linkedin_company');
 assert.equal(socialChannel(post('instagram',4,1)), 'instagram');
 assert.equal(socialChannel({...post('linkedin_personal',4,1),tenant_id:'bedrijfsgeheugen'}),null);
 assert.equal(socialChannel({...post('linkedin_company',4,1),channel_kind:null}),null);
 assert.ok(queries.social.includes("s.tenant_id='canonical'"));
 assert.ok(queries.social.includes("s.tenant_id='bedrijfsgeheugen'"));
 assert.ok(queries.social.includes("interval '48 hours'"));
});
test('growth is shown only with 5+ aligned provider observations in each cohort',()=>{
 const rows=[...Array.from({length:5},(_,i)=>post('linkedin_company',3+i*.1,9,i)),
             ...Array.from({length:5},(_,i)=>post('linkedin_company',10+i*.1,3,i))];
 const report=buildChannelTrends(rows,{now});
 assert.equal(report[1].metrics.likes.direction,'RISING');
 assert.equal(report[1].metrics.likes.median_recent_48h,9);
 assert.equal(report[1].metrics.likes.median_baseline_48h,3);
 assert.equal(report[1].metrics.impressions.direction,'INSUFFICIENT_COMPARABLE_SAMPLE');
 assert.equal(report[0].trend_evidence_state,'INSUFFICIENT_COMPARABLE_48H_PROVIDER_EVIDENCE');
});
test('partial source, unsupported metric and missing evidence cannot fabricate a trend',()=>{
 const rows=[...Array.from({length:5},(_,i)=>post('linkedin_personal',3+i*.1,9,i)),
             ...Array.from({length:5},(_,i)=>post('linkedin_personal',10+i*.1,3,i))];
 rows[0].trend_data_quality='OBSERVED_PARTIAL_SCOPE';
 rows[1].trend_observed_at=new Date(now.getTime()+86400000).toISOString();
 const report=buildChannelTrends(rows,{now});
 assert.equal(report[0].metrics.likes.direction,'INSUFFICIENT_COMPARABLE_SAMPLE');
 assert.equal(report[0].metrics.views.median_recent_48h,null);
});
test('daily diagnostics preserve personal channel rather than conflating post IDs',()=>{
 const rows=[post('linkedin_personal',3,3),post('linkedin_company',3,2),post('instagram',3,1)];
 const result=diagnoseDailyPerformance({evidence:{state:'READ_ONLY_PROVIDER_OBSERVED',social:rows,pages:[],sources:[]},now});
 assert.deepEqual(result.social_posts.map(p=>p.channel),['linkedin_personal','linkedin_company','instagram']);
 assert.equal(result.social_channel_trends.length,3);
 assert.ok(result.social_posts.every(p=>p.published_day_hour_nl));
 assert.ok(result.social_channel_trends.every(c=>c.commercial_outcome==='NOT_INFERRED_FROM_ENGAGEMENT'));
});
