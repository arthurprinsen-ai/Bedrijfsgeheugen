import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url),'utf8');

test('repository janitor runs hourly and paginates the complete open PR set',()=>{
  assert.match(source,/cron: '17 \* \* \* \*'/);
  assert.match(source,/gh api --paginate --slurp "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\?state=open&per_page=100" \| jq 'add'/);
});

test('stale no-open-PR cleanup only adds TTL auto-cancel for queued runs',()=>{
  assert.match(source,/\[ "\$run_status" = queued \]/);
  assert.match(source,/stale_after_seconds=21600/);
  assert.match(source,/reason=STALE_QUEUED_NO_OPEN_PR/);
  assert.doesNotMatch(source,/\[ "\$run_status" = in_progress \].*STALE_QUEUED_NO_OPEN_PR/s);
});

test('janitor preserves main and current open-PR head before any cancellation',()=>{
  assert.match(source,/\[ "\$branch" != main \] \|\| continue/);
  assert.match(source,/if \[ -n "\$current_pr_head" \] && \[ "\$current_pr_head" != "\$run_sha" \]/);
  assert.match(source,/elif \[ -z "\$current_pr_head" \]/);
});
