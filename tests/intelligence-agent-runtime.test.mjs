import test from 'node:test';
import assert from 'node:assert/strict';
import { INTELLIGENCE_TYPES, createIntelligenceItem, rankAttention } from '../platform/intelligence/semantics.mjs';
import { createAgentWork, canAgentExecute } from '../platform/agents/agent-work.mjs';
import { planSelfHeal, verifyRecovery } from '../platform/agents/self-heal.mjs';
import { createExternalSignal, canSurfaceExternally } from '../platform/intelligence/external-signals.mjs';

test('AI hypothesis cannot masquerade as fact and requires provenance/confidence', () => {
  assert.throws(() => createIntelligenceItem({ id:'H1', tenantId:'T1', type:INTELLIGENCE_TYPES.HYPOTHESIS, text:'CRM causes delay' }), /provenance/i);
  const item = createIntelligenceItem({ id:'H1', tenantId:'T1', type:INTELLIGENCE_TYPES.HYPOTHESIS, text:'CRM causes delay', provenance:{ sources:['KPI-1'] }, confidence:.8 });
  assert.equal(item.truthClass, 'AIInterpretation');
});

test('management attention is materiality-ranked and permission filtered', () => {
  const ranked = rankAttention([
    { id:'LOW', relevance:.2, impact:.2, urgency:.2, confidence:.9, responsibility:.3, novelty:.1, permitted:true },
    { id:'HIGH', relevance:1, impact:1, urgency:.9, confidence:.9, responsibility:1, novelty:.8, permitted:true },
    { id:'SECRET', relevance:1, impact:1, urgency:1, confidence:1, responsibility:1, novelty:1, permitted:false },
  ]);
  assert.equal(ranked[0].id, 'HIGH');
  assert.equal(ranked.some(x => x.id === 'SECRET'), false);
});

test('AgentWork is shared structured work and high-impact execution is denied', () => {
  const work = createAgentWork({ id:'WORK-1', tenantId:'T1', trigger:'INTEGRATION_FAILED', priority:'P1', primaryAgentId:'AGENT-INTEGRATION', supportAgentIds:['AGENT-RISK','AGENT-QA'], status:'Investigating' });
  assert.equal(work.supportAgentIds.length, 2);
  const decision = canAgentExecute({ autonomyLevel:'L5', actionPolicy:'ALLOW', risk:'High', blastRadius:'High', reversible:true, testsAvailable:true, verifierAvailable:true, budgetAvailable:true });
  assert.equal(decision.allowed, false);
});

test('safe known self-heal can execute but verification failure cannot resolve', () => {
  assert.equal(planSelfHeal({ knownPattern:true, risk:'Low', reversible:true, regressionTestAvailable:true, verificationAvailable:true }).state, 'Execute');
  assert.equal(verifyRecovery({ regressionPassed:true, productionSmokePassed:false, expectedStateObserved:true }).state, 'Escalated');
});

test('external signal is not surfaced without company-context match', () => {
  const noContext = createExternalSignal({ id:'S1', tenantId:'T1', source:'official', domain:'regulation', observedAt:'2026-08-29T10:00:00Z', summary:'new rule', sourceTrust:1, corroboration:1, freshness:1, relevance:1 });
  assert.equal(canSurfaceExternally(noContext).allowed, false);
  const matched = createExternalSignal({ ...noContext, id:'S2', matchedObjectIds:['AIUSE-1'] });
  assert.equal(canSurfaceExternally(matched).allowed, true);
});
