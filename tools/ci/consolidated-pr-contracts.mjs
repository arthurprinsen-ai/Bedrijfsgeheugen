import { execFileSync, spawnSync } from 'node:child_process';

const base = process.env.BASE_SHA || 'HEAD^';
const head = process.env.HEAD_SHA || 'HEAD';
const changed = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

function touches(...rules) {
  return changed.some(path => rules.some(rule => rule.endsWith('/') ? path.startsWith(rule) : path === rule || path.startsWith(rule)));
}

function run(id, command, args, extraEnv = {}) {
  process.stdout.write(`${JSON.stringify({ event: 'consolidated-pr-contract', id, head })}\n`);
  const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`CONSOLIDATED_PR_CONTRACT_FAILED:${id}:exit=${result.status}`);
}

run('shared-agent-memory', 'bash', ['-lc', 'node --test tests/development-doc-contract.test.mjs tests/delivery-chat-*.test.mjs tests/team-learning-event.test.mjs tests/team-memory-fingerprint.test.mjs tests/opportunity-scout.test.mjs tests/production-promotion-controller.test.mjs tests/production-promotion-guardian.test.mjs tests/hero-media-normalizer.test.mjs tests/hero-media-executor.test.mjs tests/paginacontrole-concurrent-push.test.mjs tests/paginacontrole-concurrency.test.mjs tests/repo-writeback-safety.test.mjs tests/repo-writer-governance.test.mjs tests/repo-writer-candidate.test.mjs tests/menu-writer-candidate-mode.test.mjs tests/regulation-writer-candidate-mode.test.mjs tests/seo-writer-candidate-mode.test.mjs tests/approved-central-blog-candidate-mode.test.mjs tests/blog-update-writer-candidate-mode.test.mjs tests/weekblog-writer-candidate-mode.test.mjs tests/paginacontrole-writer-candidate-mode.test.mjs tests/repository-protection-readiness.test.mjs tests/repository-writer-structural-parity.test.mjs tests/repo-writer-shadow.test.mjs tests/repo-writer-operational-harness.test.mjs tests/content-writer-operational-fixture.test.mjs tests/whole-brain-obligation-contract.test.mjs tests/agent-fabric.test.mjs tests/agent-fabric-gateway.test.mjs tests/agent-fabric-team-memory.test.mjs tests/brain-chat-learning-complete.test.mjs tests/instagram-chat-learning-contract.test.mjs tests/chat-learning-completeness-addendum.test.mjs tests/brain-chat-learning-canonical-closure.test.mjs tests/brain-chat-learning-completeness.test.mjs tests/*guard*.test.mjs tests/delivery-preflight-completion.test.mjs tests/live-preview-trigger-scope.test.mjs']);
run('brain-cost-membership', 'node', ['--test', 'tests/brain-cost-membership.test.mjs', 'tests/cost-component-catalog.test.mjs']);

if (touches('config/', 'components/_schema/', 'pages/', 'preview/', 'tools/compose-site.mjs', 'tools/compose-component-preview.mjs', 'tools/verify-component-boundaries.mjs', 'tools/verify-change-scope.mjs', 'tools/verify-component-hashes.mjs', 'tools/detect-changed-components.mjs', 'tests/parallel-ownership.test.mjs', 'tests/change-classes.test.mjs', 'tests/page-composition.test.mjs', 'tests/component-preview-composition.test.mjs', 'tests/component-boundaries.test.mjs', 'tests/change-scope.test.mjs', 'tests/component-hash-protection.test.mjs', 'tests/detect-changed-components.test.mjs', 'tests/component-preview-workflow-contract.test.mjs', '.github/workflows/component-preview.yml', '.github/workflows/component-foundation-tdd.yml')) {
  run('component-foundation', 'node', ['--test', 'tests/parallel-ownership.test.mjs', 'tests/change-classes.test.mjs', 'tests/page-composition.test.mjs', 'tests/component-preview-composition.test.mjs', 'tests/component-boundaries.test.mjs', 'tests/change-scope.test.mjs', 'tests/component-hash-protection.test.mjs', 'tests/detect-changed-components.test.mjs', 'tests/component-preview-workflow-contract.test.mjs']);
}

if (touches('.github/workflows/canonical-brand-shell-test.yml', '.github/workflows/canonical-brand-shell-full-build.yml', '.github/workflows/canonical-brand-shell-live-readback.yml', 'tools/site-shell/', 'tools/bouw-v18-', 'tools/bouw-powerhouse-auth.mjs', 'tools/bouw-kennisindex.mjs', 'tools/apply-tabbladen.mjs', 'tools/prijzen-uit-de-homepage.mjs')) {
  run('canonical-shell-contract', 'node', ['tools/site-shell/test-shell-components.mjs']);
  run('canonical-live-contract', 'node', ['tools/site-shell/test-live-contract.mjs']);
  run('canonical-live-seo-order', 'node', ['--test', 'tests/seo-order-live-readback.test.mjs']);
  run('canonical-build-dependencies', 'npm', ['install']);
  run('canonical-build-auth', 'node', ['tools/bouw-powerhouse-auth.mjs']);
  run('canonical-build-knowledge', 'node', ['tools/bouw-kennisindex.mjs']);
  run('canonical-build-v18', 'node', ['tools/bouw-v18-production.mjs']);
  run('canonical-build-tabs', 'node', ['tools/apply-tabbladen.mjs']);
  run('canonical-build-views', 'node', ['tools/bouw-v18-views.mjs']);
  run('canonical-build-chrome', 'node', ['tools/bouw-v18-chrome-alles.mjs']);
  run('canonical-pricing-rewrite', 'node', ['tools/prijzen-uit-de-homepage.mjs'], { BG_PRICING_STAGE: 'rewrite' });
  run('canonical-pricing-normalize', 'node', ['tools/prijzen-uit-de-homepage.mjs'], { BG_PRICING_STAGE: 'normalize' });
  run('canonical-shell-gate', 'node', ['tools/site-shell/diagnose-shell-gate.mjs']);
  run('canonical-pricing-verify', 'node', ['tools/prijzen-uit-de-homepage.mjs'], { BG_PRICING_STAGE: 'verify' });
  run('canonical-release-evidence', 'node', ['tools/bouw-release-evidence.mjs'], { COMMIT_REF: head, CONTEXT: 'github-pull-request' });
}

if (touches('.github/workflows/v18-production-promotion.yml', 'v18-full/', 'tools/bouw-v18-', 'tests/v18-production-promotion.test.mjs', 'tests/v18-seo-layer.test.mjs', 'site/accepted-baseline.json')) {
  run('v18-production-contracts', 'node', ['--test', 'tests/v18-production-promotion.test.mjs', 'tests/v18-seo-layer.test.mjs', 'tests/site-baseline-guardian.test.mjs']);
}

process.stdout.write(`${JSON.stringify({ ok: true, version: 'consolidated-pr-contracts-v4', changedCount: changed.length })}\n`);
