import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('preview and production verify the canonical footer on real public routes', () => {
  assert.ok(existsSync('.github/workflows/production-seo-smoke.yml'), 'production SEO/footer smoke workflow must exist');
  const preview = read('.github/workflows/live-preview-smoke.yml');
  const production = read('.github/workflows/production-seo-smoke.yml');
  for (const workflow of [preview, production]) {
    assert.match(workflow, /site\/footer-contract\.json/);
    assert.match(workflow, /\.github\/canoniek\/voet\.html/);
    assert.match(workflow, /bgvoet/);
    assert.match(workflow, /\/over-ons/);
    assert.match(workflow, /\/bedrijfsgeheugen/);
    assert.match(workflow, /\/blog\//);
    assert.match(workflow, /validate-footer-seo\.mjs|footer/i);
  }
  assert.match(production, /https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(production, /github\.sha|GITHUB_SHA|commit_ref/i);
});
