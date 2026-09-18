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

test('terminal closure reuses canonical readback and descendant GET proof without creating a second deploy mechanism', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.doesNotMatch(workflow,/netlify deploy|deploy --prod|curl\s+(?:[^\n]*\s)?(?:-X|--request)\s*(?:POST|PUT|PATCH|DELETE)/i);
  assert.match(workflow,/actions\/workflows\/production-release-readback\.yml\/runs/);
  assert.match(workflow,/git merge-base --is-ancestor/);
  assert.match(workflow,/curl[^\n]*release\.json/);
});
