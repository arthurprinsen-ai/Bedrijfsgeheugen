import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('authoritative policy covers all seven direct-main writers', () => {
  const writers = [
    'approved-central-blog', 'blog-bijwerken', 'menu-balk-fix', 'paginacontrole',
    'regelgeving-bijwerken', 'seo-controle', 'weekblog',
  ];
  for (const writer of writers) assert.ok(allowedForWriter(writer).length > 0, `${writer} must have a bounded path policy`);
  assert.throws(() => allowedForWriter('unknown-writer'), /UNKNOWN_WRITER/);
});

test('writer path policies accept intended files and reject cross-domain drift', () => {
  assert.equal(validateWriterPaths('regelgeving-bijwerken', ['data/regelgeving.json']).ok, true);
  assert.equal(validateWriterPaths('seo-controle', ['sitemap.xml', 'netlify.toml']).ok, true);
  assert.equal(validateWriterPaths('approved-central-blog', ['blog/voorbeeld/index.html', 'blog/index.html', 'blog/rss.xml', 'sitemap.xml']).ok, true);
  assert.throws(() => validateWriterPaths('regelgeving-bijwerken', ['data/regelgeving.json', '.github/workflows/x.yml']), /UNAPPROVED_WRITER_PATH/);
  assert.throws(() => validateWriterPaths('menu-balk-fix', ['index.html', 'package.json']), /UNAPPROVED_WRITER_PATH/);
});

test('shadow workflow is read-only and only verifies writer candidate PRs', () => {
  const text = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(text, /pull_request:/);
  assert.match(text, /branches:\s*\n\s*- main/);
  assert.match(text, /startsWith\(github\.head_ref, 'writer\/'\)/);
  assert.match(text, /permissions:\s*\n\s*contents:\s*read\b/);
  assert.doesNotMatch(text, /contents:\s*write\b/);
  assert.doesNotMatch(text, /pull-requests:\s*write\b/);
  assert.doesNotMatch(text, /\bgit\s+push\b|\bgh\s+pr\s+merge\b|\/merges\b/);
  assert.match(text, /repo-writer-shadow-verify\.mjs/);
});
