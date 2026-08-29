import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const writerWorkflows = [
  '.github/workflows/paginacontrole.yml',
  '.github/workflows/approved-central-blog.yml',
  '.github/workflows/weekblog.yml',
  '.github/workflows/blog-bijwerken.yml',
];

const contents = Object.fromEntries(
  await Promise.all(writerWorkflows.map(async (path) => [path, await readFile(path, 'utf8')])),
);

// Regression class:
// - ci|main-writeback|agent-owned-git-mutation
// - ci|main-writeback|broad-staging
// - ci|main-writeback|cancelled-mid-write
//
// The invariant is architectural: AI may prepare content, but only deterministic
// workflow code may decide what is staged/committed/pushed to main.

test('all known main-writing workflows share the non-cancelling repository writer lock', () => {
  for (const [path, workflow] of Object.entries(contents)) {
    assert.match(workflow, /concurrency:\s*[\s\S]*?group:\s*repo-schrijven\s*[\s\S]*?cancel-in-progress:\s*false/, `${path} must use the shared repo-schrijven lock without cancellation`);
  }
});

test('AI prompts never own git staging, commits, pulls or pushes', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    const agentStart = workflow.indexOf('uses: anthropics/claude-code-action@v1');
    assert.ok(agentStart >= 0, `${path} must contain the content agent step`);
    const nextStep = workflow.indexOf('\n      - name:', agentStart);
    const agentBlock = workflow.slice(agentStart, nextStep > agentStart ? nextStep : workflow.length);
    assert.doesNotMatch(agentBlock, /\bgit\s+(?:add|commit|pull|push|reset|checkout)\b/i, `${path} agent prompt must not control git mutation`);
  }
});

test('content workflows validate and publish deterministically after AI generation', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    assert.match(workflow, /name: Deterministic (?:publication|update) contract checks/);
    assert.match(workflow, /git diff --name-only/);
    assert.match(workflow, /git ls-files --others --exclude-standard/);
    assert.match(workflow, /name: Commit and push validated changes/);
    assert.match(workflow, /git add --/);
    assert.doesNotMatch(workflow, /git add -A/);
    assert.doesNotMatch(workflow, /git push --force|git push -f/);
  }
});

test('paginacontrole cannot be cancelled while it owns a main writeback', () => {
  const workflow = contents['.github/workflows/paginacontrole.yml'];
  assert.match(workflow, /group:\s*repo-schrijven/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
});
