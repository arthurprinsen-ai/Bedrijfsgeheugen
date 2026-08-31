import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Unified BRAIN persists unknown learning candidates statefully and deduplicates by fingerprint', async () => {
  const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');

  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /learning-candidate\|/);
  assert.match(workflow, /issues\?state=open/);
  assert.match(workflow, /fingerprint/);
  assert.match(workflow, /last_seen_sha/);
  assert.match(workflow, /last_seen_run/);
  assert.match(workflow, /UNVERIFIED/);
  assert.match(workflow, /LEARNING_CANDIDATE/);
  assert.match(workflow, /REUSE_LEARNING_CANDIDATE/);
  assert.doesNotMatch(workflow, /existingCandidates:\s*\[\s*\]/);
  assert.doesNotMatch(workflow, /autoPromoteToProven\s*:\s*true/);
});
