import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('preview and production verify the canonical footer on real public routes', () => {
  assert.ok(existsSync('.github/workflows/production-seo-smoke.yml'), 'production SEO/footer smoke workflow must exist');
  assert.ok(existsSync('tools/verify-public-footer.mjs'), 'shared public footer verifier must exist');
  const workflow = read('.github/workflows/production-seo-smoke.yml');
  const verifier = read('tools/verify-public-footer.mjs');
  assert.match(workflow, /deploy-preview-/);
  assert.match(workflow, /https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(workflow, /site\/footer-contract\.json/);
  assert.match(workflow, /\.github\/canoniek\/voet\.html/);
  assert.match(workflow, /github\.sha|GITHUB_SHA|commit_ref/i);
  assert.match(workflow, /verify-public-footer\.mjs/);
  assert.match(verifier, /bgvoet/);
  assert.match(verifier, /\/over-ons/);
  assert.match(verifier, /\/bedrijfsgeheugen/);
  assert.match(verifier, /\/blog\//);
  assert.match(verifier, /strategicDestinations/);
});
