import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveNetlifyDeploymentApplicability } from '../tools/delivery/netlify-deployment-applicability.mjs';

const CONTROL_PLANE_PATHS = [
  'AGENTS.md',
  'brain/policies/example.md',
  'tools/delivery/example.mjs',
  'tools/site-shell/verify-targeted-website-routes.mjs',
];

test('production readback push trigger ignores control-plane-only paths', async () => {
  const source = await readFile('.github/workflows/production-release-readback.yml', 'utf8');
  const trigger = source.split(/\npermissions:/, 1)[0];
  for (const expected of ['AGENTS.md', 'brain/policies/**', 'tools/delivery/**', 'tools/site-shell/verify-targeted-website-routes.mjs']) {
    assert.ok(trigger.includes(expected), `production-release-readback.yml missing ${expected}`);
  }
});

test('production source snapshot reconciles every main push and the applicability gate excludes control-plane-only paths', async () => {
  const source = await readFile('.github/workflows/production-source-snapshot.yml', 'utf8');
  const trigger = source.split(/\npermissions:/, 1)[0];
  // Every main push is reconciled: ignoring paths here previously suppressed reconciliation entirely.
  assert.doesNotMatch(trigger, /paths-ignore:/);
  assert.match(source, /Derive canonical Netlify deployment applicability/);
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of CONTROL_PLANE_PATHS) {
    const result = deriveNetlifyDeploymentApplicability({ changedPaths: [path], headSha: 'a'.repeat(40), policy });
    assert.equal(result.deploymentRequired, false, `${path} must not require a Netlify production deployment`);
    assert.deepEqual(result.runtimeChangedPaths, [], `${path} must not be classified as runtime`);
  }
});
