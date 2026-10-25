import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyNetlifyDeploymentEvidence, deriveNetlifyDeploymentApplicability } from '../tools/delivery/netlify-deployment-applicability.mjs';

const a='a'.repeat(40), b='b'.repeat(40);

test('governance-only code merge needs no Netlify deployment despite stale provider SHA', () => {
  const applicability=deriveNetlifyDeploymentApplicability({changedPaths:['.github/workflows/powerhouse-repository-janitor.yml','platform/system-map/canonical-system-map.mjs','tests/brain-autonomous-branch-sync-4914.test.mjs'],headSha:a});
  assert.equal(applicability.deploymentRequired,false);
  const result=classifyNetlifyDeploymentEvidence({applicability,headSha:a,providerCommitSha:b,providerState:'ready'});
  assert.equal(result.status,'NOT_REQUIRED');
  assert.equal(result.productionVerified,false);
});

test('runtime change with stale Netlify SHA remains pending', () => {
  const applicability={deploymentRequired:true,reason:'netlify-impact'};
  assert.equal(classifyNetlifyDeploymentEvidence({applicability,headSha:a,providerCommitSha:b,providerState:'ready'}).status,'PENDING');
  assert.equal(classifyNetlifyDeploymentEvidence({applicability,headSha:a,providerCommitSha:a,providerState:'building'}).status,'PENDING');
});

test('matching SHA is not falsely promoted to fully verified production', () => {
  const result=classifyNetlifyDeploymentEvidence({applicability:{deploymentRequired:true,reason:'netlify-impact'},headSha:a,providerCommitSha:a,providerState:'ready'});
  assert.equal(result.status,'SHA_MATCHED');
  assert.equal(result.productionVerified,false);
});

test('missing evidence or explicit manual skip never becomes green', () => {
  assert.equal(classifyNetlifyDeploymentEvidence({}).status,'UNKNOWN');
  assert.equal(classifyNetlifyDeploymentEvidence({applicability:{deploymentRequired:true},headSha:a}).status,'UNKNOWN');
  assert.equal(classifyNetlifyDeploymentEvidence({applicability:{deploymentRequired:false,reason:'explicit-no-deploy'},headSha:a,providerCommitSha:a,providerState:'ready'}).status,'UNKNOWN');
});
