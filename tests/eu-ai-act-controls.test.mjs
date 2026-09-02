import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEuAiAct} from '../platform/read-models/eu-ai-act-controls.mjs';

const system={tenant_id:'canonical',use_case_id:'copilot',name:'AI Copilot',provider:'Anthropic',model_id:'global.anthropic.test',lifecycle_status:'ACTIVE',approved:true,risk_class:'LIMITED',transparency_required:true,owner:'AI Governance',prohibited_data_categories:['biometric'],evidence_ids:['transparency-evidence'],approval_evidence_ids:['approval']};

test('current controls, future readiness and scoped conclusion are deterministic',()=>{
 const r=evaluateEuAiAct({governance:[system],evidence:{aiLiteracy:true},asOf:'2026-09-02T00:00:00Z'});
 assert.equal(r.controls.find(x=>x.id==='art4-ai-literacy').status,'effective');
 assert.equal(r.controls.find(x=>x.id==='art5-prohibited-practices').status,'effective');
 assert.equal(r.controls.find(x=>x.id==='art50-transparency').status,'effective');
 assert.ok(r.controls.filter(x=>x.id.startsWith('chapter3-')).every(x=>x.status==='not_applicable'));
 assert.match(r.summary.conclusion,/beoordeelde scope/i);
 assert.doesNotMatch(r.summary.conclusion,/certified|EU AI Act compliant/i);
});

test('missing current evidence fails closed with stable finding',()=>{
 const a=evaluateEuAiAct({governance:[system],evidence:{},asOf:'2026-09-02T00:00:00Z'});
 const b=evaluateEuAiAct({governance:[system],evidence:{},asOf:'2026-09-02T00:00:00Z'});
 const f=a.findings.find(x=>x.controlId==='art4-ai-literacy');
 assert.ok(f); assert.equal(f.id,b.findings.find(x=>x.controlId==='art4-ai-literacy').id);
 assert.match(a.summary.conclusion,/evidence-gaps/i);
});

test('high-risk obligations are future readiness on current baseline',()=>{
 const high={...system,risk_class:'HIGH_RISK'};
 const r=evaluateEuAiAct({governance:[high],evidence:{aiLiteracy:true},asOf:'2026-09-02T00:00:00Z'});
 assert.equal(r.controls.find(x=>x.id==='chapter3-annex3-high-risk').status,'future_readiness');
 assert.equal(r.controls.find(x=>x.id==='chapter3-annex1-high-risk').status,'future_readiness');
});
