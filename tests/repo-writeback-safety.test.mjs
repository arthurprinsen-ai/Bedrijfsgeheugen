import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const paths = [
  '.github/workflows/weekblog.yml',
  '.github/workflows/blog-bijwerken.yml',
  '.github/workflows/approved-central-blog.yml',
];

const contents = Object.fromEntries(paths.map((path) => [path, fs.readFileSync(path, 'utf8')]));

test('AI prompts and allowed tools never own git staging, commits, pulls or pushes', () => {
  for (const path of paths) {
    const workflow = contents[path];
    const agentStart = workflow.indexOf('uses: anthropics/claude-code-action@v1');
    if (agentStart < 0) continue;
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

test('content workflows validate and publish deterministic candidate PRs after AI generation', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    assert.match(workflow, /name: Deterministic (?:publication|update) contract checks/);
    assert.equal(hasChangedFileInventory(workflow), true, `${path} must inventory tracked and untracked changes deterministically`);
    assert.match(workflow, /name: Commit validated changes/);
    assert.match(workflow, /name: Candidate branch publiceren/);
    assert.match(workflow, /name: Candidate PR openen/);
    assert.match(workflow, /createWriterCandidate/);
    assert.match(workflow, /git add --/);
    assert.doesNotMatch(workflow, /name: Direct publiceren op huidige veilige pad/);
    assert.doesNotMatch(workflow, /git push origin HEAD:main/);
    assert.doesNotMatch(workflow, /git add -A/);
    assert.doesNotMatch(workflow, /git push --force|git push -f/);
  }
});
