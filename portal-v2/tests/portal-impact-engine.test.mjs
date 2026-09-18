import test from 'node:test';
import assert from 'node:assert/strict';
import { impactForMutation, sourcePageForPath } from '../portal-impact-engine.js';

const maturity=level=>Object.fromEntries(['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'].map(id=>[id,level]));

test('profile mutation expands to all causal consumers and reports money and fte impact',()=>{
  assert.equal(sourcePageForPath('portal.profile.employees'),'profiel');
  const before={portal:{profile:{employees:24,hourlyCost:50,maturity:maturity(2)},businessCase:{target:4,delay:6,investment:10000}}};
  const after=structuredClone(before);after.portal.profile.employees=30;
  const impact=impactForMutation({path:'portal.profile.employees',before,after});
  assert.ok(impact.affectedPages.includes('businesscase'));
  assert.ok(impact.affectedPages.includes('overzicht'));
  assert.ok(impact.affectedPages.includes('advies'));
  assert.ok(impact.changes.some(x=>x.id==='manual-work-annual'&&x.unit==='money'));
  assert.ok(impact.changes.some(x=>x.id==='fte-lost'&&x.unit==='fte'));
});

test('financial mutation reports downstream enterprise and equity value',()=>{
  const before={portal:{metrics:{revenue:1000000,ebitda:100000,grossMargin:40},valueFinance:{multiple:5,debt:100000,cash:50000,balance:800000,equity:300000,fixed:200000,interest:10000}}};
  const after=structuredClone(before);after.portal.metrics.ebitda=150000;
  const impact=impactForMutation({path:'portal.metrics.ebitda',before,after});
  assert.ok(impact.affectedPages.includes('waarde-financiering'));
  assert.ok(impact.changes.some(x=>x.id==='enterprise-value'&&x.delta===250000));
  assert.ok(impact.changes.some(x=>x.id==='equity-value'&&x.delta===250000));
});

test('compliance mutation changes risk and final synthesis consumers',()=>{
  const before={portal:{compliance:{policies:{0:'ontbreekt'},esg:{0:0}}}};
  const after={portal:{compliance:{policies:{0:'geoefend'},esg:{0:3}}}};
  const impact=impactForMutation({path:'portal.compliance.policies.0',before,after});
  assert.ok(impact.changes.some(x=>x.id==='compliance-risk'));
  assert.ok(impact.affectedPages.includes('eindconclusie'));
});
