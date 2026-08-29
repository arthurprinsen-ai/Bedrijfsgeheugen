import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/live-preview-smoke.yml', 'utf8');

test('live preview checks out the exact pull request head that Netlify builds', () => {
  assert.match(workflow, /uses:\s*actions\/checkout@v5[\s\S]{0,220}ref:\s*\$\{\{\s*github\.event\.pull_request\.head\.sha\s*\}\}/);
});

test('live preview fails closed if checkout SHA differs from the Netlify candidate SHA', () => {
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha/);
  assert.match(workflow, /checkout.*head|head.*checkout/i);
});

test('live preview still fetches the public deploy-preview URL before browser verification', () => {
  assert.match(workflow, /https:\/\/deploy-preview-\$\{\{ github\.event\.pull_request\.number \}\}--bedrijfsgeheugen\.netlify\.app/);
  assert.match(workflow, /curl -fsS --max-time 20 "\$PREVIEW_URL\/"/);
});
