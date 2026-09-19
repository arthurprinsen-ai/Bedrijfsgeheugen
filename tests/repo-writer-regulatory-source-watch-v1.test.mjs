import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('regulatory-source-watch can write only the canonical regulatory source state',()=>{
  const policy=allowedForWriter('regulatory-source-watch');
  assert.equal(policy.length,1);
  assert.doesNotThrow(()=>validateWriterPaths('regulatory-source-watch',['data/regulatory-source-state.json']));
  assert.throws(
    ()=>validateWriterPaths('regulatory-source-watch',['data/regelgeving.json']),
    /UNAPPROVED_WRITER_PATH:data\/regelgeving\.json/
  );
  assert.throws(
    ()=>validateWriterPaths('regulatory-source-watch',['data/unowned.json']),
    /UNAPPROVED_WRITER_PATH:data\/unowned\.json/
  );
});
