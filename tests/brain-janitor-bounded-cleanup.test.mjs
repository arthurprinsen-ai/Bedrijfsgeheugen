import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
const start=src.indexOf('      - name: Reconcile stale Actions and merged branch debris');
const end=src.indexOf('      - name: Read back applied cleanup',start);
const step=src.slice(start,end);
test('full janitor job has a hard 15-minute deadline',()=>{
  assert.match(src,/\n  janitor:\n(?:    [^\n]*\n)*?    timeout-minutes: 15\n/);
});
test('cleanup scans only a bounded provider page per status and branch',()=>{
  assert.match(step,/actions_page="\$\(page_for_cycle 32\)"/);
  assert.match(step,/branches_page="\$\(page_for_cycle 70\)"/);
  assert.match(step,/per_page=30&page=\$\{actions_page\}/);
  assert.match(step,/per_page=50&page=\$\{branches_page\}/);
  assert.doesNotMatch(step,/gh api --paginate "repos\/\$\{GITHUB_REPOSITORY\}\/(actions\/runs|branches)\?/);
});
test('cleanup mutations preserve fresh-state safety checks',()=>{
  assert.match(step,/latest_status=.*gh api/);
  assert.match(step,/latest_sha=.*gh api/);
  assert.match(step,/\[ "\$latest_sha" = "\$head_sha" \]/);
  assert.match(step,/\[ "\$branch" != main \]/);
});
