import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const readText=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('scoped historical published SHA only accepted on explicit main dispatch with immutable commit ancestry',()=>{
 assert.match(workflow,/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*production_sha:/);
 assert.match(workflow,/PORTAL_EXPECTED_SHA=\$\{PRODUCTION_SHA_OVERRIDE:-\$GITHUB_SHA\}/);
 assert.match(workflow,/if \[ "\$EVENT_NAME" != "workflow_dispatch" \] \|\| \[ "\$GITHUB_REF" != "refs\/heads\/main" \]/);
 assert.match(workflow,/\[\[ "\$PORTAL_EXPECTED_SHA" =~ \^\[a-f0-9\]\{40\}\$ \]\]/);
 assert.match(workflow,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(workflow,/git diff --name-only "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(workflow,/\.github\/workflows\/\*\|tests\/\*\|docs\/\*\|brain\/learning\/\*\|tools\/ci\/\*/);
 assert.match(workflow,/Runtime source changed after selected published SHA: \$file\. Require a new exact-main deploy/);
 assert.match(workflow,/PRODUCTION_SCOPED_DEPLOY_PROOF target=\$PORTAL_EXPECTED_SHA main=\$GITHUB_SHA/);
});

test('any selected published SHA is still independently verified on main site and immutable Netlify readback',()=>{
 assert.match(workflow,/PORTAL_ALIAS_URL=https:\/\/www\.bedrijfsgeheugen\.nl/);
 assert.match(workflow,/deployed_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/immutable_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/NETLIFY_DEPLOY_ID=\$\{deploy_id\}/);
 assert.match(workflow,/PORTAL_READBACK_URL=\$\{immutable\}/);
 assert.match(workflow,/Read back Portal V2 DOM, standalone routing and CSRD assets/);
 assert.match(workflow,/Read back hydrated mobile demoAI shell/);
});

test('manual production readback selects actual published merged PR and never silently omits its required visual baseline',()=>{
 assert.match(workflow,/if \[ "\$EVENT_NAME" = "push" \] \|\| \[ "\$EVENT_NAME" = "workflow_dispatch" \]/);
 const refs=[...workflow.matchAll(/commits\/\$\{PORTAL_EXPECTED_SHA\}\/pulls/g)];
 assert.equal(refs.length,2,'classify and baseline source must both resolve the actual published production merge');
 const gates=[...workflow.matchAll(/if: \(github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'\) && env\.VISUAL_BASELINE_REQUIRED == 'true'/g)];
 assert.equal(gates.length,2,'both baseline preparation and production comparison must run on dispatch');
 assert.match(workflow,/name: portal-v2-production-dom-readback-\$\{\{ env\.PORTAL_EXPECTED_SHA \}\}/);
 assert.match(workflow,/PRODUCTION_URL: \$\{\{ env\.PORTAL_READBACK_URL \}\}/);
 const visual=readText('tests/integration/portal-v2-production-visual-regression.spec.js');
 assert.match(visual,/maxDiffPixelRatio:0\.001,threshold:0\.2/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
