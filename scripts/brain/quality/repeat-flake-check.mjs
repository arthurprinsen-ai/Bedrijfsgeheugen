import { spawnSync } from 'node:child_process';

const count = Math.max(2, Number(process.env.QUALITY_FLAKE_REPEATS || 3));
const target = process.env.QUALITY_FLAKE_TARGET || 'tests/brain-quality-intelligence.test.mjs';
const outcomes = [];
for (let index = 0; index < count; index += 1) {
  const run = spawnSync(process.execPath, ['--test', target], { encoding: 'utf8', env: process.env });
  outcomes.push({ index: index + 1, status: run.status ?? 1, signal: run.signal, stdout_tail: (run.stdout || '').slice(-2000), stderr_tail: (run.stderr || '').slice(-2000) });
}
const statuses = [...new Set(outcomes.map(x => x.status))];
const report = { fingerprint: 'powerhouse-flake-intelligence-v1', target, repeats: count, deterministic: statuses.length === 1, status: statuses.length === 1 && statuses[0] === 0 ? 'green' : statuses.length > 1 ? 'flaky' : 'red', outcomes };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'green') process.exitCode = 1;
