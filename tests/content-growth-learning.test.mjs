import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLearningContext, explorationForDate, rankCandidates } from '../tools/content-growth/learning.mjs';

test('materializes configured T+1 T+3 T+7 T+30 horizons', () => {
  const result = buildLearningContext({performance:{content:{},commercialTotals:{orders:0,revenue:0,currency:'EUR'}},now:new Date('2026-09-09T08:00:00Z'),policy:{horizonsDays:[1,3,7,30],minimumSupport:3}});
  assert.deepEqual(result.horizons_days,[1,3,7,30]);
});

test('commercial winner is retained even with sparse support', () => {
  const result=buildLearningContext({performance:{content:{'blog:buyer':{content_id:'blog:buyer',content_type:'blog',events:{order:1},score:100,orders:1,revenue:0}},commercialTotals:{orders:1,revenue:0,currency:'EUR'}},policy:{minimumSupport:3}});
  assert.equal(result.exploit_candidates[0].content_id,'blog:buyer');
});

test('diagnoses high reach without clicks', () => {
  const result=buildLearningContext({performance:{content:{'social:x':{content_id:'social:x',content_type:'social',events:{reach:20},score:20,orders:0,revenue:0}},commercialTotals:{orders:0,revenue:0,currency:'EUR'}},policy:{minimumSupport:3}});
  assert.equal(result.failure_diagnoses[0].diagnosis,'high_reach_low_click');
});

test('default 20 percent exploration yields deterministic one-in-five cadence', () => {
  const policy={explorationRatio:.2}; assert.equal(explorationForDate('2026-09-10',policy),true); assert.equal(explorationForDate('2026-09-11',policy),false);
});

test('rankCandidates favors exploration only on exploration date', () => {
  const candidates=[{content_id:'blog:proven',score:50},{content_id:'blog:new',score:1,exploration:true}];
  assert.equal(rankCandidates({candidates,date:'2026-09-10',policy:{explorationRatio:.2}})[0].content_id,'blog:new');
  assert.equal(rankCandidates({candidates,date:'2026-09-11',policy:{explorationRatio:.2}})[0].content_id,'blog:proven');
});

test('fresh high-value opportunity can outrank historical content performance', () => {
  const candidates=[
    {content_id:'blog:generic-ai',slug:'generic-ai',title:'AI voor bedrijven',keyword:'AI',score:58},
    {content_id:'blog:ai-act-mkb',slug:'ai-act-mkb',title:'AI Act voor het MKB',keyword:'AI Act MKB',score:12}
  ];
  const learning={candidate_scores:{'blog:generic-ai':58},exploit_candidates:[],opportunity_candidates:[{opportunity_key:'opp:ai-act',topic:'Nieuwe AI Act verplichtingen voor MKB',audience:'directie',score:92,decision:{actionType:'create_blog'},content_brief:{problem:'Nieuwe complianceverplichtingen',trigger:'new-regulation',angle:'Wat moet een MKB-directie nu regelen?'}}]};
  const ranked=rankCandidates({candidates,learning,date:'2026-09-09',policy:{explorationRatio:0,opportunityWeight:.8}});
  assert.equal(ranked[0].content_id,'blog:ai-act-mkb');
  assert.equal(ranked[0].opportunity_key,'opp:ai-act');
  assert.match(ranked[0].opportunity_context.angle,/MKB-directie/);
});
