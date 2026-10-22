import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('CodeQL is stable single-flight per PR/ref and terminal delivery rule is durable', () => {
  const workflow = fs.readFileSync('.github/workflows/codeql.yml', 'utf8');
  assert.match(workflow, /github\.event\.pull_request\.number \|\| github\.event\.merge_group\.head_sha \|\| github\.ref_name/);
  assert.doesNotMatch(workflow, /github\.event\.pull_request\.number \|\| github\.run_id/);
  assert.match(workflow, /cancel-in-progress:\s*true/);

  assert.equal(fs.existsSync('.github/workflows/powerhouse-codeql.yml'), false, 'retired parallel CodeQL workflow must stay absent');
  assert.match(workflow, /merge_group:\s*\n\s*types: \[checks_requested\]/);
  assert.match(workflow, /security-events:\s*write/);
  assert.match(workflow, /github\/codeql-action\/analyze@v4/);
  assert.match(workflow, /language: \[javascript-typescript, python\]/);

  const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));
  const ids = new Set(rules.rules.filter(r => r.active).map(r => r.id));
  assert.ok(ids.has('SINGLE_FLIGHT_POST_MERGE_CODEQL_PER_REF'));
  assert.ok(ids.has('NO_FINAL_HANDOFF_WHILE_AUTHORITATIVE_SECURITY_RUN_ACTIVE'));
  assert.ok(ids.has('RESUME_CANONICAL_DELIVERY_AFTER_CLIENT_TRANSPORT_INTERRUPTION'));

  const skill = fs.readFileSync('.agents/skills/powerhouse-post-merge-codeql/SKILL.md', 'utf8');
  assert.match(skill, /internal execution state, never a user handoff/);
  assert.match(skill, /Client transport continuation/);
});
