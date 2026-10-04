import test from 'node:test';
import assert from 'node:assert/strict';
import { project, confidence } from '../portal-v2/nextgen-intelligence.js';

test('Portal V2 Future Lens keeps projections bounded and scenario ordered',()=>{
  const metric={value:70,delta:2,label:'Bedrijfsgezondheid'};
  const stress=project(metric,6,'stress').projected;
  const base=project(metric,6,'base').projected;
  const opportunity=project(metric,6,'opportunity').projected;
  assert.ok(stress < base);
  assert.ok(base < opportunity);
  assert.ok(project({value:98,delta:8,label:'Test'},12,'base').projected <= 100);
});

test('Portal V2 Future Lens confidence remains evidence-sensitive and below certainty',()=>{
  assert.ok(confidence({value:70,delta:2}) <= 95);
  assert.ok(confidence({value:null,delta:null}) < confidence({value:70,delta:2}));
});

test('declining trends preserve semantic scenario ordering',()=>{
  const metric={value:62,delta:-3,label:'Kennisborging'};
  const stress=project(metric,6,'stress').projected;
  const base=project(metric,6,'base').projected;
  const opportunity=project(metric,6,'opportunity').projected;
  assert.ok(stress < base);
  assert.ok(base < opportunity);
});
