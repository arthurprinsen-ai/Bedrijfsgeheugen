import { execFileSync, spawnSync } from 'node:child_process';

const base = process.env.BASE_SHA || 'HEAD^';
const head = process.env.HEAD_SHA || 'HEAD';
const changed = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

function touches(...rules) {
  return changed.some(path => rules.some(rule => rule.endsWith('/') ? path.startsWith(rule) : path === rule || path.startsWith(rule)));
}

function run(id, command, args) {
  process.stdout.write(`${JSON.stringify({ event: 'consolidated-pr-contract', id, head })}\n`);
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`CONSOLIDATED_PR_CONTRACT_FAILED:${id}:exit=${result.status}`);
}

if (touches('config/', 'components/_schema/', 'pages/', 'preview/', 'tools/compose-site.mjs', 'tools/compose-component-preview.mjs', 'tools/verify-component-boundaries.mjs', 'tools/verify-change-scope.mjs', 'tools/verify-component-hashes.mjs', 'tools/detect-changed-components.mjs', 'tests/parallel-ownership.test.mjs', 'tests/change-classes.test.mjs', 'tests/page-composition.test.mjs', 'tests/component-preview-composition.test.mjs', 'tests/component-boundaries.test.mjs', 'tests/change-scope.test.mjs', 'tests/component-hash-protection.test.mjs', 'tests/detect-changed-components.test.mjs', 'tests/component-preview-workflow-contract.test.mjs', '.github/workflows/component-preview.yml', '.github/workflows/component-foundation-tdd.yml')) {
  run('component-foundation', 'node', ['--test',
    'tests/parallel-ownership.test.mjs',
    'tests/change-classes.test.mjs',
    'tests/page-composition.test.mjs',
    'tests/component-preview-composition.test.mjs',
    'tests/component-boundaries.test.mjs',
    'tests/change-scope.test.mjs',
    'tests/component-hash-protection.test.mjs',
    'tests/detect-changed-components.test.mjs',
    'tests/component-preview-workflow-contract.test.mjs',
  ]);
}

process.stdout.write(`${JSON.stringify({ ok: true, version: 'consolidated-pr-contracts-v1', changedCount: changed.length })}\n`);
