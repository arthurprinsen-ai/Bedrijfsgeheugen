import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 deriveNetlifyDeploymentApplicability,
 requiresBrainRuntimeAuthenticatedProof,
 NETLIFY_RUNTIME_EXACT,
 classifyNetlifyDeploymentEvidence
} from '../tools/delivery/netlify-deployment-applicability.mjs';
import {isNetlifyRuntimePath} from '../tools/site-shell/production-supersession.mjs';

const file='platform/agents/agent-team.mjs';
const sha='a'.repeat(40);
const otherSha='b'.repeat(40);
const policy=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
const classify=(paths)=>deriveNetlifyDeploymentApplicability({changedPaths:paths,headSha:sha,policy});

test('imported original agent registry is actual Netlify runtime in both original classifiers',()=>{
 assert.equal(NETLIFY_RUNTIME_EXACT.has(file),true);
 assert.equal(isNetlifyRuntimePath(file),true);
 const classification=classify([file]);
 assert.equal(classification.deploymentRequired,true);
 assert.equal(classification.netlifyRuntimeRequired,true);
 assert.equal(classification.reason,'netlify-impact');
 assert.equal(requiresBrainRuntimeAuthenticatedProof([file]),true);
});

test('provider READY on old commit is not current agent runtime release',()=>{
 const applicability=classify([file]);
 assert.equal(classifyNetlifyDeploymentEvidence({applicability,headSha:sha,providerCommitSha:otherSha,providerState:'ready'}).status,'PENDING');
 assert.equal(classifyNetlifyDeploymentEvidence({applicability,headSha:sha,providerCommitSha:sha,providerState:'ready'}).status,'SHA_MATCHED');
});

test('original private Netlify function source imports the canonical agent roster',()=>{
 const src=readFileSync('netlify/functions/_cost-projection-store.mjs','utf8');
 const other=readFileSync('netlify/functions/_powerhouse-compound-improvement-proof.mjs','utf8');
 assert.match(src,/from '\.\.\/\.\.\/platform\/agents\/agent-team\.mjs'/);
 assert.match(other,/from '\.\.\/\.\.\/platform\/agents\/agent-team\.mjs'/);
});

test('docs or BRAIN learning are nonruntime and never falsely demand deploy',()=>{
 const rows=['docs/changes/example.md','.agents/skills/powerhouse-security-trust-center/SKILL.md','brain/learning/example.json'];
 assert.equal(classify(rows).deploymentRequired,false);
 assert.equal(classify(rows).netlifyRuntimeRequired,false);
});

test('same canonical Security Agent and skill require runtime SHA proof',()=>{
 const roster=readFileSync(file,'utf8');
 const skill=readFileSync('.agents/skills/powerhouse-security-trust-center/SKILL.md','utf8');
 assert.equal((roster.match(/id:'agent-security'/g)||[]).length,1);
 assert.match(roster,/verify-canonical-agent-registry-netlify-runtime-release-parity/);
 assert.match(skill,/Imported-agent Netlify deployment parity/);
 assert.match(skill,/exact source SHA/i);
 assert.match(skill,/Netlify build parity/i);
});

test('security-sensitive regression is registered for historical, shadow and canary',()=>{
 const learning=JSON.parse(readFileSync('brain/learning/2026-11-02-security-agent-netlify-runtime-parity-v1.json','utf8'));
 assert.equal(learning.compiler.security_sensitive,true);
 assert.equal(learning.compiler.machine_enforceable,true);
 for(const key of ['historical_replay','shadow','canary']) assert.ok(learning.evaluation[key].includes('tests/brain-security-agent-netlify-runtime-parity-20261102.test.mjs'));
 assert.equal(learning.proof_state,'CANDIDATE_PENDING_ORIGINAL_NETLIFY_PROVIDER_READBACK');
});
