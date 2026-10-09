import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const netlify=readFileSync(new URL('../netlify.toml',import.meta.url),'utf8');

test('a skipped Netlify governance-only build must never be mistaken for a missing portal runtime deployment',()=>{
 assert.match(netlify,/ignore\s*=\s*"node \.\/tools\/ci\/netlify-ignore-build\.mjs"/);
 assert.match(workflow,/expected_production_sha:/);
 assert.match(workflow,/EXPECTED_PRODUCTION_SHA: \$\{\{ inputs\.expected_production_sha \}\}/);
 assert.match(workflow,/\[\[ ! "\$EXPECTED_PRODUCTION_SHA" =~ \^\[a-f0-9\]\{40\}\$ \]\]/);
 assert.match(workflow,/compare\/\$\{EXPECTED_PRODUCTION_SHA\}\.\.\.\$\{GITHUB_SHA\}/);
 assert.match(workflow,/\$relation" != "ahead"/);
 assert.match(workflow,/\$relation" != "identical"/);
 assert.match(workflow,/\$file_count" -ge 300/);
 assert.match(workflow,/RUNTIME_EQUIVALENT_SCOPE_PROVED=/);
});

test('any portal/runtime source change since deployed SHA is a hard error',()=>{
 assert.match(workflow,/startswith\("\.github\/workflows\/"\)/);
 assert.match(workflow,/startswith\("brain\/learning\/"\)/);
 assert.match(workflow,/startswith\("docs\/"\)/);
 assert.match(workflow,/startswith\("tests\/"\)/);
 assert.match(workflow,/select\(\(startswith/);
 assert.match(workflow,/\| not/);
 assert.match(workflow,/\-n "\$disallowed"/);
 assert.match(workflow,/cannot accept earlier deployment/);
 assert.doesNotMatch(workflow,/startsWith\("portal-v2\/"\)/);
 assert.doesNotMatch(workflow,/startswith\("netlify\/functions\/"\)/);
 assert.match(workflow,/PORTAL_EXPECTED_SHA=\$\{approved\}/);
});

test('actual production DOM remains pinned to immutable reported deployed SHA and unchanged visual proof',()=>{
 assert.match(workflow,/\$deployed_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/\$immutable_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/\$verified_sha" != "\$pr_head_sha"/);
 assert.match(workflow,/VISUAL_BASELINE: artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/npx playwright test tests\/integration\/portal-v2-production-visual-regression\.spec\.js --workers=1/);
});
