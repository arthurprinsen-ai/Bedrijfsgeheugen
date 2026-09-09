import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMetricSnapshot, transitionLearningState } from '../netlify/functions/_social-learning-model.mjs';

test('post outcome can flow to a proven learning application and later verification',()=>{
  const snapshot=normalizeMetricSnapshot({impressions:1000,comments:40,shares:10,saves:10,qualified_leads:2});
  assert.equal(snapshot.comments,40);
  const evidence={sampleSize:6,publicationDates:['2026-09-01','2026-09-02'],confidence:.82,effectSize:.31,directionConsistent:true,higherPriorityContradiction:false};
  const state=transitionLearningState('TESTING',evidence,{promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75}});
  const application={postId:'p2',learningId:'L1',expectedEffect:.2,actualEffect:.31,verificationStatus:state==='PROVEN'?'VERIFIED':'PENDING'};
  assert.equal(application.verificationStatus,'VERIFIED');
});
