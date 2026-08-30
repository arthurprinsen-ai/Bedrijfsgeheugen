import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('native main-protection gap tracks concrete recurrences until structurally impossible', async () => {
  const state = JSON.parse(await readFile('brain/learning/github-main-native-protection-gap-2026-08-30.json', 'utf8'));
  assert.equal(state.fingerprint, 'github|main|native-protection-absent');
  assert.equal(state.ownerIssue, 523);
  assert.equal(state.eradication?.targetState, 'STRUCTURALLY_IMPOSSIBLE');
  assert.equal(state.eradication?.currentMaturity, 'DETECTED_AND_GUARDED');
  assert.ok(Number.isInteger(state.recurrence_count) && state.recurrence_count >= 2);
  assert.match(state.first_seen, /^2026-08-30T/);
  assert.match(state.last_seen, /^2026-08-30T/);
  const occurrences = state.occurrences || [];
  for (const sha of [
    '1e33e684905bd187e44389d30433dd64cf872f9b',
    '01ae7a0bc7c429010f00015e979c1a11af7b831e'
  ]) {
    assert.ok(occurrences.some(item => item?.sha === sha), `missing direct-main occurrence ${sha}`);
  }
  assert.ok(occurrences.some(item => item?.sharedMemoryRunId === 33333597731 && item?.result === 'RED_POST_WRITE_DETECTION'));
  assert.equal(state.eradication?.closeOnlyWhenNativePreventionProven, true);
  assert.equal(state.eradication?.postPushDetectionIsPrevention, false);
});
