import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const visual=readFileSync(new URL('../tests/integration/portal-v2-production-visual-regression.spec.js',import.meta.url),'utf8');

test('manual source PR and published SHA are separate explicit inputs and never grant access outside main',()=>{
 assert.match(workflow,/approved_pr_number:[\s\S]*?required: true[\s\S]*?production_sha:/);
 assert.match(workflow,/fetch-depth: 0/);
 assert.match(workflow,/PRODUCTION_SHA_OVERRIDE: \$\{\{ inputs\.production_sha \|\| '' \}\}/);
 assert.match(workflow,/PORTAL_EXPECTED_SHA=\$\{PRODUCTION_SHA_OVERRIDE:-\$GITHUB_SHA\}/);
 assert.match(workflow,/if \[ "\$EVENT_NAME" != "workflow_dispatch" \] \|\| \[ "\$GITHUB_REF" != "refs\/heads\/main" \]/);
 assert.match(workflow,/\[\[ "\$PORTAL_EXPECTED_SHA" =~ \^\[a-f0-9\]\{40\}\$ \]\]/);
 assert.match(workflow,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(workflow,/git diff --name-only "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(workflow,/\.github\/workflows\/\*\|tests\/\*\|docs\/\*\|brain\/learning\/\*\|tools\/ci\/\*/);
 assert.match(workflow,/Runtime source changed after selected production SHA: \$file/);
});

test('selected approved PR must have been merged into actual provider-published commit',()=>{
 assert.match(workflow,/merged_at.*empty/);
 assert.match(workflow,/merge_commit_sha.*empty/);
 assert.match(workflow,/compare\/\$\{merge_sha\}\.\.\.\$\{PORTAL_EXPECTED_SHA\}/);
 assert.match(workflow,/Source PR merge is not in the verified published production ancestry/);
 assert.match(workflow,/APPROVED_VISUAL_PR=/);
 assert.match(workflow,/deployed_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/immutable_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/NETLIFY_DEPLOY_ID=\$\{deploy_id\}/);
 assert.match(workflow,/PORTAL_READBACK_URL=\$\{immutable\}/);
});

test('manual published-SHA backfill must run exact PR visual proof and real production comparison',()=>{
 assert.match(workflow,/deploy-preview-\$\{pr_number\}--bedrijfsgeheugen\.netlify\.app/);
 const eventGate="(github.event_name == 'push' || github.event_name == 'workflow_dispatch') && env.VISUAL_BASELINE_REQUIRED == 'true'";
 assert.equal(workflow.split(eventGate).length-1,2);
 assert.match(workflow,/VISUAL_CAPTURE_PATH=artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/VISUAL_BASELINE: artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/name: portal-v2-production-dom-readback-\$\{\{ env\.PORTAL_EXPECTED_SHA \}\}/);
 assert.match(visual,/maxDiffPixelRatio:0\.001,threshold:0\.2/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
