import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('SkillOps inventory is deterministic, source-bound and read-only', () => {
  const run = () => spawnSync(process.execPath, ['tools/skillops/inventory.mjs'], { encoding: 'utf8', timeout: 30000 });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  const result = JSON.parse(first.stdout);
  assert.equal(result.schema_version, 1);
  assert.equal(result.read_only, true);
  assert.equal(result.count, result.skills.length);
  assert.ok(result.count > 0);
  for (const skill of result.skills) {
    assert.match(skill.path, /^(?:\.agents\/skills|brain\/skills)\//);
    assert.match(skill.sha256, /^[a-f0-9]{64}$/);
    const data = readFileSync(skill.path);
    assert.equal(skill.size_bytes, data.length);
    assert.equal(skill.sha256, createHash('sha256').update(data).digest('hex'));
  }
});
