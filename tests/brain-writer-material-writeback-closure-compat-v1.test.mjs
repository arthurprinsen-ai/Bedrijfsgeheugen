import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('canonical closure artifacts are compatible with bounded writer paths',()=>{
  const files=[
    'netlify.toml',
    'brain/learning/2026-09-19-example.json',
    'docs/changes/2026-09-19-example.md',
    'docs/development-ledger-events/2026-09-19-example.md',
  ];
  assert.equal(validateWriterPaths('seo-controle',files,[]).ok,true);
});

test('writer closure compatibility remains fail closed outside canonical closure families',()=>{
  assert.throws(
    ()=>validateWriterPaths('seo-controle',['netlify.toml','.github/workflows/required-test.yml'],[]),
    /UNAPPROVED_WRITER_PATH/
  );
});
