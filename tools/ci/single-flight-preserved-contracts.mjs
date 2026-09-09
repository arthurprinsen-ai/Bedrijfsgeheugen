import { execFileSync, spawnSync } from 'node:child_process';

const base = process.env.BASE_SHA || 'HEAD^';
const head = process.env.HEAD_SHA || 'HEAD';
const selected = new Set((process.env.PRESERVED_CONTRACT_ONLY || '').split(',').map(value => value.trim()).filter(Boolean));
const changed = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);

function touched(...rules) {
  return changed.some(path => rules.some(rule => rule.endsWith('/') ? path.startsWith(rule) : path === rule || path.startsWith(rule)));
}

function run(id, command, args) {
  if (selected.size && !selected.has(id)) return;
  process.stdout.write(`${JSON.stringify({ event: 'preserved-release-contract', id, head: process.env.HEAD_SHA || head })}\n`);
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`PRESERVED_CONTRACT_FAILED:${id}:exit=${result.status}`);
}

// Preserved product regressions are source-scoped. Standalone workflow YAML changes
// are orchestration changes owned by the single-flight control-plane tests and must
// not masquerade as product changes or re-introduce runner fan-out indirectly.
if (touched('tests/brain-bg184-stateful-blocker-dedupe.test.mjs','config/bg184-stateful-blocker-dedupe.json'))
  run('bg184-stateful-dedupe','node',['--test','tests/brain-bg184-stateful-blocker-dedupe.test.mjs']);

if (touched('brain/','scripts/brain/','tests/brain/','docs/brain/'))
  run('brain-foundation','node',['scripts/brain/test-all.mjs']);

if (touched('platform/','portal-next/')) {
  run('business-os-contracts','bash',['-lc','node --test tests/portal-next-shell.test.mjs tests/intelligence-agent-runtime.test.mjs tests/policy-engine.test.mjs tests/trust-*.test.mjs tests/canonical-*.test.mjs tests/source-adapters.test.mjs tests/read-models.test.mjs tests/foundation-registry-eventstore.test.mjs tests/business-os-migration.test.mjs tests/paginacontrole-concurrency.test.mjs']);
  run('portal-parity','python3',['.github/scripts/portal_parity.py']);
}

if (touched('netlify.toml','_redirects','sitemap.xml','tools/config-wacht.py'))
  run('config-watch','python3',['tools/config-wacht.py']);

if (touched('scripts/brain/device-certify.mjs','tests/brain-fresh-device-canary.test.mjs'))
  run('fresh-device-contract','node',['--test','tests/brain-fresh-device-canary.test.mjs']);

if (touched('assets/openart-hero-iphone-safe-v1.mp4','assets/openart-hero-production.json'))
  run('hero-media-static','node',['--input-type=module','-e',`import fs from 'node:fs'; import crypto from 'node:crypto'; const p='assets/openart-hero-iphone-safe-v1.mp4'; const expected='a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd'; if(!fs.existsSync(p)) throw new Error('accepted hero binary missing'); const sha=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); if(sha!==expected) throw new Error('hero binary hash mismatch '+sha); const m=JSON.parse(fs.readFileSync('assets/openart-hero-production.json','utf8')); if(m.derivative_sha256!==expected||m.physical_iphone_runtime!=='PASS'||m.promotion_state!=='MEDIA_READY') throw new Error('hero manifest contract failed');`]);

if (touched('index.html','tests/homepage-hero-video.test.mjs'))
  run('homepage-hero-video','node',['tests/homepage-hero-video.test.mjs']);

if (touched('tools/main-write-integrity.mjs','tests/main-write-integrity-squash-pr.test.mjs'))
  run('main-write-integrity','node',['--test','tests/main-write-integrity-squash-pr.test.mjs']);

if (touched('portal/','tests/portal-native-legacy-batch-'))
  run('portal-native-regression','bash',['-lc','node --test tests/portal-native-legacy-batch-*.test.mjs']);

if (touched('portal-v2/','portal-next/portal-content-map.js'))
  run('portal-v2-contracts','npm',['--prefix','portal-v2','test']);

if (touched('tools/site-shell/','tests/prijzen-hero-seo.test.mjs','tests/technical-seo-gate.test.mjs'))
  run('pricing-hero-seo','node',['--test','tests/prijzen-hero-seo.test.mjs','tests/technical-seo-gate.test.mjs']);

if (touched('tools/seo-growth/','tools/seo-order-engine/','tests/seo-growth-','tests/seo-order-'))
  run('seo-order-growth','bash',['-lc','node --test tests/seo-order-*.test.mjs tests/seo-growth-*.test.mjs']);

if (touched('config/universal-closed-loop-learning.json','scripts/brain/validate-universal-closed-loop-learning.mjs','tests/brain-universal-closed-loop-learning.test.mjs')) {
  run('closed-loop-validator','node',['scripts/brain/validate-universal-closed-loop-learning.mjs']);
  run('closed-loop-regression','node',['--test','tests/brain-universal-closed-loop-learning.test.mjs']);
}

if (touched('tools/universal-event-','tools/universal-failure-','tools/event-retention-'))
  run('universal-event-retention','node',['--test','tests/universal-event-envelope.test.mjs','tests/universal-failure-learning.test.mjs','tests/event-retention-policy.test.mjs','tests/event-retention-expiry.test.mjs','tests/universal-event-contract-check.test.mjs','tests/universal-event-adapters.test.mjs']);

if (touched('tests/approved-blog-verifier-contract.test.mjs'))
  run('approved-blog-verifier','node',['--test','tests/approved-blog-verifier-contract.test.mjs']);

if (touched('blog/','robots.txt','sitemap.xml')) {
  run('blog-technical-seo','node',['--test','tests/technical-seo-gate.test.mjs']);
  run('blog-seo-readback','python3',['.github/scripts/seocontrole.py']);
}

// The Required workflow is the single-flight control plane itself, so its own
// completion contract intentionally remains workflow-aware.
if (touched('.github/workflows/required-test.yml','tests/brain-agents-delivery-contract.test.mjs','tools/brain-delivery-system.mjs','config/brain-delivery-system.json'))
  run('agent-completion-contract','node',['--test','tests/brain-agents-delivery-contract.test.mjs']);

process.stdout.write(`${JSON.stringify({ ok: true, version: 'single-flight-preserved-contracts-v5', changedCount: changed.length, selected: [...selected] })}\n`);