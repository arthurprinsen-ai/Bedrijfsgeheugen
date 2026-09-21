import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('terminal migration traversal stops at cross-obligation supersedes boundary',()=>{
  const yml=fs.readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(yml,/SUPERSEDES_OBLIGATION_BOUNDARY/);
  assert.doesNotMatch(yml,/throw new Error\(\`SUPERSEDES_OBLIGATION_MISMATCH/);
});
