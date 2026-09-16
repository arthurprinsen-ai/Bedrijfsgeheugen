import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { impactSnapshotFromPortalState } from '../csrd-impact.js';

test('CSRD derives a data-backed snapshot only from canonical resourceBusinessValue footprint state', () => {
  const snapshot = impactSnapshotFromPortalState({
    resourceBusinessValue:{
      resource_footprint:{
        coverage:0.75,
        confidence:0.8,
        calculatedAt:'2026-09-16T09:00:00.000Z',
        factorVersions:['factor-v1'],
        methodologies:['method-v1'],
        sources:['provider-evidence'],
        calculationStatus:'calculated',
        measurementClass:'calculated',
        energyKwh:12.5,
        co2eKg:2.4,
        waterLiters:180
      }
    }
  });
  assert.equal(snapshot.resourceFootprint?.dataBacked, true);
  assert.equal(snapshot.resourceFootprint?.coverage, 0.75);
  assert.match(snapshot.realtime[0][1], /12,5 kWh/);
});

test('CSRD portal-state binding fails closed when canonical resource footprint is absent', () => {
  const snapshot = impactSnapshotFromPortalState({resourceBusinessValue:{resource_footprint:null}});
  assert.equal(snapshot.resourceFootprint, undefined);
});

test('page shell passes the canonical CSRD snapshot into the renderer', async () => {
  const source = await readFile(new URL('../page-shell.js', import.meta.url), 'utf8');
  assert.match(source, /impactSnapshotFromPortalState\(portalStateSnapshot\(\)\)/);
  assert.match(source, /renderCsrdImpact\([^;]+snapshot[^;]+\)/s);
});
