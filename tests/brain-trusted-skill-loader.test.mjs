import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSkillExecutionEvidence } from '../tools/brain/agent-skill-execution-evidence.mjs';
import { loadTrustedSkill, loadTrustedSkills, TRUSTED_LOADER_ID } from '../tools/brain/trusted-skill-loader.mjs';

const root = mkdtempSync(join(tmpdir(), 'skill-loader-'));
const put = (id, text) => { mkdirSync(join(root, '.agents', 'skills', id), { recursive: true }); writeFileSync(join(root, '.agents', 'skills', id, 'SKILL.md'), text); };
put('demo-skill', '# Demo\nfirst version\n');
const at = new Date('2026-11-09T07:24:00Z');
const base = { repoRoot: root, runId: 'run-1', agentId: 'agent-x', now: at };

test('receipt is issued from the real bytes by the trusted loader', () => {
  const r = loadTrustedSkill({ ...base, skillId: 'demo-skill' });
  assert.equal(r.ok, true);
  assert.equal(r.receipt.loaderId, TRUSTED_LOADER_ID);
  assert.match(r.receipt.contentSha256, /^[0-9a-f]{64}$/);
  assert.equal(r.receipt.version, r.manifestEntry.version);
  assert.equal(r.receipt.loadedAt, '2026-11-09T07:24:00.000Z');
});

test('changed skill text changes hash and version', () => {
  const a = loadTrustedSkill({ ...base, skillId: 'demo-skill' });
  put('demo-skill', '# Demo\nsecond version\n');
  const b = loadTrustedSkill({ ...base, skillId: 'demo-skill' });
  assert.notEqual(a.receipt.contentSha256, b.receipt.contentSha256);
  assert.notEqual(a.receipt.version, b.receipt.version);
  put('demo-skill', '# Demo\nfirst version\n');
});

test('loader output satisfies the load half of the validator but never proves application', () => {
  const l = loadTrustedSkills({ ...base, skillIds: ['demo-skill'] });
  const record = { runId: 'run-1', agentId: 'agent-x', loaderReceipts: l.loaderReceipts, applications: [], verifier: null };
  const v = validateSkillExecutionEvidence(record, l.manifest);
  assert.equal(v.status, 'UNPROVEN');
  assert.ok(v.errors.some((e) => e.startsWith('SKILL_APPLICATION_UNPROVEN')));
  assert.ok(v.errors.includes('INDEPENDENT_VERIFICATION_MISSING'));
  assert.equal(v.errors.some((e) => e.startsWith('SKILL_LOAD_UNPROVEN') || e.startsWith('LOAD_RECEIPT_COUNT')), false);
});

test('path traversal, unknown, empty and bad identities fail closed', () => {
  assert.equal(loadTrustedSkill({ ...base, skillId: '../../etc/passwd' }).error, 'SKILL_ID_INVALID');
  assert.equal(loadTrustedSkill({ ...base, skillId: 'nope' }).error, 'SKILL_NOT_FOUND');
  put('empty-skill', '  \n');
  assert.equal(loadTrustedSkill({ ...base, skillId: 'empty-skill' }).error, 'SKILL_EMPTY');
  assert.equal(loadTrustedSkill({ ...base, skillId: 'demo-skill', runId: '' }).error, 'RUN_IDENTITY_INVALID');
  assert.equal(loadTrustedSkill({ ...base, skillId: 'demo-skill', now: 'invalid' }).error, 'LOADED_AT_INVALID');
  assert.equal(loadTrustedSkills({ ...base, skillIds: [] }).error, 'SKILL_IDS_INVALID');
  assert.equal(loadTrustedSkills({ ...base, skillIds: ['demo-skill', 'demo-skill'] }).error, 'SKILL_IDS_INVALID');
});

test('real repository skill loads', () => {
  const r = loadTrustedSkill({ repoRoot: process.cwd(), skillId: 'powerhouse-continuity', runId: 'run-2', agentId: 'agent-x', now: at });
  assert.equal(r.ok, true);
});
