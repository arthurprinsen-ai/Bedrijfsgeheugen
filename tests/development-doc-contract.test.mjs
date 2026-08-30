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
  'docs/powerhouse-chat-learning-checkpoint-2026-08-30.md',
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

test('customer auth recovery is retained as reusable shared-memory knowledge', async () => {
  const [ledger, architecture] = await Promise.all([
    readFile('docs/development-ledger.md', 'utf8'),
    readFile('docs/customer-login-architecture.md', 'utf8')
  ]);
  for (const token of [
    'portal|customer-auth|legacy-inline-login-jitter',
    'mixed Netlify Identity',
    'Supabase',
    'Known failed approaches',
    'klant-login.html',
    'iOS',
    '9041bcb1e5cc4d6732cbc3b0d4879976cef3e350'
  ]) assert.ok(ledger.includes(token), `customer-auth learning missing ${token}`);
  assert.match(ledger, /production evidence/i);
  assert.match(architecture, /enige klantlogin/);
  assert.match(architecture, /Netlify Identity/);
  assert.match(architecture, /symptoompatch/i);
  assert.match(architecture, /focus/i);
});

test('Powerhouse chat learning checkpoint preserves cross-platform failure prevention', async () => {
  const [checkpoint, ledger] = await Promise.all([
    readFile('docs/powerhouse-chat-learning-checkpoint-2026-08-30.md', 'utf8'),
    readFile('docs/development-ledger.md', 'utf8')
  ]);

  for (const token of [
    'SECRET_LEAK',
    'IDEMPOTENCY_DUPLICATE',
    'MAPPING_EXPRESSION_ERROR',
    'empty Notion search bundle',
    'scenario `success` with error-handler invocation',
    'BG171',
    'BG179',
    'BG140 Native Instagram Insights',
    '17841446582493753',
    'aba20c0cfa734002a24fb6bbb78dc9ca',
    '2c6ca62e4bec4cf9a205eb54e45f072e',
    'Create -> GetMedia verify',
    'No plaintext token workaround'
  ]) {
    assert.ok(checkpoint.includes(token), `Powerhouse chat learning missing ${token}`);
  }

  assert.match(ledger, /shared-memory\|chat-learning\|cross-platform-checkpoint-20260830/);
  assert.match(checkpoint, /scenario `success`[^\n]{0,120}insufficient|scenario `success`[^\n]{0,120}error handler/i);
  assert.match(checkpoint, /Current truth precedence/);
});

test('shared memory workflow protects direct main pushes as well as pull requests', async () => {
  const workflow = await readFile('.github/workflows/shared-agent-memory-tests.yml', 'utf8');
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n(?:\s*- .*\n)*\s*- main\b/m);
  assert.match(workflow, /pull_request:\s*\n\s*branches:\s*\n\s*- main\b/m);
  assert.match(workflow, /tests\/development-doc-contract\.test\.mjs/);
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
