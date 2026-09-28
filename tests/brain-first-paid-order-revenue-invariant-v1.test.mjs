import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('One Brain prioritizes first paid order and realized revenue',async()=>{
 const [cfgText,skill,learning,doc,ledger]=await Promise.all([
  read('config/powerhouse-one-loop-v1.json'),
  read('.agents/skills/seo-revenue-growth/SKILL.md'),
  read('brain/learning/2026-09-28-first-paid-order-revenue-invariant-v1.json'),
  read('docs/changes/2026-09-28-first-paid-order-revenue-invariant-v1.md'),
  read('docs/development-ledger-events/2026-09-28-first-paid-order-revenue-invariant-v1.md')
 ]);
 const cfg=JSON.parse(cfgText); const r=cfg.oneBrainConstitution.revenueNorthStar; const l=JSON.parse(learning);
 assert.equal(r.primaryObjectiveWhileNoPaidOrder,'FIRST_PAID_ORDER');
 assert.equal(r.successMetric,'REALIZED_PAID_REVENUE_EUR');
 assert.equal(r.targetRealizedRevenueEur,1000000);
 assert.equal(r.targetDate,'2027-09-01');
 for(const k of ['chats','agents','skills','workflows','schedulers','portal','cockpits','futureCapabilities']) assert.equal(r.inheritance[k],true,k);
 assert.equal(r.autonomousExecution.unsolicitedOutboundMessagesRequireHumanApproval,true);
 assert.equal(l.compiler.failure_class,'ACTIVITY_OPTIMIZED_WITHOUT_PAID_ORDER');
 assert.ok(skill.includes('First paid order revenue invariant'));
 assert.ok(doc.includes('FIRST_PAID_ORDER'));
 assert.ok(ledger.includes('REALIZED_PAID_REVENUE_EUR'));
});
