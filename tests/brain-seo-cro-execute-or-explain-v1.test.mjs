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


test('daily CRO evidence decision is bounded and terminates without claiming publication', async()=>{
  const {planDailyConversion}=await import('../tools/seo-growth/daily-conversion-planner.mjs');
  const url='https://www.bedrijfsgeheugen.nl/afas-koppeling';
  const rows=[{pagina:url,datum:'2026-10-22',opgehaald_op:'2026-10-23T05:00:00Z',zoekterm:'afas koppeling',vertoningen:400,klikken:3,positie:5}];
  const outcome=planDailyConversion({registry:{pages:[{route:url,role:'money'}]},searchRows:rows,now:new Date('2026-10-23T12:00:00Z')});
  assert.equal(outcome.candidates.length,1);
  assert.equal(outcome.candidates[0].action,'title-meta');
  assert.equal(outcome.candidates[0].terminal.state,'REJECTED_WITH_EVIDENCE');
  assert.equal(outcome.candidates[0].terminal.reason_code,'NO_SAFE_REVERSIBLE_CHANGE');
  assert.equal(outcome.candidates[0].auto_publish,false);
  assert.equal(outcome.pages[0].qualifiedLeads,null);
  assert.equal(outcome.publicationStatus,'NOT_PUBLISHED_REQUIRES_PROTECTED_DELIVERY');
});

test('daily CRO runs inside incumbent scheduled Netlify function with exact-project service-role guard',async()=>{
  const fn=await read('netlify/functions/growth-intelligence-daily.mjs');
  assert.match(fn,/schedule:'0 6 \* \* \*'/);
  assert.match(fn,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(fn,/GROWTH_STORE_SERVICE_ROLE_PROJECT_MISMATCH/);
  assert.match(fn,/planDailyConversion/);
  assert.match(fn,/cro_live_changes_verified:0/);
});
