import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

test('all Netlify build-command Node scripts parse before merge',()=>{
  const toml=fs.readFileSync('netlify.toml','utf8');
  const match=toml.match(/command\s*=\s*"([^"]+)"/);
  assert.ok(match,'netlify build command missing');
  assert.equal(match[1],'node tools/ci/netlify-build-entry.mjs');
  const entry=fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  const scripts=['tools/ci/netlify-build-entry.mjs',...[...entry.matchAll(/^  \['[^']+','([^']+\.mjs)'/gm)].map(m=>m[1])];
  assert.ok(scripts.length>1,'build entrypoint must declare executable phases');
  assert.ok(scripts.includes('tools/site-shell/pricing-build-integrity.mjs'));
  for(const script of scripts){
    execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
  }
});
