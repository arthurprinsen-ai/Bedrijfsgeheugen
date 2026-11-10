import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const playbook = readFileSync(new URL('../docs/brain/groen-draaiboek.md', import.meta.url), 'utf8');
const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');

test('green playbook has the ordered path to live and both gate tables', () => {
  for (const heading of ['## 1. De vijf minuten', '## 2. De weg naar live', '## 3. Rode check of melding', '## 4. Publicatieblokkades', '## 5. Niet bewezen', '## 6. Meting 8 november', '## 7. Wat de zelfbewaking-alarmen betekenen']) {
    assert.ok(playbook.includes(heading), `missing section: ${heading}`);
  }
  const rows = playbook.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| ---'));
  assert.ok(rows.length >= 25, `gate tables too short: ${rows.length}`);
});

test('green playbook names the protected checks and the autonomous decision', () => {
  for (const needle of ['hygiene / admission', 'LEARNING_FAILURE_CLASS_REQUIRED', 'unclassified delivery path', 'Autonoom uitvoeren']) {
    assert.ok(playbook.includes(needle), `missing: ${needle}`);
  }
});

test('AGENTS.md points to the playbook near the top', () => {
  const head = agents.slice(0, 2500);
  assert.ok(head.includes('docs/brain/groen-draaiboek.md'), 'AGENTS.md does not point to the playbook near the top');
});

test('all agent/chats must autonomously promote a green gated change, never ask to put it live', () => {
  const skill = readFileSync(new URL('../.agents/skills/powerhouse-self-improvement-layer/SKILL.md', import.meta.url), 'utf8');
  for (const [name, content] of [['AGENTS', agents], ['playbook', playbook], ['self improvement skill', skill]]) {
    assert.match(content, /AUTO_SHIP_AFTER_GREEN|na groen zonder vraag/);
    assert.match(content, /zonder (?:nieuwe )?vraag|nooit aan Arthur vragen|Niet eindigen met de vraag/i);
    assert.match(content, /verplicht.*(?:check|poort)|(?:check|poort).*verplicht/i);
    assert.match(content, /bestaande.*(?:PR|productie|deployment)|beschermde.*(?:PR|merge)/i);
    assert.match(content, /onafhankelijk.*(?:readback|controle)|(?:readback|controle).*onafhankelijk/i);
  }
  assert.match(agents, /geen direct-main push, force merge, bypass/i);
  assert.match(playbook, /Nooit een verplichte check, branch protection, consent of kwaliteitsgate omzeilen/i);
  assert.match(skill, /Checks groen ≠ live; merge ≠ live/i);
});
