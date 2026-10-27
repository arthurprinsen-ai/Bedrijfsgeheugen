import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('portal visual assurance surfaces stay classified in portal delivery lane',()=>{
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const portal=policy.lanes.find(lane=>lane.id==='portal');
  assert.ok(portal,'portal delivery lane must exist');
  for(const path of [
    'tools/portal-visual-density.mjs',
    'config/powerhouse-portal-visual-assurance-v1.json',
    '.github/workflows/portal-visual-density.yml'
  ]){
    assert.ok(portal.paths.includes(path),`${path} must remain classified as portal delivery`);
  }
});
