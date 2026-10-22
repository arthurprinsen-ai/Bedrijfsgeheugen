import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalNetlifyBuild,phaseIndex} from './brain-netlify-canonical-build-source.mjs';
test('product-led production promotion keeps canonical build and redeploy heartbeat',()=>{
  const {toml,phases}=canonicalNetlifyBuild();
  phaseIndex(phases,'product-led-home','tools/site-shell/apply-product-led-home.mjs');
  assert.match(toml,/production redeploy heartbeat: product-led-home-live-20260930-v1/);
});
