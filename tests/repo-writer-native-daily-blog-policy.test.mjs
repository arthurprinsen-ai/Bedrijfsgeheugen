import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

const DAILY_BLOG_FILES = [
  'blog/index.html',
  'blog/ongeprijsd-probleem-bedrijfsvoering/index.html',
  'blog/rss.xml',
  'data/content-publication-ledger.json',
  'sitemap.xml',
];

test('native-daily-blog is a registered bounded writer for its deterministic publication surface', () => {
  assert.doesNotThrow(() => allowedForWriter('native-daily-blog'));
  assert.deepEqual(
    validateWriterPaths('native-daily-blog', DAILY_BLOG_FILES).files,
    [...DAILY_BLOG_FILES].sort(),
  );
});

test('native-daily-blog rejects paths outside the publication surface', () => {
  assert.throws(
    () => validateWriterPaths('native-daily-blog', [...DAILY_BLOG_FILES, 'netlify.toml']),
    /UNAPPROVED_WRITER_PATH:netlify\.toml/,
  );
});
