import { execFileSync } from 'node:child_process';

function run(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'inherit']
  }).trim();
}

export function dispatchWriterShadow({ branch, repo = process.env.GITHUB_REPOSITORY } = {}) {
  const candidateBranch = String(branch || '').trim();
  if (!repo) throw new Error('GITHUB_REPOSITORY_REQUIRED');
  if (!/^writer\/[a-z0-9-]+\/[a-f0-9A-Z_-]+$/i.test(candidateBranch)) {
    throw new Error(`INVALID_WRITER_BRANCH:${candidateBranch}`);
  }
  const number = run(['pr','list','--repo',repo,'--head',candidateBranch,'--base','main','--state','open','--json','number','--jq','.[0].number // empty']);
  if (!number) throw new Error(`WRITER_PR_NOT_FOUND:${candidateBranch}`);
  const baseSha = run(['api',`repos/${repo}/pulls/${number}`,'--jq','.base.sha']);
  const headSha = run(['api',`repos/${repo}/pulls/${number}`,'--jq','.head.sha']);
  const headRef = run(['api',`repos/${repo}/pulls/${number}`,'--jq','.head.ref']);
  if (headRef !== candidateBranch) throw new Error(`WRITER_PR_HEAD_REF_DRIFT:${candidateBranch}:${headRef}`);
  run([
    'workflow','run','repo-writer-candidate-shadow.yml',
    '--repo',repo,
    '--ref','main',
    '-f',`pr_number=${number}`,
    '-f',`base_sha=${baseSha}`,
    '-f',`head_sha=${headSha}`,
    '-f',`candidate_branch=${candidateBranch}`
  ]);
  return Object.freeze({ prNumber:Number(number), baseSha, headSha, candidateBranch });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = dispatchWriterShadow({ branch:process.argv[2] });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
