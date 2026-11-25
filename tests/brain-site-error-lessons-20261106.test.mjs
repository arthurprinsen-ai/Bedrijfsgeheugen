import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const lessonsDoc = JSON.parse(await read('docs/brain/delivery-failure-lessons.json'));
const rulesDoc = JSON.parse(await read('config/delivery-prevention-rules.json'));
const SITE_FINGERPRINTS = [
  "site|build|shared|generated-html-overwritten-by-build-generators",
  "site|build|shared|homepage-index-overwritten-by-v18-production-core",
  "site|build|shared|page-outside-generator-or-shell-exclusion",
  "site|css|shared|scoper-flattens-scrollbar-selector-white-pages",
  "site|seo|shared|shell-jsonld-copied-to-every-page",
  "delivery-failure|governance|shared|learning-evaluation-uses-dependency-needing-tests",
  "delivery-failure|pipeline|shared|two-contradicting-tests-after-rebuild",
  "delivery-failure|pipeline|shared|tests-assert-literal-source-or-copy",
  "github|writeback|shared|glob-skips-dot-folders",
  "site|seo|shared|canonical-kop-must-match-menu",
  "netlify|ci|shared|preview-check-race-or-neutral-pages-changed"
];

test('every site and CI lesson is PROVEN, actionable and has an active prevention rule', () => {
  const activeRules = new Set(rulesDoc.rules.filter(rule => rule.active).map(rule => rule.id));
  for (const fingerprint of SITE_FINGERPRINTS) {
    const lesson = lessonsDoc.lessons.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `lesson missing: ${fingerprint}`);
    assert.equal(lesson.status, 'PROVEN', fingerprint);
    assert.ok(lesson.rootCause.trim().length > 20 && lesson.fix.trim().length > 20, `rootCause and fix required: ${fingerprint}`);
    assert.ok(activeRules.has(lesson.preventionRule), `active rule missing for ${fingerprint}: ${lesson.preventionRule}`);
  }
});

test('fingerprints and rule ids stay unique and no lesson points at a missing rule', () => {
  const fingerprints = lessonsDoc.lessons.map(item => item.fingerprint);
  assert.equal(new Set(fingerprints).size, fingerprints.length, 'duplicate lesson fingerprint');
  const ruleIds = rulesDoc.rules.map(rule => rule.id);
  assert.equal(new Set(ruleIds).size, ruleIds.length, 'duplicate rule id');
  const active = new Set(rulesDoc.rules.filter(rule => rule.active).map(rule => rule.id));
  assert.deepEqual(lessonsDoc.lessons.filter(item => item.preventionRule && !active.has(item.preventionRule)).map(item => item.preventionRule), []);
});

test('lessons, rules and learning record never contain a credential', async () => {
  for (const file of ['docs/brain/delivery-failure-lessons.json', 'config/delivery-prevention-rules.json', 'brain/learning/2026-11-06-site-error-lessons-v1.json', 'docs/changes/2026-11-06-site-error-lessons-v1.md']) {
    assert.ok(!/github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(await read(file)), `credential-like string in ${file}`);
  }
});

test('the required PR check runs this guard and AGENTS.md points to it', async () => {
  assert.ok((await read('.github/workflows/required-test.yml')).includes('tests/brain-site-error-lessons-20261106.test.mjs'));
  assert.ok((await read('AGENTS.md')).includes('tests/brain-site-error-lessons-20261106.test.mjs'));
});
