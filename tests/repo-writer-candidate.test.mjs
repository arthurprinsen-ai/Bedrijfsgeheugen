import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWriterCandidate,
  validateWriterCandidate,
} from '../scripts/ci/repo-writer-candidate.mjs';

test('candidate identity is deterministic and contains no raw task payload', () => {
  const input = {
    writer: 'approved-central-blog',
    baseSha: 'a'.repeat(40),
    runId: '33258094009',
    changedFiles: ['blog/example/index.html', 'blog/index.html', 'blog/rss.xml', 'sitemap.xml'],
    allowedFiles: ['blog/example/index.html', 'blog/index.html', 'blog/rss.xml', 'sitemap.xml'],
    rollbackSha: 'b'.repeat(40),
    task: 'customer-private text must never be embedded in identifiers',
  };

  const a = createWriterCandidate(input);
  const b = createWriterCandidate({...input});

  assert.deepEqual(a, b);
  assert.match(a.branch, /^writer\/approved-central-blog\/[a-f0-9]{16}$/);
  assert.match(a.idempotencyKey, /^writer-candidate:[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(a).includes(input.task), false);
});

test('candidate fails closed when changed files escape the writer allowlist', () => {
  const candidate = createWriterCandidate({
    writer: 'weekblog',
    baseSha: 'a'.repeat(40),
    runId: '42',
    changedFiles: ['blog/new/index.html', '.github/workflows/paginacontrole.yml'],
    allowedFiles: ['blog/new/index.html'],
    rollbackSha: 'b'.repeat(40),
  });

  assert.throws(
    () => validateWriterCandidate(candidate),
    /UNAPPROVED_CHANGED_FILE/,
  );
});

test('candidate records exact base and rollback SHAs and validates only immutable SHA-shaped refs', () => {
  const candidate = createWriterCandidate({
    writer: 'seo-controle',
    baseSha: 'c'.repeat(40),
    runId: '77',
    changedFiles: ['sitemap.xml', 'netlify.toml'],
    allowedFiles: ['sitemap.xml', 'netlify.toml'],
    rollbackSha: 'd'.repeat(40),
  });

  assert.equal(candidate.baseSha, 'c'.repeat(40));
  assert.equal(candidate.rollbackSha, 'd'.repeat(40));
  assert.equal(validateWriterCandidate(candidate).ok, true);

  assert.throws(
    () => createWriterCandidate({...candidate, baseSha: 'main'}),
    /INVALID_BASE_SHA/,
  );
});

test('candidate cannot authorize or merge itself', () => {
  const candidate = createWriterCandidate({
    writer: 'regelgeving-bijwerken',
    baseSha: 'e'.repeat(40),
    runId: '88',
    changedFiles: ['data/regelgeving.json'],
    allowedFiles: ['data/regelgeving.json'],
    rollbackSha: 'f'.repeat(40),
  });

  assert.equal('merge' in candidate, false);
  assert.equal('authorized' in candidate, false);
  assert.equal(candidate.state, 'CANDIDATE_ONLY');
});
