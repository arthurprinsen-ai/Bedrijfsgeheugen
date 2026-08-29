import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const required = [
  'AGENTS.md',
  'docs/development-operating-system.md',
  'docs/development-ledger.md',
  'docs/self-healing-agents.md',
  'docs/outcome-obligations.md',
  'docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md',
  'docs/superpowers/specs/2026-08-29-no-silent-failure-obligation-guardian-design.md',
  'docs/superpowers/plans/2026-08-29-no-silent-failure-obligation-guardian.md'
];

test('mandatory development knowledge contract exists and is referenced', async () => {
  for (const path of required) await access(path);
  const agents = await readFile('AGENTS.md', 'utf8');
  for (const path of required.slice(1, 4)) {
    assert.match(agents, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const operating = await readFile('docs/development-operating-system.md', 'utf8');
  assert.ok(operating.includes('docs/outcome-obligations.md'));
});

test('ledger contains material outcome vocabulary', async () => {
  const ledger = await readFile('docs/development-ledger.md', 'utf8');
  for (const token of ['ERROR','RECOVERY','IMPROVEMENT','CONTRACT_CHANGE','PRODUCTION_PROMOTION','PRODUCTION_ROLLBACK']) {
    assert.ok(ledger.includes(token), `ledger missing ${token}`);
  }
});
