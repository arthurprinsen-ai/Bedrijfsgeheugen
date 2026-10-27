import manifest from '../../config/brain-writer-approved-handoff.json' with { type: 'json' };
import policy from '../../config/brain-writer-approved-paths.json' with { type: 'json' };
import { runAuthorizedWriterHandoff } from '../../tools/delivery/writer-authorized-runner.mjs';
import { authorizedPgQuery } from './authorized-writer-pg.mjs';
if (policy.contract !== 'brain-writer-approved-paths-v1' || !Array.isArray(policy.paths) || !policy.paths.length || new Set(policy.paths).size !== policy.paths.length) throw Error('TRUSTED_PATH_POLICY_REQUIRED');
if (!process.env.GITHUB_TOKEN || !process.env.DATABASE_URL || process.env.GITHUB_REF_NAME !== 'main') throw Error('TRUSTED_ACTION_CONTEXT_REQUIRED');
if (!/^github-actions:\d+:\d+$/.test(process.env.WRITER_HOLDER||'')) throw Error('WRITER_PRINCIPAL_INVALID');
if (!Number.isSafeInteger(manifest.prNumber) || !manifest.obligation) throw Error('INVALID_APPROVED_HANDOFF');
const result=await runAuthorizedWriterHandoff({
 owner:'arthurprinsen-ai',repo:'Bedrijfsgeheugen',githubToken:process.env.GITHUB_TOKEN,
 authorizedPgQuery,manifest,approvedPaths:policy.paths,
 holder:process.env.WRITER_HOLDER,expectedHead:manifest.expectedHead,
 expectedBase:manifest.expectedBase,expectedBranch:manifest.branch,
});
console.log(JSON.stringify({status:result.status,newHead:result.newHead,releaseGate:result.releaseGate}));
