import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const writers = [
  'regelgeving-bijwerken',
  'seo-controle',
  'weekblog',
];

for (const writer of writers) {
  test(`${writer} certification remains supported but awaiting independent outcome acknowledgement`, async () => {
    const path = new URL(`../brain/evidence/writer-canary/${writer}-operational-certification.json`, import.meta.url);
    const evidence = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(evidence.contract, 'BRAIN-DELIVERY-v2');
    assert.equal(evidence.writer, writer);
    assert.equal(evidence.truth_status, 'SUPPORTED');
    assert.equal(evidence.status, 'AWAITING_OUTCOME');
    assert.equal(evidence.candidate_merged, false);
    assert.equal(evidence.verification_only, true);
    assert.equal(evidence.non_promotion_evidence, true);
    assert.equal(evidence.bg169_handoff_skipped, true);
    assert.equal(evidence.shadow_run_conclusion, 'success');
    assert.equal(evidence.central_gate_run_conclusion, 'success');
    assert.equal(evidence.unified_run_conclusion, 'success');
    assert.equal(evidence.projection_verification?.bg168_routed, false);
    assert.equal(evidence.projection_verification?.bg167_visible, false);
    assert.equal(evidence.projection_verification?.verified, false);
  });
}
