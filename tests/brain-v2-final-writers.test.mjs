import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const paths = [
  '.github/workflows/blog-bijwerken.yml',
  '.github/workflows/paginacontrole.yml',
  '.github/workflows/weekblog.yml',
];
const workflows = Object.fromEntries(paths.map((path) => [path, fs.readFileSync(path, 'utf8')]));

test('remaining legacy repository writers are candidate-only under BRAIN v2', () => {
  for (const [path, workflow] of Object.entries(workflows)) {
    assert.match(workflow, /default:\s*candidate-pr/, `${path}: candidate-pr must be default`);
    assert.doesNotMatch(workflow, /^\s*-\s*direct\s*$/m, `${path}: direct delivery option is forbidden`);
    assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/, `${path}: direct main push is forbidden`);
    assert.match(workflow, /createWriterCandidate/, `${path}: canonical candidate identity is required`);
    assert.match(workflow, /gh\s+pr\s+create/, `${path}: candidate must end in a PR`);
    assert.doesNotMatch(workflow, /gh\s+pr\s+merge/, `${path}: writer may never merge itself`);
  }
});

test('candidate creation never marks external production state complete', () => {
  const blog = workflows['.github/workflows/blog-bijwerken.yml'];
  const week = workflows['.github/workflows/weekblog.yml'];
  const pages = workflows['.github/workflows/paginacontrole.yml'];
  assert.doesNotMatch(blog, /Notion op Goedgekeurd zetten na succesvolle directe publicatie/);
  assert.doesNotMatch(week, /Notion bijwerken na succesvolle directe publicatie/);
  assert.doesNotMatch(pages, /inputs\.delivery_mode != 'candidate-pr'/);
});

test('production completion is delegated to a post-promotion reconciler', () => {
  const reconciler = fs.readFileSync('.github/workflows/writer-production-reconcile.yml', 'utf8');
  assert.match(reconciler, /pull_request:[\s\S]*?types:\s*\[closed\]/);
  assert.match(reconciler, /github\.event\.pull_request\.merged/);
  assert.match(reconciler, /BG169|BRAIN-DELIVERY-v2/);
  assert.match(reconciler, /production/i);
  assert.match(reconciler, /NOTION_TOKEN/);
});
