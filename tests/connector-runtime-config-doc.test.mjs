import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const doc=readFileSync(new URL('../docs/connectors/runtime-provider-config.md',import.meta.url),'utf8');

test('connector runtime config documents every server-side provider switch without embedding secrets',()=>{
  for(const key of ['AFAS_SAFE_TEST_URL','EXACT_SAFE_TEST_URL','DOCUMENT_EXTRACTOR_URL']) assert.match(doc,new RegExp(key));
  assert.doesNotMatch(doc,/Bearer\s+[A-Za-z0-9._-]+|password\s*=|api[_-]?key\s*=/i);
});
