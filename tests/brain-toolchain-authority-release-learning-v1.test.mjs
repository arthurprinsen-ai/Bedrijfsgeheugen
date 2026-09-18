import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const skill = await readFile('.agents/skills/powerhouse-toolchain-authority/SKILL.md','utf8');
const learning = JSON.parse(await readFile('brain/learning/2026-09-18-toolchain-authority-release-learning-v1.json','utf8'));

test('toolchain authority inherits proven release-recovery prevention', () => {
  assert.equal(learning.status, 'PROVEN');
  assert.equal(learning.parent_fingerprint, 'powerhouse|toolchain-authority|composio-no-make|v1');
  for (const rule of ['PRODUCTION_DESCENDANT_READBACK_REQUIRED','RECOVERY_PR_METADATA_PREFLIGHT_BEFORE_CI','CLASSIFY_EVIDENCE_PATH_BEFORE_WRITE']) assert.ok(learning.prevention_rules.includes(rule));
  for (const fp of ['delivery|production-parity|main-vs-deploy-sha-mismatch|toolchain-authority-v1','delivery|recovery-pr|metadata-preflight-required-v1','delivery|brain-classification|resync-proof-unclassified-path-v1']) assert.ok(skill.includes(fp));
  assert.ok(skill.includes('brain/learning/2026-09-18-toolchain-authority-release-learning-v1.json'));
});
