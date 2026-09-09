import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('tools/content-growth/manifest.json','utf8'));
test('native content growth runtime explicitly excludes Make',()=>assert.equal(x.make_required,false));
