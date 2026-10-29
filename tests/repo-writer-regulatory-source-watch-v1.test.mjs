import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedForWriter, validateWriterPaths } from '../scripts/ci/repo-writer-policy.mjs';

test('regulatory-source-watch can write canonical source state and mandatory closure evidence only',()=>{
  const policy=allowedForWriter('regulatory-source-watch');
  assert.equal(policy.length,5);
  assert.doesNotThrow(()=>validateWriterPaths('regulatory-source-watch',['data/regulatory-source-state.json']));
  for(const path of ['brain/learning/regulatory-source-watch.json','docs/development-ledger-events/regulatory-source-watch.md','docs/development-ledger/regulatory-source-watch.md','docs/changes/regulatory-source-watch.md','docs/learning/regulatory-source-watch.md']) {
    assert.doesNotThrow(()=>validateWriterPaths('regulatory-source-watch',[path]));
  }
  for(const path of ['brain/learning/regulatory-source-watch.sql','docs/changes/regulatory-source-watch.sql','supabase/migrations/regulatory-source-watch.sql','netlify/functions/regulatory-source-watch.mjs']) {
    assert.throws(()=>validateWriterPaths('regulatory-source-watch',[path]),/UNAPPROVED_WRITER_PATH/);
  }
  assert.throws(
    ()=>validateWriterPaths('regulatory-source-watch',['data/regelgeving.json']),
    /UNAPPROVED_WRITER_PATH:data\/regelgeving\.json/
  );
  assert.throws(
    ()=>validateWriterPaths('regulatory-source-watch',['data/unowned.json']),
    /UNAPPROVED_WRITER_PATH:data\/unowned\.json/
  );
});
