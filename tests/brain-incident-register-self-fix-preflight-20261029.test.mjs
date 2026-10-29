import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileChatLearningPreflight, evaluateIncidentSelfFix } from '../scripts/brain/chat-learning-preflight.mjs';

const POLICY_PATH = 'brain/policies/powerhouse-incident-register-and-self-fix-v1.json';
const policy = () => JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
const MARKER = policy().skill_protocol.marker;

function fixtureRoot(skills) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'incident-selffix-'));
  for (const [name, body] of Object.entries(skills)) {
    fs.mkdirSync(path.join(root, '.agents/skills', name), { recursive: true });
    fs.writeFileSync(path.join(root, '.agents/skills', name, 'SKILL.md'), body);
  }
  return root;
}

test('real repository: preflight is READY and exposes the incident protocol and visible loop debt', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.status, 'READY');
  const info = packet.incident_self_fix;
  assert.equal(info.fingerprint, 'agents-skills-register-and-self-fix-v1');
  assert.equal(info.failClosed, true);
  assert.ok(info.skills_with_protocol >= 1, 'the canonical continuity skill must carry the marker');
  assert.equal(info.skills_with_protocol + info.loop_debt.count, info.skills_total);
  assert.ok(packet.sources.some(source => source.path === POLICY_PATH), 'policy must be a mandatory preflight source');
});

test('a new skill without the marker fails the preflight', () => {
  const root = fixtureRoot({ 'nieuwe-skill': '# Nieuwe skill\nGeen protocol.\n' });
  assert.throws(() => evaluateIncidentSelfFix({ rootDir: root, policy: policy() }), /INCIDENT_PROTOCOL_MISSING_ON_NEW_SKILL:nieuwe-skill/);
});

test('a new skill with the marker passes', () => {
  const root = fixtureRoot({ 'nieuwe-skill': `# Nieuwe skill\n${MARKER}\n` });
  const result = evaluateIncidentSelfFix({ rootDir: root, policy: policy() });
  assert.equal(result.skills_with_protocol, 1);
  assert.equal(result.loop_debt.count, 0);
});

test('a baseline skill without the marker is visible loop debt, not a failure', () => {
  const p = policy();
  const baselineSkill = p.loop_debt_baseline[0];
  const root = fixtureRoot({ [baselineSkill]: '# Oude skill\n' });
  const result = evaluateIncidentSelfFix({ rootDir: root, policy: p });
  assert.deepEqual(result.loop_debt.skills, [baselineSkill]);
  assert.equal(result.skills_with_protocol, 0);
});

test('policy drift fails closed', () => {
  const root = fixtureRoot({});
  for (const mutate of [
    p => { p.status = 'DRAFT'; },
    p => { p.fail_closed = false; },
    p => { p.fingerprint = 'something-else'; },
    p => { p.skill_protocol.new_skills_must_carry_marker = false; },
    p => { p.reserved_for_owner = []; },
    p => { delete p.loop_debt_baseline; }
  ]) {
    const p = policy();
    mutate(p);
    assert.throws(() => evaluateIncidentSelfFix({ rootDir: root, policy: p }));
  }
});

test('owner-reserved decisions stay reserved', () => {
  const p = policy();
  for (const item of ['PROTECTED_MERGE', 'PRODUCTION_MIGRATIONS', 'SPEND_AND_CREDITS', 'IRREVERSIBLE_OR_COSTLY_DECISIONS', 'ANYTHING_SENT_TO_THIRD_PARTIES']) {
    assert.ok(p.reserved_for_owner.includes(item), item);
  }
  assert.match(p.on_reserved_boundary, /ONE_DEDUPED_OBLIGATION/);
});

test('baseline contains no skill that already carries the marker (debt shrinks, never hides)', () => {
  const p = policy();
  for (const name of p.loop_debt_baseline) {
    const file = path.join('.agents/skills', name, 'SKILL.md');
    assert.ok(fs.existsSync(file), `baseline names a missing skill: ${name}`);
    assert.ok(!fs.readFileSync(file, 'utf8').includes(MARKER), `${name} has the marker; remove it from loop_debt_baseline`);
  }
});
