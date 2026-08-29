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
// AI may prepare content, but only deterministic workflow code may decide what
// is staged/committed/pushed to main. PR-only verification may keep a per-PR
// cancellable lock as long as every main-writing run resolves to repo-schrijven
// and is non-cancellable.

test('dedicated main writers use the shared non-cancelling repository lock', () => {
  for (const path of [
    '.github/workflows/approved-central-blog.yml',
    '.github/workflows/weekblog.yml',
    '.github/workflows/blog-bijwerken.yml',
  ]) {
    const workflow = contents[path];
    assert.match(workflow, /concurrency:\s*[\s\S]*?group:\s*repo-schrijven\s*[\s\S]*?cancel-in-progress:\s*false/, `${path} must use repo-schrijven without cancellation`);
  }
});

test('paginacontrole keeps PR isolation but routes every main-writing run through repo-schrijven without cancellation', () => {
  const workflow = contents['.github/workflows/paginacontrole.yml'];
  assert.match(workflow, /group:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'[\s\S]*format\('paginacontrole-\{0\}'[\s\S]*\|\|\s*'repo-schrijven'\s*\}\}/);
  assert.match(workflow, /cancel-in-progress:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*\}\}/);
});

test('AI prompts and allowed tools never own git staging, commits, pulls or pushes', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    const agentStart = workflow.indexOf('uses: anthropics/claude-code-action@v1');
    assert.ok(agentStart >= 0, `${path} must contain the content agent step`);
    const nextStep = workflow.indexOf('\n      - name:', agentStart);
    const agentBlock = workflow.slice(agentStart, nextStep > agentStart ? nextStep : workflow.length);
    assert.doesNotMatch(agentBlock, /\bgit\s+(?:add|commit|pull|push|reset|checkout)\b/i, `${path} agent prompt must not control git mutation`);
    assert.doesNotMatch(agentBlock, /--allowedTools[^\n]*\bBash\b/, `${path} content agent must not have Bash ownership of repository mutation`);
  }
});

function hasChangedFileInventory(workflow) {
  const diff = workflow.includes('git diff --name-only') || workflow.includes("['git','diff','--name-only']") || workflow.includes('["git","diff","--name-only"]');
  const untracked = workflow.includes('git ls-files --others --exclude-standard') || workflow.includes("['git','ls-files','--others','--exclude-standard']") || workflow.includes('["git","ls-files","--others","--exclude-standard"]');
  return diff && untracked;
}

test('content workflows validate and publish deterministically after AI generation', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    assert.match(workflow, /name: Deterministic (?:publication|update) contract checks/);
    assert.equal(hasChangedFileInventory(workflow), true, `${path} must inventory tracked and untracked changes deterministically`);
    assert.match(workflow, /name: Commit and push validated changes/);
    assert.match(workflow, /git add --/);
    assert.doesNotMatch(workflow, /git add -A/);
    assert.doesNotMatch(workflow, /git push --force|git push -f/);
  }
});
