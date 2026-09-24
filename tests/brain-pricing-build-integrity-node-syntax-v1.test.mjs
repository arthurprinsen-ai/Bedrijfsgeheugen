import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

test('all Netlify build-command Node scripts parse before merge',()=>{
  const toml=fs.readFileSync('netlify.toml','utf8');
  const match=toml.match(/command\s*=\s*"([^"]+)"/);
  assert.ok(match,'netlify build command missing');
  const scripts=[...match[1].matchAll(/node\s+([^\s&]+)/g)].map(m=>m[1]);
  assert.ok(scripts.includes('tools/site-shell/pricing-build-integrity.mjs'));
  for(const script of scripts){
    execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
  }
});
