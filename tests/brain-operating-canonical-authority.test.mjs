import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('production operating loop uses Supabase as the only persisted Brain authority', async()=>{
  const loop=await readFile('netlify/functions/brain-operating-loop.mjs','utf8');
  const ingest=await readFile('netlify/functions/brain-operating-ingest.mjs','utf8');
  for(const [name,source] of [['loop',loop],['ingest',ingest]]){
    assert.equal(source.includes('@netlify/blobs'),false,`${name} must not persist canonical Brain records in Netlify Blobs`);
    assert.equal(source.includes('createBlobAdapter'),false,`${name} must not instantiate a parallel Blob authority`);
  }
  assert.match(loop,/BRAIN_OPERATING_AUTHORITY_URL/,'user operating loop must use the managed canonical authority bridge');
  assert.match(ingest,/CANONICAL_BRAIN_SERVICE_INGEST/,'legacy service ingest must fail closed instead of writing a second authority');
});
