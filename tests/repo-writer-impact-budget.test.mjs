import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('paginacontrole rejects an allowed path when the diff impact is destructive', () => {
  assert.throws(
    () => validateWriterPaths(
      'paginacontrole',
      ['afmaakindex.html'],
      [{ file: 'afmaakindex.html', additions: 4, deletions: 423 }],
    ),
    /WRITER_DIFF_IMPACT_EXCEEDED:afmaakindex\.html/,
  );
});

test('paginacontrole accepts small bounded repairs on its allowed paths', () => {
  const result = validateWriterPaths(
    'paginacontrole',
    ['afmaakindex.html', 'seo-status.json'],
    [
      { file: 'afmaakindex.html', additions: 2, deletions: 2 },
      { file: 'seo-status.json', additions: 1, deletions: 1 },
    ],
  );
  assert.equal(result.ok, true);
});
