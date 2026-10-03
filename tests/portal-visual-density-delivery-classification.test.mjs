import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('portal visual-density harness is classified in portal delivery lane',()=>{
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const portal=policy.lanes.find(lane=>lane.id==='portal');
  assert.ok(portal,'portal delivery lane must exist');
  assert.ok(
    portal.paths.includes('tools/portal-visual-density.mjs'),
    'tools/portal-visual-density.mjs must remain classified as portal delivery'
  );
});
