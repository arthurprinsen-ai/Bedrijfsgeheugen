import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('only Required test owns the protected status context named test', async () => {
  const dir='.github/workflows';
  const files=(await readdir(dir)).filter(name=>/\.ya?ml$/.test(name));
  const owners=[];
  for(const name of files){
    const text=await readFile(join(dir,name),'utf8');
    if(/^  test:\s*$/m.test(text) || /^\s+name:\s*test\s*$/m.test(text)) owners.push(name);
  }
  assert.deepEqual(owners,['required-test.yml']);
});
