import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {immutableNetlifyPreviewUrl} from '../tools/ci/netlify-immutable-preview-target.mjs';

const workflow=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const visual=readFileSync(new URL('../tests/integration/portal-v2-production-visual-regression.spec.js',import.meta.url),'utf8');
const id='6ac8ac472a4300000894a572';

test('missing approved preview artifact never waives a production visual comparison',()=>{
 assert.match(workflow,/if \[ -n "\$run_id" \]; then/);
 assert.match(workflow,/gh run download "\$run_id" -n "visual-baseline-pr-/);
 assert.match(workflow,/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/else\n\s*# Some workflow_run payloads omit pull_requests\[\]/);
 assert.match(workflow,/PRODUCTION_URL="\$preview_url" VISUAL_CAPTURE_PATH=artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(workflow,/Visual regression against approved PR baseline/);
 assert.match(workflow,/VISUAL_BASELINE: artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
 assert.match(visual,/maxDiffPixelRatio:0\.001,threshold:0\.2/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});

test('baseline source is pinned to merged PR HEAD, approved Netlify status and immutable release identity',()=>{
 assert.match(workflow,/commits\/\$\{GITHUB_SHA\}\/pulls/);
 assert.match(workflow,/select\(\.merged_at != null\)/);
 assert.match(workflow,/netlify\/bedrijfsgeheugen\/deploy-preview" and \.state == "success"/);
 assert.match(workflow,/netlify-immutable-preview-target\.mjs "\$target"/);
 assert.match(workflow,/if \[ "\$verified_sha" != "\$pr_head_sha" \] \|\| \[ -z "\$expected_id" \] \|\| \[ "\$verified_id" != "\$expected_id" \]/);
 assert.match(workflow,/Immutable preview SHA\/deploy identity mismatch/);
});

test('immutable baseline preview URL resolver rejects status URL injection',()=>{
 const trusted='https://app.netlify.com/projects/bedrijfsgeheugen/deploys/'+id;
 assert.equal(immutableNetlifyPreviewUrl(trusted),'https://'+id+'--bedrijfsgeheugen.netlify.app');
 for(const attacker of [
  'https://evil.example.net/projects/bedrijfsgeheugen/deploys/'+id,
  trusted+'?cmd=override',trusted+'#src',
  'https://app.netlify.com/projects/different/deploys/'+id,
  'https://'+id+'--evil-site.netlify.app'
 ])assert.throws(()=>immutableNetlifyPreviewUrl(attacker));
});


test('SSO-blocked preview alias never masks a visual diff and replays exact protected source',()=>{
  assert.match(workflow,/alias_release="\$\(curl --fail[\s\S]*?\|\| true\)"/);
  assert.match(workflow,/if \[ -n "\$alias_release" \]; then/);
  assert.match(workflow,/Unpinned Netlify PR alias does not match the exact protected head/);
  assert.match(workflow,/preview_url=""/);
  assert.match(workflow,/if \[ -n "\$preview_url" \]; then/);
  assert.match(workflow,/Netlify has no immutable exact-head preview/);
  assert.match(workflow,/if \[ "\$verified_head" != "\$pr_head_sha" \]/);
  assert.match(workflow,/git worktree add --detach "\$source_dir" "\$pr_head_sha"/);
  assert.match(workflow,/Visual regression against approved PR baseline/);
  assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
