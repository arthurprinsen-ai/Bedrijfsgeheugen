import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileClosurePlan } from '../tools/delivery/integration-bundle-compiler.mjs';

const policy = JSON.parse(readFileSync('config/powerhouse-integration-bundle-v1.json', 'utf8'));
const workflow = readFileSync('.github/workflows/powerhouse-daily-blog.yml', 'utf8');
const obligationId = 'content-publication:2026-11-07:blog';

function plan(changedPaths, id = obligationId) {
  return compileClosurePlan({ changedPaths, policy, obligationId: id });
}

// Every path the daily blog workflow stages in its candidate, read from the workflow itself.
function workflowCandidatePaths() {
  const found = new Set();
  for (const line of workflow.match(/git add[^\n]*/g) || []) {
    for (const raw of line.replace(/^git add/, '').trim().split(/\s+/)) {
      const token = raw.replace(/["']/g, '');
      if (!token || token.startsWith('-') || token.includes('$patch')) continue;
      found.add(token.replace('$SLUG', 'een-artikel').replace('$DATE', '2026-11-07'));
    }
  }
  for (const m of workflow.matchAll(/patch="([^"]+)"/g)) {
    found.add(m[1].replace('$DATE', '2026-11-07'));
  }
  return [...found].sort();
}

test('the workflow stages the article, index, feed, sitemap and the English cache patch', () => {
  const paths = workflowCandidatePaths();
  assert.ok(paths.includes('blog/index.html'), paths.join(', '));
  assert.ok(paths.includes('sitemap.xml'), paths.join(', '));
  assert.ok(paths.includes('config/bg-static-i18n-en.d/powerhouse-blog-2026-11-07.json'), paths.join(', '));
  assert.ok(paths.length >= 5, paths.join(', '));
});

test('every path the daily blog workflow stages is covered by the runtime closure prefixes', () => {
  const result = plan(workflowCandidatePaths());
  assert.equal(result.authority, 'canonical-runtime-obligation', JSON.stringify(result.materialPaths));
  assert.equal(result.ready, true);
  assert.deepEqual([...result.missing], []);
});

test('segment patches for a blog date are covered as well', () => {
  const result = plan([
    'blog/index.html',
    'config/bg-static-i18n-en.d/powerhouse-blog-2026-11-06-segments.json'
  ]);
  assert.equal(result.authority, 'canonical-runtime-obligation');
  assert.equal(result.ready, true);
});

test('the exemption does not widen to other config or other i18n patches', () => {
  for (const extra of ['config/delivery-prevention-rules.json', 'config/bg-static-i18n-en.d/pricing-2026-11-07.json']) {
    const result = plan([...workflowCandidatePaths(), extra]);
    assert.equal(result.authority, 'repository-artifacts', extra);
    assert.equal(result.ready, false, extra);
    assert.deepEqual([...result.missing], ['activity_ledger', 'brain_learning', 'human_documentation'], extra);
  }
});

test('the same paths under a different obligation still need the closure artifacts', () => {
  const result = plan(workflowCandidatePaths(), 'some-other-obligation:2026-11-07');
  assert.equal(result.authority, 'repository-artifacts');
  assert.equal(result.ready, false);
});
