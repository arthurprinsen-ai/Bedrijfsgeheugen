import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/powerhouse-skill-projection.yml','utf8');

test('skill projection bootstraps package dependencies before learning replay',()=>{
  const install=workflow.indexOf('Install projection-test dependencies');
  const canonicalize=workflow.indexOf('Evaluate changed learning before canonicalization');
  assert.ok(install>=0,'dependency bootstrap step missing');
  assert.ok(canonicalize>install,'dependency bootstrap must run before canonicalization replay');
  const bootstrap=workflow.slice(install,canonicalize);
  const commands=[...bootstrap.matchAll(/\bnpm install ((?:--[a-z-]+(?:=\w+)? ?)+)/g)].map(match=>match[1].trim().split(/\s+/));
  assert.equal(commands.length,2,'one initial install and at most one revalidation command');
  for(const [index,flags] of commands.entries()){
    const expected=['--ignore-scripts','--no-audit','--no-fund',index===0?'--prefer-offline':'--prefer-online','--loglevel=error'];
    assert.deepEqual([...flags].sort(),expected.sort(),'preserve exact install controls without relying on flag order');
  }
  assert.match(bootstrap,/code ETARGET/,'only ETARGET may trigger revalidation');
});
