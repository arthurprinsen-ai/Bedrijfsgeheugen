import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cross=readFileSync('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');
const preview=readFileSync('.github/workflows/portal-v2-live-preview.yml','utf8');

test('GitHub Playwright container uses bash, not sh, for real prerequisite launch',()=>{
  assert.match(cross,/defaults:\s*\n\s*run:\s*\n\s*shell: bash/);
  assert.match(cross,/set -euo pipefail/);
  assert.match(cross,/container:\s*\n\s*image: mcr\.microsoft\.com\/playwright:/);
});

test('original cross-browser workflow bypasses irrelevant ffmpeg-static binary postinstall only',()=>{
  assert.match(cross,/npm install --no-save --ignore-scripts playwright@1\.55\.0/);
  assert.doesNotMatch(cross,/npm install --no-save playwright@1\.55\.0/);
  assert.match(cross,/mcr\.microsoft\.com\/playwright:v1\.55\.0-noble/);
  assert.match(cross,/engine\.executablePath\(\)/);
  assert.match(cross,/BROWSER_BINARY_PRESENT/);
  assert.doesNotMatch(cross,/npx playwright install --with-deps chromium firefox webkit/);
  assert.match(cross,/node --test tests\/brain-website-cross-browser-screenshot-assurance-v1\.test\.mjs/);
  assert.match(cross,/node tools\/site-shell\/website-cross-browser-assurance\.mjs/);
  assert.match(cross,/runs-on: ubuntu-24\.04/);
  assert.match(cross,/cron: '20 6 \* \* \*'/);
});
test('failed browser prereq is preserved as machine-readable original workflow evidence, never green',()=>{
  assert.match(cross,/id: install/);
  assert.match(cross,/if: failure\(\) && steps\.install\.outcome == 'failure'/);
  assert.match(cross,/ci-install-error\.json/);
  assert.match(cross,/CROSS_BROWSER_DEPENDENCY_INSTALL_FAILED/);
  assert.match(cross,/release_claim[^\n]*NOT_VERIFIED/);
  assert.match(cross,/if-no-files-found: error/);
});
test('Portal preview returns deterministic AUTH_REQUIRED instead of retrying HTTP 401 or 403',()=>{
  for(const stage of ['alias','immutable']){
    assert.match(preview,new RegExp('NETLIFY_PREVIEW_AUTH_REQUIRED stage='+stage));
  }
  assert.match(preview,/alias_http.*curl -sS --max-time 20/);
  assert.match(preview,/immutable_http.*curl -sS --max-time 20/);
  assert.match(preview,/\[ "\$alias_http" = "401" \] \|\| \[ "\$alias_http" = "403" \]/);
  assert.match(preview,/\[ "\$immutable_http" = "401" \] \|\| \[ "\$immutable_http" = "403" \]/);
  assert.match(preview,/Netlify immutable preview blocked by HTTP/);
  assert.doesNotMatch(preview,/--insecure|--no-check-certificate|NETLIFY_PASSWORD_BYPASS/);
});
test('CI still requires exact provider-backed immutable preview identity and browser test',()=>{
  assert.match(preview,/deployed_sha" = "\$HEAD_SHA"/);
  assert.match(preview,/NETLIFY_DEPLOY_ID=\$deploy_id/);
  assert.match(preview,/PREVIEW_URL=\$immutable/);
  assert.match(preview,/portal-v2-mobile-shell\.spec\.js/);
  assert.match(preview,/portal-v2-live\.spec\.js/);
});
test('both historical incidents have a typed ONE BRAIN lesson and require protected live proof',()=>{
  const records=[
    'brain/learning/2026-11-05-cross-browser-ffmpeg-postinstall-http-504.json',
    'brain/learning/2026-11-05-netlify-preview-401-fast-failure.json'
  ];
  for(const file of records){
    const lesson=JSON.parse(readFileSync(file,'utf8'));
    assert.equal(lesson.status,'CODE_CANDIDATE_UNVERIFIED');
    assert.equal(lesson.compiler.machine_enforceable,true);
    assert.ok(lesson.evaluation.historical_replay.includes('tests/brain-ci-browser-install-and-netlify-preview-auth-20261105.test.mjs'));
    assert.equal(lesson.production_readback,'EVIDENCE_DUE');
    assert.ok(lesson.fingerprint && lesson.root_cause && lesson.prevention && lesson.owner);
  }
});
