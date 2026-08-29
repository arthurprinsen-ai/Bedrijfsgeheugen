import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredFiles = [
  'docs/outcome-obligations.md',
  'config/outcome-obligations.json',
  'tools/outcome-obligation-validator.mjs',
  'docs/make/bg184-social-outcome-obligation-guardian.md',
  'docs/make/global-execution-obligation-sentinel.md',
];

test('whole-brain obligation contract exists and declares the non-silent invariants', async () => {
  for (const path of requiredFiles) await access(path);

  const doc = await readFile('docs/outcome-obligations.md', 'utf8');
  for (const invariant of [
    'NO SILENT FAILURE',
    'NO LOST OBLIGATION',
    'GREEN MEANS OUTCOME VERIFIED',
    'RED MEANS AGENTS KEEP WORKING',
  ]) {
    assert.match(doc, new RegExp(invariant), `missing invariant: ${invariant}`);
  }
});

test('agent and self-healing governance make outcome obligations mandatory', async () => {
  const agents = await readFile('AGENTS.md', 'utf8');
  const operatingSystem = await readFile('docs/development-operating-system.md', 'utf8');
  const selfHealing = await readFile('docs/self-healing-agents.md', 'utf8');

  assert.match(agents, /docs\/outcome-obligations\.md/);
  assert.match(agents, /MISSED_OBLIGATION/);
  assert.match(agents, /AUTO_REPAIR/);
  assert.match(agents, /technisch.*succes.*resultaat/is);
  assert.match(operatingSystem, /outcome obligation/i);
  assert.match(operatingSystem, /zero candidates/i);
  assert.match(selfHealing, /docs\/outcome-obligations\.md/);
  assert.match(selfHealing, /technisch.*succes.*resultaat/is);
  assert.match(selfHealing, /MISSED_OBLIGATION|SUCCESS_WITHOUT_OUTCOME/);
});

test('runtime adapters preserve outcome evidence and deterministic healthy-path semantics', async () => {
  const social = await readFile('docs/make/bg184-social-outcome-obligation-guardian.md', 'utf8');
  for (const token of ['7147086', '3600', 'Post ID LinkedIn', 'Bedrijfspaginapost', 'Post ID Instagram', '7132258', '7136176', 'idempotent']) {
    assert.ok(social.includes(token), `social guardian missing ${token}`);
  }
  assert.match(social, /zero[- ]candidate[\s\S]{0,180}RED/is);

  const sentinel = await readFile('docs/make/global-execution-obligation-sentinel.md', 'utf8');
  for (const token of ['BG165', 'BG156', 'BG168', 'schedule', 'last execution', 'required output', 'deterministic', 'bounded', 'domain adapter']) {
    assert.ok(sentinel.includes(token), `global sentinel missing ${token}`);
  }
  assert.match(sentinel, /healthy[\s\S]{0,240}no paid AI/i);
  assert.match(sentinel, /successful Make execution[\s\S]{0,240}not[\s\S]{0,240}business outcome/i);
});

test('technical success without required outcome evidence is never green', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'social-post-2026-08-29-linkedin',
    expected: true,
    technicalSuccess: true,
    dueAt: '2026-08-29T08:40:00+02:00',
    now: '2026-08-29T09:00:00+02:00',
    evidence: [],
  });

  assert.equal(result.status, 'MISSED_OBLIGATION');
  assert.equal(result.green, false);
  assert.equal(result.recoveryRequired, true);
});

test('an expected obligation is green only with outcome evidence', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'social-post-2026-08-29-linkedin',
    expected: true,
    technicalSuccess: true,
    dueAt: '2026-08-29T08:40:00+02:00',
    now: '2026-08-29T08:41:00+02:00',
    evidence: [{ type: 'external_post_id', value: 'urn:li:share:123' }],
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.green, true);
  assert.equal(result.recoveryRequired, false);
});

test('hard boundaries are explicit terminal states, never silent success', async () => {
  const { evaluateObligation } = await import('../tools/outcome-obligation-validator.mjs');
  const result = evaluateObligation({
    id: 'make-runtime-verification',
    expected: true,
    technicalSuccess: false,
    dueAt: '2026-08-29T12:00:00+02:00',
    now: '2026-08-29T13:00:00+02:00',
    evidence: [],
    hardBoundary: 'credentials_or_account_connection',
  });

  assert.equal(result.status, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(result.green, false);
  assert.equal(result.recoveryRequired, false);
});
