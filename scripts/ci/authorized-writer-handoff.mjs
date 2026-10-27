import { readFileSync } from 'node:fs';
import { runAuthorizedWriterHandoff } from '../../tools/delivery/writer-authorized-runner.mjs';
import { authorizedPgQuery } from './authorized-writer-pg.mjs';
const manifest = JSON.parse(readFileSync('config/brain-writer-approved-handoff.json','utf8'));
const policy = JSON.parse(readFileSync('config/brain-writer-approved-paths.json','utf8'));
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
