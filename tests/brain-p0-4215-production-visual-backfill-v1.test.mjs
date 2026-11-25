import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const visual=readFileSync(new URL('../tests/integration/portal-v2-production-visual-regression.spec.js',import.meta.url),'utf8');
const resolver=readFileSync(new URL('../tools/ci/netlify-immutable-preview-target.mjs',import.meta.url),'utf8');

test('manual Portal DOM backfill requires an explicit protected-merged source PR in current-main ancestry',()=>{
 assert.match(workflow,/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*approved_pr_number:/);
 assert.match(workflow,/required: true/);
 assert.match(workflow,/\[\[ ! "\$APPROVED_PR_NUMBER" =~ \^\[1-9\]\[0-9\]\*\$ \]\]/);
 assert.match(workflow,/merged_at.*empty/);
 assert.match(workflow,/merge_commit_sha.*empty/);
 assert.match(workflow,/compare\/\$\{merge_sha\}\.\.\.\$\{PORTAL_EXPECTED_SHA\}/);
 assert.match(workflow,/\$relation" != "identical"/);
 assert.match(workflow,/\$relation" != "ahead"/);
 assert.match(workflow,/APPROVED_VISUAL_PR=/);
});

test('visual replay must validate numbered PR alias, exact SHA and immutable deploy ID before screenshot',()=>{
 assert.match(workflow,/deploy-preview-\$\{pr_number\}--bedrijfsgeheugen\.netlify\.app/);
 assert.match(workflow,/alias_release=.*release\.json/);
 assert.match(workflow,/\$alias_sha" != "\$pr_head_sha"/);
 assert.match(workflow,/alias_id.*\^\[a-f0-9\]\{24\}/);
 assert.match(workflow,/preview_url="https:\/\/\$\{alias_id\}--bedrijfsgeheugen\.netlify\.app"/);
 assert.match(workflow,/netlify-immutable-preview-target\.mjs/);
 assert.match(resolver,/NETLIFY_PREVIEW_TARGET_UNTRUSTED/);
 assert.match(workflow,/\$verified_sha" != "\$pr_head_sha"/);
 assert.match(workflow,/\$verified_id" != "\$expected_id"/);
 assert.match(workflow,/VISUAL_CAPTURE_PATH=artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
});

test('replay never relaxes actual immutable production comparison or published SHA proof',()=>{
 const mandatory="(github.event_name == 'push' || github.event_name == 'workflow_dispatch') && env.VISUAL_BASELINE_REQUIRED == 'true'";
 assert.equal(workflow.split(mandatory).length-1,2,'visual baseline AND visual comparison steps must run on dispatch');
 assert.match(workflow,/PORTAL_EXPECTED_SHA=\$\{PRODUCTION_SHA_OVERRIDE:-\$GITHUB_SHA\}/);
 assert.match(workflow,/\$immutable_sha" = "\$PORTAL_EXPECTED_SHA"/);
 assert.match(workflow,/VISUAL_BASELINE: artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/run: npx playwright test tests\/integration\/portal-v2-production-visual-regression\.spec\.js --workers=1/);
 assert.match(visual,/maxDiffPixelRatio:0\.001,threshold:0\.2/);
});
