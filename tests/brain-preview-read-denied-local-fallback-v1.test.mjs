import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const yaml=readFileSync('.github/workflows/lane-website.yml','utf8');
const start=yaml.indexOf('  preview-ready:');
const end=yaml.indexOf('  browser:',start);
const block=yaml.slice(start,end);
const browser=yaml.slice(end);

test('a GitHub status read denial never becomes a provider green preview',()=>{
  assert.ok(start>=0&&end>start);
  assert.match(block,/if\(!response\.ok\)\{/);
  assert.match(block,/\[403,404,429\]\.includes\(response\.status\)/);
  assert.match(block,/::warning::GITHUB_PREVIEW_STATUS_UNAVAILABLE/);
  assert.match(block,/using exact local candidate browser proof, not provider preview green/);
  assert.match(block,/throw new Error\(/);
});
test('the denied-read fallback retains explicit local-exact-candidate authority and immutable SHA checkout',()=>{
  assert.match(block,/preview_mode=local-exact-candidate/);
  assert.match(block,/base_url=http:\/\/127\.0\.0\.1:4173/);
  assert.match(browser,/ref: \$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(browser,/needs\.preview-ready\.outputs\.preview_mode == 'local-exact-candidate'/);
  assert.match(browser,/node tools\/ci\/netlify-build-entry\.mjs/);
  assert.match(browser,/Verify affected routes on desktop and mobile/);
  assert.match(browser,/Verify all public pages are visibly rendered/);
  assert.match(browser,/Verify checkout selection and server-confirmed completion rendering/);
});
