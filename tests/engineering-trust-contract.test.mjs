import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');

test('Engineering Trust is canonically wired into BRAIN-DELIVERY-v2', () => {
  assert.equal(fs.existsSync('.github/CODEOWNERS'), true, 'CODEOWNERS missing');
  assert.equal(fs.existsSync('.github/dependabot.yml'), true, 'Dependabot missing');
  assert.equal(fs.existsSync('config/engineering-trust.json'), true, 'trust policy missing');
  const trust = JSON.parse(read('config/engineering-trust.json'));
  assert.equal(trust.parentContract, 'BRAIN-DELIVERY-v2');
  for (const gate of ['artifact_attestation','sbom','dependency_review','codeql','dependency_lifecycle','ownership']) {
    assert.equal(trust.requiredGates.includes(gate), true, `missing gate ${gate}`);
  }
  const delivery = JSON.parse(read('config/brain-delivery-system.json'));
  assert.equal(delivery.engineeringTrust?.policy, 'config/engineering-trust.json');
});
