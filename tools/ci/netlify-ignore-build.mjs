import { execFileSync } from 'node:child_process';

const cached = String(process.env.CACHED_COMMIT_REF || '').trim();
const commit = String(process.env.COMMIT_REF || '').trim();

const governancePrefixes = [
  'docs/',
  '.agents/',
  'tests/',
  '.github/',
  'brain/learning/',
  'brain/policies/',
  'tools/delivery/',
];

const governanceExact = new Set([
  'AGENTS.md',
  'config/delivery-prevention-rules.json',
  'config/powerhouse-agent-delivery-scheduler-v1.json',
  'platform/system-map/canonical-system-map.mjs',
  'tools/brain-delivery-system.mjs',
  'site/website-release-risk.json',
  'tools/site-shell/verify-targeted-website-routes.mjs',
  'tools/site-shell/contracts.mjs',
  'tools/site-shell/test-shell-components.mjs',
  'tools/site-shell/live-contract.mjs',
  'tools/site-shell/test-live-contract.mjs',
  'tools/site-shell/production-supersession.mjs',
  'tools/site-shell/standalone-visibility-check.mjs',
  'brain/contracts/production-readback-v1.json',
]);

function failOpen(reason) {
  console.log(`NETLIFY_BUILD_REQUIRED: ${reason}`);
  process.exit(1);
}

if (!cached || !commit || cached === commit) {
  failOpen('missing, invalid or identical Netlify commit refs');
}

let changed;
try {
  changed = execFileSync('git', ['diff', '--name-only', cached, commit], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);
} catch (error) {
  failOpen(`git diff failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (changed.length === 0) {
  console.log('NETLIFY_BUILD_SKIPPED: no changed paths');
  process.exit(0);
}

const runtimePaths = changed.filter(path =>
  !governanceExact.has(path) &&
  !governancePrefixes.some(prefix => path.startsWith(prefix))
);

if (runtimePaths.length > 0) {
  console.log(`NETLIFY_BUILD_REQUIRED: runtime paths: ${runtimePaths.join(', ')}`);
  process.exit(1);
}

console.log(`NETLIFY_BUILD_SKIPPED: governance-only paths: ${changed.join(', ')}`);
process.exit(0);
