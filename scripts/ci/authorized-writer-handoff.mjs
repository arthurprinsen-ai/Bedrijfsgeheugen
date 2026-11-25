import manifest from '../../config/brain-writer-approved-handoff.json' with { type: 'json' };
import policy from '../../config/brain-writer-approved-paths.json' with { type: 'json' };
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { runAuthorizedWriterHandoff, preflightReviewedWriterHandoff } from '../../tools/delivery/writer-authorized-runner.mjs';
import { authorizedPgQuery } from './authorized-writer-pg.mjs';
if (policy.contract !== 'brain-writer-approved-paths-v1' || !Array.isArray(policy.paths) || !policy.paths.length || new Set(policy.paths).size !== policy.paths.length) throw Error('TRUSTED_PATH_POLICY_REQUIRED');
if (!process.env.GITHUB_TOKEN || !process.env.DATABASE_URL || process.env.GITHUB_REF_NAME !== 'main') throw Error('TRUSTED_ACTION_CONTEXT_REQUIRED');
if (!/^github-actions:\d+:\d+$/.test(process.env.WRITER_HOLDER||'')) throw Error('WRITER_PRINCIPAL_INVALID');
if (!Number.isSafeInteger(manifest.prNumber) || !manifest.obligation) throw Error('INVALID_APPROVED_HANDOFF');
if(manifest.contract==='brain-writer-patch-handoff-v2'){
 const manifestBytes=readFileSync(new URL('../../config/brain-writer-approved-handoff.json',import.meta.url),'utf8');
 const policyBytes=readFileSync(new URL('../../config/brain-writer-approved-paths.json',import.meta.url),'utf8');
 const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const preflight=await preflightReviewedWriterHandoff({
   owner:'arthurprinsen-ai',repo:'Bedrijfsgeheugen',githubToken:process.env.GITHUB_TOKEN,
   manifest,manifestBytes,policy,policyBytes,invocationSha:process.env.GITHUB_SHA,checkoutSha
 });
 console.log(JSON.stringify({status:'REVIEWED_EPOCH_PREFLIGHT_VERIFIED',executionMainSha:preflight.executionMainSha,manifestSha256:preflight.manifestSha256,writeAuthorized:false}));
 throw Error('REVIEWED_V2_EXACT_CAS_CONSUMER_NOT_AUTHORIZED');
}
const result=await runAuthorizedWriterHandoff({
 owner:'arthurprinsen-ai',repo:'Bedrijfsgeheugen',githubToken:process.env.GITHUB_TOKEN,
 authorizedPgQuery,manifest,approvedPaths:policy.paths,
 holder:process.env.WRITER_HOLDER,expectedHead:manifest.expectedHead,
 expectedBase:manifest.expectedBase,expectedBranch:manifest.branch,
});
console.log(JSON.stringify({status:result.status,newHead:result.newHead,releaseGate:result.releaseGate}));
