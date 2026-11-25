import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Netlify production heartbeat remains behavior-neutral',()=>{
  const config=fs.readFileSync('netlify.toml','utf8');
  assert.match(config,/production redeploy heartbeat: pricing-i18n-live-20260924-v1/);
  // Production uses the governed selective ignore script (fails open for runtime paths);
  // the heartbeat comments themselves must never introduce an unconditional skip.
  assert.match(config,/^\s*ignore\s*=\s*"node \.\/tools\/ci\/netlify-ignore-build\.mjs"/m);
  assert.doesNotMatch(config,/^\[build\][\s\S]*?^\s*ignore\s*=\s*"exit 1"[\s\S]*?(?=^\[context\.deploy-preview\])/m);
});
