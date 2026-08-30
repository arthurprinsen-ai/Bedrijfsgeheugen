import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const [name,path] of Object.entries({
  'approved-central-blog':'.github/workflows/approved-central-blog.yml',
  'blog-bijwerken':'.github/workflows/blog-bijwerken.yml',
})) {
  test(`${name} verification remains fixture-safe and candidate-only`,()=>{
    const w=fs.readFileSync(path,'utf8');
    assert.match(w,/verification_mode/);
    assert.match(w,/candidate-pr/);
    assert.doesNotMatch(w,/git\s+push\s+origin\s+HEAD:main/);
  });
}
