import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('Make is excluded',()=>assert.match(fs.readFileSync('tools/content-growth/no-make.txt','utf8'),/false/));
