import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const writers = [
  'regelgeving-bijwerken',
  'seo-controle',
  'weekblog',
];

for (const writer of writers) {
  test(`${writer} certification is verified only after independent outcome acknowledgement`, async () => {
    const path = new URL(`../brain/evidence/writer-canary/${writer}-operational-certification.json`, import.meta.url);
    const evidence = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(evidence.contract, 'BRAIN-DELIVERY-v2');
    assert.equal(evidence.writer, writer);
    assert.equal(evidence.truth_status, 'VERIFIED');
    assert.equal(evidence.status, 'COMPLETED');
    assert.equal(evidence.candidate_merged, false);
    assert.equal(evidence.verification_only, true);
    assert.equal(evidence.non_promotion_evidence, true);
    assert.equal(evidence.bg169_handoff_skipped, true);
    assert.equal(evidence.shadow_run_conclusion, 'success');
    assert.equal(evidence.central_gate_run_conclusion, 'success');
    assert.equal(evidence.unified_run_conclusion, 'success');
    assert.equal(evidence.projection_verification?.bg168_routed, true);
    assert.equal(evidence.projection_verification?.bg167_visible, true);
    assert.equal(evidence.projection_verification?.verified, true);
    assert.equal(evidence.projection_verification?.fingerprint, 'writer-certifications|2026-08-30|final-four');
    assert.equal(evidence.projection_verification?.bg168_execution_id, '1e42fe2f09414105ae91901353d63706');
    assert.equal(evidence.projection_verification?.bg167_execution_id, '3aaf37250fa14df384bb77997df1b01c');
  });
}
