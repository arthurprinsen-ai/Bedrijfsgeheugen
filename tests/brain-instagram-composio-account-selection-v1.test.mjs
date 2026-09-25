import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('Instagram Composio account selection resolves the canonical bedrijfsgeheugen.nl identity',()=>{
  assert.match(publisher,/toolkit==='instagram'/);
  assert.match(publisher,/endpoint:'\/me\?fields=id,username'/);
  assert.match(publisher,/username==='bedrijfsgeheugen\.nl'/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS/);
  assert.match(publisher,/matches\.length!==1/);
});
