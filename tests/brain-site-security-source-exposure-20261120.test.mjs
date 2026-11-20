import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Production deny rules must be FIRST, forced, and return 404 even if the source file exists.
const rules=readFileSync('_redirects','utf8').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#'));
const netlify=readFileSync('netlify.toml','utf8');
const protectedPaths=[
 '/supabase/migrations/20261014124402_scoped_external_reconcile_auth_retry_20261014.sql',
 '/scripts/security-operations-proof.mjs',
 '/tools/ci/netlify-build-entry.mjs',
 '/tests/security-operations-proof.test.mjs',
 '/config/brain-delivery-system.json',
 '/brain/learning/example.json',
 '/automation/private-state.json',
 '/contracts/internal-contract.json',
 '/powerhouse/private-operations.json',
 '/platform/api/cost-dashboard-handler.mjs',
 '/docs/internal-notes.md',
 '/netlify/functions/secret-handler.js',
 '/.github/workflows/codeql.yml',
 '/.agents/settings.md',
 '/node_modules/example/index.js',
 '/make/legacy-workflow.json',
 '/email/internal-template.html',
 '/netlify.toml','/.gitignore','/.git/config','/.vscode/settings.json','/.devcontainer/devcontainer.json','/.editorconfig','/.bg-prebuilt-manifest.json','/.bg-prebuilt-deploy.json',
 '/package.json', '/package-lock.json', '/npm-shrinkwrap.json',
 '/pnpm-lock.yaml','/yarn.lock','/tsconfig.json','/AGENTS.md','/README.md'
];
const expectedPublic=['/','/data/source-summary.json','/assets/kop.css','/assets/js/portaalslot.js','/portal-v2/','/portaal/demo','/blog/','/downloads/brochure.pdf','/.netlify/functions/public-api'];
function matches(pattern,path){if(pattern.endsWith('/*'))return path.startsWith(pattern.slice(0,-1));return path===pattern;}
function firstMatch(path){return rules.find(line=>matches(line.split(/\s+/)[0],path));}

test('security P0: all known internal source URLs get a forced 404 before application rewrites',()=>{
 assert.match(netlify,/publish\s*=\s*"\."/,'must review all deny rules until publish path is isolated');
 assert.ok(rules[0].startsWith('/supabase/*'),'deny rules must precede public routes');
 for(const path of protectedPaths){
  const rule=firstMatch(path);
  assert.ok(rule,'unprotected internal path: '+path);
  assert.match(rule,/\s\/404\.html\s+404!\s*$/,'must override existing static files: '+path);
 }
});
test('security P0: legitimate customer and static asset URLs remain available to their original routing',()=>{
 for(const path of expectedPublic){
  const rule=firstMatch(path);
  assert.ok(!rule||!rule.includes('404!'), 'blocked public application route: '+path);
 }
});
test('security P0: no catch-all block and no unsafe redirect response that leaks file contents',()=>{
 assert.ok(!rules.some(line=>/^\/\*\s+\/404\.html\s+404!$/.test(line)));
 assert.ok(rules.every(line=>!line.includes(' 403 ')));
 assert.ok(!rules.some(line=>line.includes('https://attacker')));
});
