import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('website browser verification keeps visibility safety while risk-scoping expensive menu work', async()=>{
  const workflow=await readFile('.github/workflows/lane-website.yml','utf8');
  const config=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.match(workflow,/Verify affected routes on desktop and mobile/);
  assert.match(workflow,/Verify all public pages are visibly rendered\n\s+env:/);
  assert.match(workflow,/Verify every header menu panel is readable\n\s+if: needs\.classify\.outputs\.risk_lane == 'high-risk'/);
  assert.ok(config.fastFixRequiredTestSets.includes('public-visibility'));
  assert.ok(!config.normalRequiredTestSets.includes('shared-contracts'));
  assert.ok(!config.normalRequiredTestSets.includes('full-regression'));
});

test('regulatory data uses an explicit bounded public route set', async()=>{
  const config=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.deepEqual(config.pageLocalAssets['data/regelgeving.json'],['/','/ai-act','/compliance-status','/benchmark','/monitor']);
});
