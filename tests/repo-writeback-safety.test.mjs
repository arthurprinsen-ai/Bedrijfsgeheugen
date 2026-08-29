import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const writerWorkflows = [
  '.github/workflows/paginacontrole.yml',
  '.github/workflows/seo-controle.yml',
  '.github/workflows/approved-central-blog.yml',
  '.github/workflows/weekblog.yml',
  '.github/workflows/blog-bijwerken.yml',
];

const contents = Object.fromEntries(
  await Promise.all(writerWorkflows.map(async (path) => [path, await readFile(path, 'utf8')])),
);
const validator = await readFile('scripts/ci/validate_blog_writeback.py', 'utf8');
const publisher = await readFile('scripts/ci/commit_validated_main.sh', 'utf8');

test('all known main-writing workflows share one non-cancelling repository writer lock', () => {
  for (const [path, workflow] of Object.entries(contents)) {
    assert.match(
      workflow,
      /concurrency:\s*[\s\S]*?group:\s*repo-schrijven\s*[\s\S]*?cancel-in-progress:\s*false/,
      `${path} must use repo-schrijven without cancellation`,
    );
  }
});

test('AI content prompts cannot own repository mutation', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    const start = workflow.indexOf('uses: anthropics/claude-code-action@v1');
    assert.ok(start >= 0, `${path} must contain the content agent`);
    const end = workflow.indexOf('\n      - name:', start);
    const block = workflow.slice(start, end > start ? end : workflow.length);
    assert.doesNotMatch(block, /--allowedTools[^\n]*\bBash\b/, `${path} content agent may not receive Bash`);
    assert.doesNotMatch(
      block,
      /\bgit\s+(?:add|commit|pull|push|reset|checkout)\b/i,
      `${path} agent prompt may not control repository mutation`,
    );
  }
});

test('content workflows validate then publish through the shared deterministic primitive', () => {
  const week = contents['.github/workflows/weekblog.yml'];
  const update = contents['.github/workflows/blog-bijwerken.yml'];
  assert.match(week, /name: Deterministic publication contract checks/);
  assert.match(update, /name: Deterministic update contract checks/);
  for (const workflow of [week, update]) {
    assert.match(workflow, /scripts\/ci\/validate_blog_writeback\.py/);
    assert.match(workflow, /name: Commit and push validated changes/);
    assert.match(workflow, /scripts\/ci\/commit_validated_main\.sh/);
    assert.doesNotMatch(workflow, /git add -A/);
    assert.doesNotMatch(workflow, /git push --force|git push -f/);
  }
});

test('shared validator fail-closes on unexpected change sets and emits an exact manifest', () => {
  assert.match(validator, /git\('diff', '--name-only'\)/);
  assert.match(validator, /git\('ls-files', '--others', '--exclude-standard'\)/);
  assert.match(validator, /onverwachte bestanden gewijzigd/);
  assert.match(validator, /len\(article_extra\) > 1/);
  assert.match(validator, /MANIFEST\.write_text/);
  assert.match(validator, /WRITEBACK_CONTRACT_OK/);
});

test('shared publisher stages only validated paths, retries boundedly and never force-pushes', () => {
  assert.match(publisher, /git add -- "\$file"/);
  assert.match(publisher, /git diff --cached --name-only/);
  assert.match(publisher, /for attempt in 1 2 3/);
  assert.match(publisher, /git pull --rebase origin main/);
  assert.match(publisher, /git rebase --abort/);
  assert.doesNotMatch(publisher, /git push --force|git push -f/);
});

test('source state changes happen only after deterministic repository publication', () => {
  for (const path of ['.github/workflows/weekblog.yml', '.github/workflows/blog-bijwerken.yml']) {
    const workflow = contents[path];
    const publish = workflow.indexOf('- name: Commit and push validated changes');
    const notion = workflow.indexOf('- name: Notion ');
    assert.ok(publish >= 0 && notion > publish, `${path} must update Notion only after repository publication`);
  }
});
