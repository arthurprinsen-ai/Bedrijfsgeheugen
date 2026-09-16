import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const builder=fs.readFileSync(new URL('../../tools/bouw-v18-production.mjs',import.meta.url),'utf8');
const workflow=fs.readFileSync(new URL('../../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');

test('Netlify build publishes exact commit identity for release readback',()=>{
  assert.match(builder,/COMMIT_REF/);
  assert.match(builder,/deploy-identity\.json/);
  assert.match(builder,/release\.json/);
  assert.match(builder,/commit_ref/);
  assert.match(builder,/deploy_id/);
});

test('Portal V2 readback pins the exact immutable deploy after SHA resolution',()=>{
  assert.match(workflow,/release\.json/);
  assert.match(workflow,/deploy_id/);
  assert.match(workflow,/--bedrijfsgeheugen\.netlify\.app/);
  assert.match(workflow,/PORTAL_EXPECTED_SHA/);
  assert.match(workflow,/github\.event\.pull_request\.head\.sha/);
  assert.match(workflow,/GITHUB_SHA/);
  assert.match(workflow,/commit_ref/);
  assert.match(workflow,/deployed_sha/);
  assert.match(workflow,/"\$deployed_sha" = "\$PORTAL_EXPECTED_SHA"/);
  assert.match(workflow,/PORTAL_READBACK_URL=\$\{immutable\}/);
});
