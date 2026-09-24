import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('long-running browser and production readback jobs are bounded', async()=>{
  const cases=[
    ['.github/workflows/lane-website.yml', /browser:\n(?:.|\n)*?timeout-minutes:\s*25/],
    ['.github/workflows/canonical-brand-shell-live-readback.yml', /production-readback:\n(?:.|\n)*?timeout-minutes:\s*25/],
    ['.github/workflows/production-release-readback.yml', /production-readback:\n(?:.|\n)*?timeout-minutes:\s*25/],
  ];
  for(const [path,pattern] of cases){
    const text=await readFile(path,'utf8');
    assert.match(text,pattern, `${path} must bound the long-running job with timeout-minutes: 25`);
  }
});

test('production readbacks are single-flight and supersede obsolete runs', async()=>{
  const brand=await readFile('.github/workflows/canonical-brand-shell-live-readback.yml','utf8');
  assert.match(brand,/concurrency:\n\s+group:\s+canonical-brand-shell-live-readback-/);
  assert.match(brand,/cancel-in-progress:\s*true/);

  const release=await readFile('.github/workflows/production-release-readback.yml','utf8');
  assert.match(release,/concurrency:\n\s+group:\s+production-release-readback\n\s+cancel-in-progress:\s*true/);
});
