import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('active backfill workflow reads existing authorities and only resumes canonical obligations', async () => {
  const yaml = await readFile('.github/workflows/completion-supervisor-backfill-shadow.yml', 'utf8');
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /push:\s*[\s\S]*branches:\s*[\s\S]*- main/);
  assert.match(yaml, /paths:\s*[\s\S]*completion-supervisor-backfill-shadow\.yml/);
  assert.match(yaml, /paths:\s*[\s\S]*outcome-obligation-completion-supervisor-backfill\.mjs/);
  assert.match(yaml, /- 'tests\/brain-completion-supervisor-backfill\.test\.mjs'/);
  assert.match(yaml, /- 'tests\/brain-completion-supervisor-backfill-workflow\.test\.mjs'/);
  assert.match(yaml, /- 'tests\/brain-outcome-obligation-supabase-store\.test\.mjs'/);
  assert.match(yaml, /- 'tests\/brain-outcome-obligation-runtime\.test\.mjs'/);
  assert.match(yaml, /actions:\s*read/);
  assert.match(yaml, /pull-requests:\s*read/);
  assert.match(yaml, /contents:\s*read/);
  assert.match(yaml, /outcome-obligation-completion-supervisor-backfill\.mjs --collect --mode active/);
  assert.match(yaml, /SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{\s*secrets\.SUPABASE_SERVICE_ROLE_KEY\s*\}\}/);
  assert.match(yaml, /durableResumeEnabled/);
  assert.match(yaml, /upload-artifact/);
  assert.match(yaml, /\.artifacts\/completion-supervisor-backfill-report\.json/);
  assert.match(yaml, /\.artifacts\/completion-supervisor-resume-\*\.json/);
  assert.match(yaml, /include-hidden-files:\s*true/);
  assert.doesNotMatch(yaml, /repository_dispatch/);
  assert.doesNotMatch(yaml, /workflow_dispatches|pulls\/.*merge|deploy/i);
});
