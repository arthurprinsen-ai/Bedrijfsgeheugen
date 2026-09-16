import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

const PROOF_FILE = 'data/content-publication-ledger.json';

test('native-daily-blog-proof is registered only for the canonical live-proof ledger', () => {
  assert.doesNotThrow(() => allowedForWriter('native-daily-blog-proof'));
  assert.deepEqual(validateWriterPaths('native-daily-blog-proof', [PROOF_FILE]).files, [PROOF_FILE]);
});

test('native-daily-blog-proof rejects all publication and configuration paths', () => {
  for (const forbidden of ['sitemap.xml', 'blog/index.html', 'netlify.toml']) {
    assert.throws(
      () => validateWriterPaths('native-daily-blog-proof', [PROOF_FILE, forbidden]),
      /UNAPPROVED_WRITER_PATH:/,
    );
  }
});
