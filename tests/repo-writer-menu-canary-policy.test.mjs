import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('menu writer allows only its bounded no-op canary evidence shape', () => {
  assert.equal(validateWriterPaths('menu-balk-fix', [
    'brain/evidence/writer-canary/menu-balk-fix-33314973402-1.json',
  ]).ok, true);

  assert.throws(
    () => validateWriterPaths('menu-balk-fix', ['brain/evidence/writer-canary/weekblog-33314973402-1.json']),
    /UNAPPROVED_WRITER_PATH/,
  );
  assert.throws(
    () => validateWriterPaths('menu-balk-fix', ['brain/evidence/writer-canary/menu-balk-fix-manual.json']),
    /UNAPPROVED_WRITER_PATH/,
  );
});
