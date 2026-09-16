import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');

test('Engineering Trust extends BRAIN-DELIVERY-v2 without a parallel authority', () => {
  assert.equal(fs.existsSync('.github/CODEOWNERS'), true, 'CODEOWNERS missing');
  assert.equal(fs.existsSync('.github/dependabot.yml'), true, 'Dependabot missing');
  assert.equal(fs.existsSync('config/engineering-trust.json'), true, 'trust policy missing');
  const trust = JSON.parse(read('config/engineering-trust.json'));
  assert.equal(trust.parentContract, 'BRAIN-DELIVERY-v2');
  for (const gate of ['artifact_attestation','sbom','dependency_review','codeql','dependency_lifecycle','ownership']) {
    assert.equal(trust.requiredGates.includes(gate), true, `missing gate ${gate}`);
  }
  assert.deepEqual(trust.learning, {
    errorLedger: 'BG166',
    currentStateProjection: 'BG167',
    outcomeRouter: 'BG168',
    productionAuthority: 'BG169'
  });
});
