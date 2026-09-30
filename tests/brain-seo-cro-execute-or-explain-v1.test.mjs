import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('SEO/CRO daily material opportunities execute or reject with evidence', async()=>{
  const [skill,cfgText,oneBrainText,learning,doc,ledger]=await Promise.all([
    read('.agents/skills/seo-revenue-growth/SKILL.md'),
    read('config/seo-growth-loop.json'),
    read('config/powerhouse-one-loop-v1.json'),
    read('brain/learning/2026-09-30-seo-cro-execute-or-explain-v1.json'),
    read('docs/changes/2026-09-30-seo-cro-execute-or-explain-v1.md'),
    read('docs/development-ledger-events/2026-09-30-seo-cro-execute-or-explain-v1.md')
  ]);
  const cfg=JSON.parse(cfgText);
  const oneBrain=JSON.parse(oneBrainText);
  const c=cfg.optimization.daily_terminal_contract;
  const l=JSON.parse(learning);
  assert.deepEqual(c.terminal_states,['EXECUTED','REJECTED_WITH_EVIDENCE']);
  assert.equal(c.recommendation_only_is_contract_failure,true);
  assert.equal(c.execute_when_safe_reversible_evidence_gated_change_exists,true);
  assert.equal(c.transient_ci_or_tool_failure_is_recovery_not_rejection,true);
  assert.ok(c.rejection_reason_codes.includes('INSUFFICIENT_CONVERSION_EVIDENCE'));
  assert.ok(skill.includes('Execute-or-explain terminal contract'));
  const inherited=oneBrain.oneBrainConstitution.seoCroExecutionContract;
  assert.equal(inherited.recommendationOnlyForbidden,true);
  assert.equal(inherited.inheritance.chats,true);
  assert.equal(inherited.inheritance.agents,true);
  assert.equal(inherited.inheritance.skills,true);
  assert.equal(inherited.inheritance.futureCapabilities,true);
  assert.equal(l.compiler.failure_class,'MATERIAL_OPPORTUNITY_REPORTED_WITHOUT_EXECUTION_OR_REJECTION_EVIDENCE');
  assert.ok(doc.includes('recommendation-only'));
  assert.ok(ledger.includes('recovery work'));
});
