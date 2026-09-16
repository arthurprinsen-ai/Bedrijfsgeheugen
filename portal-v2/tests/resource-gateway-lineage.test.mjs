import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gatewayUrl = new URL('../../supabase/functions/portal-state-eu/index.ts', import.meta.url);
const source = await readFile(gatewayUrl, 'utf8');

test('resource business value gateway reads calculated resource impact for the exact tenant', () => {
  assert.match(source, /from\('powerhouse_resource_impact_v1'\)/);
  assert.match(source, /eq\('tenant_id',tenantId\)/);
  assert.match(source, /eq\('calculation_status','calculated'\)/);
  for (const field of ['factor_id','methodology','confidence','source','occurred_at']) {
    assert.match(source, new RegExp(field));
  }
});

test('resource business value exposes footprint lineage without inventing aggregate confidence', () => {
  assert.match(source, /resource_footprint/);
  assert.match(source, /factorVersions/);
  assert.match(source, /methodologies/);
  assert.match(source, /sources/);
  assert.match(source, /calculatedAt/);
  assert.match(source, /calculationStatus/);
  assert.match(source, /uniqueConfidences\.length===1/);
});

test('resource footprint freshness comes from the latest calculated resource lineage observation', () => {
  assert.match(source, /lineageRows\.map\(\(row:any\)=>row\.occurred_at\)/);
  assert.match(source, /Date\.parse/);
  assert.doesNotMatch(source, /const calculatedAt=String\(summary\?\.latest_observed_at/);
});

test('resource footprint stays absent when summary or unambiguous calculated lineage is missing', () => {
  assert.match(source, /const resourceFootprint=.*summary.*lineageRows/s);
  assert.match(source, /resource_footprint:resourceFootprint/);
});
