import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { discoverQualitySurfaces, buildDiscoveryObligations } from '../scripts/brain/quality/surface-discovery.mjs';

const registryPath = 'config/powerhouse-quality-surface-contracts.json';
const resourceSurfacePaths = [
  'supabase/functions/portal-state-eu/index.ts',
  'supabase/functions/resource-usage-eu/index.ts',
];

test('Resource Intelligence runtime surfaces stay registered in the Quality control plane', () => {
  const files = resourceSurfacePaths.map(path => ({ path, content: fs.readFileSync(path, 'utf8') }));
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const discovered = discoverQualitySurfaces({ files });

  assert.deepEqual(discovered.map(surface => surface.id), [
    'function:portal-state-eu',
    'function:resource-usage-eu',
    'rpc:bg_portal_state_get_internal',
    'rpc:bg_portal_state_put_internal',
    'rpc:brain_record_resource_usage',
  ]);

  const notRegistered = buildDiscoveryObligations({
    discovered,
    registeredSurfaces: registry.surfaces || [],
    evidence: [],
  }).filter(item => item.state === 'NOT_REGISTERED');

  assert.deepEqual(notRegistered, []);
});
