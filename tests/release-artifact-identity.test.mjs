import test from 'node:test';
import assert from 'node:assert/strict';
import { createReleaseEvidence } from '../tools/build/release-evidence.mjs';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const SHA='9353ecfc8d5a463a89963ae9b671318d3db02d54';
const ART='sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const OTHER='sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

test('release evidence carries immutable source artifact identity',()=>{
  const evidence=createReleaseEvidence({
    commitRef:SHA,
    artifactId:ART,
    context:'production',
    deployId:'deploy-123',
    generatedAt:'2026-10-06T00:00:00.000Z',
  });
  assert.equal(evidence.commit_ref,SHA);
  assert.equal(evidence.artifact_id,ART);
  assert.equal(evidence.deploy_id,'deploy-123');
});

test('exact production identity requires matching artifact id',()=>{
  assert.throws(()=>evaluateProductionReadback({
    mergeSha:SHA,
    deployedSha:SHA,
    deployStatus:'ready',
    deployId:'deploy-123',
    routesOk:true,
    expectedArtifactId:ART,
    observedArtifactId:OTHER,
  }),/artifact/i);
});

test('exact production identity accepts matching artifact id',()=>{
  const result=evaluateProductionReadback({
    mergeSha:SHA,
    deployedSha:SHA,
    deployStatus:'ready',
    deployId:'deploy-123',
    routesOk:true,
    expectedArtifactId:ART,
    observedArtifactId:ART,
  });
  assert.equal(result.status,'LIVE_VERIFIED');
  assert.match(result.reason,/artifact/);
});

test('safe descendant requires a valid observed artifact identity',()=>{
  const descendant='8353ecfc8d5a463a89963ae9b671318d3db02d55';
  assert.throws(()=>evaluateProductionReadback({
    mergeSha:SHA,
    deployedSha:descendant,
    deployStatus:'ready',
    deployId:'deploy-456',
    routesOk:true,
    expectedArtifactId:ART,
    observedArtifactId:'',
    supersessionSafe:true,
  }),/artifact/i);
});
