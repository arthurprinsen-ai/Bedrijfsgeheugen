import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync('.github/workflows/portal-v2-production-dom-readback.yml','utf8');
test('successful PR run without a non-expired exact screenshot artifact cannot short-circuit visual baseline capture',()=>{
 assert.match(workflow,/actions\/runs\/\$\{run_id\}\/artifacts\?per_page=100/);
 assert.match(workflow,/select\(\.name == \$expected and \.expired == false\)/);
 assert.match(workflow,/if \[ -z "\$artifact_id" \]; then[\s\S]*?run_id=""/);
 assert.match(workflow,/if \[ -n "\$run_id" \]; then\n            gh run download/);
});
test('the existing immutable approved-head fallback and independent pixel comparison stay mandatory',()=>{
 for(const clause of [
  'git fetch --no-tags origin "+refs/pull/${pr_number}/head:refs/remotes/approved-visual-pr/${pr_number}"',
  'if [ "$verified_head" != "$pr_head_sha" ]; then',
  'git worktree add --detach "$source_dir" "$pr_head_sha"',
  'VISUAL_CAPTURE_PATH="$GITHUB_WORKSPACE/artifacts/visual-baseline-pr/portal-v2-canvassen.png"',
  'test -s artifacts/visual-baseline-pr/portal-v2-canvassen.png',
  'Visual regression against approved PR baseline'
 ])assert.ok(workflow.includes(clause),clause);
 assert.match(workflow,/VISUAL_BASELINE: artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
});
