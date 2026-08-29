import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const required = [
  'AGENTS.md',
  'docs/development-operating-system.md',
  'docs/development-ledger.md',
  'docs/self-healing-agents.md',
  'docs/outcome-obligations.md',
  'config/outcome-obligations.json',
  'docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md',
  'docs/superpowers/specs/2026-08-29-production-promotion-guardian-design.md',
  'docs/superpowers/plans/2026-08-29-production-promotion-guardian.md',
  'config/production-promotion.json',
  'tools/evaluate-production-promotion.mjs'
];

test('mandatory development knowledge contract exists and is referenced', async () => {
  for (const path of required) await access(path);
  const agents = await readFile('AGENTS.md', 'utf8');
  for (const path of [
    'docs/development-operating-system.md',
    'docs/development-ledger.md',
    'docs/self-healing-agents.md',
    'docs/outcome-obligations.md',
    'config/outcome-obligations.json'
  ]) {
    assert.match(agents, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('ledger contains established material outcome vocabulary', async () => {
  const ledger = await readFile('docs/development-ledger.md', 'utf8');
  for (const token of ['ERROR','RECOVERY','IMPROVEMENT','PRODUCTION_PROMOTION','PRODUCTION_ROLLBACK']) {
    assert.ok(ledger.includes(token), `ledger missing ${token}`);
  }
});

test('production promotion guardian contract is machine enforced', async () => {
  const [agents, os, selfHealing, obligations, policy, obligationPolicy, workflow] = await Promise.all([
    readFile('AGENTS.md', 'utf8'),
    readFile('docs/development-operating-system.md', 'utf8'),
    readFile('docs/self-healing-agents.md', 'utf8'),
    readFile('docs/outcome-obligations.md', 'utf8'),
    readFile('config/production-promotion.json', 'utf8'),
    readFile('config/outcome-obligations.json', 'utf8'),
    readFile('.github/workflows/shared-agent-memory-tests.yml', 'utf8')
  ]);

  const combined = [agents, os, selfHealing, obligations].join('\n');
  assert.match(combined, /Powerhouse Production Promotion Guardian/);
  assert.match(combined, /GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION/);
  assert.match(combined, /commit[^\n]{0,120}(not|niet)[^\n]{0,120}(complete|klaar|completion)/i);
  assert.match(combined, /exact[^\n]{0,80}(production|productie)[^\n]{0,80}SHA/i);
  assert.match(combined, /(promotion|promotie)[^\n]{0,100}(rollback|terugrol)[^\n]{0,100}(autonomous|autonoom)/i);

  const parsed = JSON.parse(policy);
  assert.equal(parsed.greenCandidateCreatesProductionObligation, true);
  assert.equal(parsed.productionExactShaRequired, true);

  const obligationsConfig = JSON.parse(obligationPolicy);
  assert.equal(obligationsConfig.productionPromotion.ownerAgent, 'Powerhouse Production Promotion Guardian');
  assert.equal(obligationsConfig.productionPromotion.commitOrMergeIsCompletion, false);
  assert.equal(obligationsConfig.productionPromotion.safePromotionAndRollbackAreAutonomous, true);

  assert.match(workflow, /tests\/production-promotion-guardian\.test\.mjs/);
});
