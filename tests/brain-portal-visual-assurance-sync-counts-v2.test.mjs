import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));
const edge=fs.readFileSync('supabase/functions/powerhouse-visual-assurance-sync/index.ts','utf8');

test('visual assurance sync reports the screenshot count of the active v2 contract',()=>{
  const routes=contract.routes.length, viewports=contract.viewports.length;
  assert.equal(Number(edge.match(/const ROUTES=(\d+);/)?.[1]),routes);
  assert.equal(Number(edge.match(/const VIEWPORTS=(\d+);/)?.[1]),viewports);
  assert.match(edge,/const SCREENSHOTS=ROUTES\*VIEWPORTS;/);
  assert.equal(routes*viewports,24);
  assert.doesNotMatch(edge,/screenshots(_expected|_total)?:9\b/);
  assert.match(edge,/synced_by:'powerhouse-visual-assurance-sync-v2'/);
});
