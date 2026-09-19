import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('all merged obligations close only after canonical production readback', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/github\.event\.pull_request\.merged == true/);
  assert.doesNotMatch(workflow,/startsWith\(github\.event\.pull_request\.head\.ref, 'writer\/'\)/);
  assert.match(workflow,/production-release-readback\.yml\/runs/);
  assert.match(workflow,/PRODUCTION_READBACK_PROVEN/);
  assert.match(workflow,/git merge-base --is-ancestor/);
});

test('learning changes require skill projection before LIVE_BEWEZEN', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/powerhouse-skill-projection\.yml\/runs/);
  assert.match(workflow,/SKILL_PROJECTION_PROVEN/);
  assert.match(workflow,/Terminal-State: LIVE_BEWEZEN/);
  assert.match(workflow,/Writer-Lease-State: RELEASED/);
  assert.match(workflow,/obligation-terminal-evidence\.json/);
});

test('terminal closure reuses canonical readback instead of creating a second deploy mechanism', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.doesNotMatch(workflow,/netlify deploy|deploy --prod/);
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(workflow,/release\.json\?bg_terminal_recovery=/);
  assert.match(workflow,/actions\/workflows\/production-release-readback\.yml\/runs/);
});


test('closed unmerged superseded PR without Supabase migrations may be traversed safely', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/SUPERSEDES_PR_NOT_TERMINAL/);
  assert.match(workflow,/UNMERGED_SUPERSEDES_SAFE_TO_SKIP/);
  assert.match(workflow,/pulls\/\$\{prNumber\}\/files\?per_page=100/);
});

test('closed unmerged superseded PR with Supabase migrations remains fail closed', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS/);
  assert.match(workflow,/\^supabase\\\/migrations\\\/\[\^\/\]\+\\\.sql\$/);
});


test('automation-only closure uses GitHub main readback instead of waiting for website production', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/delivery_lane=/);
  assert.match(workflow,/AUTOMATION_MAIN_READBACK_PROVEN/);
  assert.match(workflow,/mode=github_main/);
  assert.match(workflow,/portal-v2\/\|public\/\|src\/\|netlify\/functions\/\|supabase\/functions\/\|supabase\/migrations\//);
  assert.match(workflow,/main:\$\{process\.env\.PRODUCTION_OBSERVED_SHA\}/);
});
