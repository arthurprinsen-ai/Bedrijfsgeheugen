import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir='.github/workflows';
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.yml'));
const direct=files.filter(name=>/git\s+push\s+origin\s+HEAD:main/.test(fs.readFileSync(path.join(dir,name),'utf8'))).sort();

test('BRAIN v2 has zero direct-main workflow writers',()=>{
  assert.deepEqual(direct,[],'direct main writers are forbidden; writers must create candidate PRs for BG169');
});
