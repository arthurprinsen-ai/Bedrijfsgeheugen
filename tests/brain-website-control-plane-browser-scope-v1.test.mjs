import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteRelease } from '../tools/site-shell/website-release-risk.mjs';

const riskConfig=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
const acceptedBaseline=JSON.parse(await readFile('site/accepted-baseline.json','utf8'));

test('workflow-only delivery changes cannot launch website browser verification', () => {
  const result=classifyWebsiteRelease({
    changedPaths:[
      '.github/workflows/required-test.yml',
      '.github/workflows/portal-v2-tests.yml',
      '.github/workflows/seo-growth-intelligence.yml'
    ],
    riskConfig,
    acceptedBaseline
  });
  assert.equal(result.lane,'control-plane');
  assert.equal(result.requires_preview,false);
  assert.deepEqual(result.affected_routes,[]);
});

test('real shared website artifacts remain high-risk and require preview', () => {
  for(const path of ['assets/js/menu.js','netlify.toml']){
    const result=classifyWebsiteRelease({changedPaths:[path],riskConfig,acceptedBaseline});
    assert.equal(result.lane,'high-risk');
    assert.equal(result.requires_preview,true);
  }
});
