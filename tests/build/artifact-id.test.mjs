import test from 'node:test';
import assert from 'node:assert/strict';
import { computeArtifactId } from '../../tools/build/artifact-id.mjs';

const input={
  sourceManifest:['a:111','b:222'],
  lockfileContents:'lock-v1',
  toolchainManifest:{node:'22.12.0',builder:'netlify-production-v1'},
  contractVersion:'1',
};

test('artifact identity is deterministic',()=>{
  assert.equal(computeArtifactId(input),computeArtifactId({...input}));
  assert.match(computeArtifactId(input),/^sha256:[0-9a-f]{64}$/);
});

test('artifact identity changes when lockfile changes',()=>{
  assert.notEqual(computeArtifactId(input),computeArtifactId({...input,lockfileContents:'lock-v2'}));
});

test('source manifest order is normalized',()=>{
  assert.equal(computeArtifactId(input),computeArtifactId({...input,sourceManifest:['b:222','a:111']}));
});
