#!/usr/bin/env node
// Select and run the existing backend-lane tests that reference a changed file by its exact repo path.
// Why: a merged page change (for example an SEO page) turned main red because the test that reads that page
// only ran after merge. This pulls exactly those tests into the required PR check. No new test framework.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const IGNORED_PREFIXES = ['AGENTS.md', '.agents/', 'docs/', 'brain/learning/', '.github/', 'package.json', 'package-lock.json', 'supabase/migration-history.lock.json'];
// Bounded, exhaustive affected-test admission: 100 was lower than the 126 genuine
// impacted tests of shared SEO/delivery files; overflow still fails closed at 200.
export const MAX_TESTS = 200;

export function selectTestsForChangedPaths({ changedPaths = [], tests = [], max = MAX_TESTS } = {}) {
  const selected = new Set();
  const changedTests = changedPaths.filter(p => /^tests\/[^/]+\.test\.mjs$/.test(p));
  for (const file of changedTests) selected.add(file);
  const watched = changedPaths.filter(p => !p.startsWith('tests/') && !IGNORED_PREFIXES.some(prefix => p === prefix || p.startsWith(prefix)));
  for (const { file, text } of tests) {
    if (watched.some(p => text.includes(p))) selected.add(file);
  }
  const ordered = [...selected].sort();
  return { selected: ordered.slice(0, max), overflow: ordered.slice(max), watched };
}

// A file that already fails on the base commit is reported loudly as KNOWN_RED_ON_BASE but does not block this PR:
// the PR check must catch regressions a change introduces, not punish unrelated work for earlier debt. Nothing is hidden.
export function partitionFailures({ failed = [], redOnBase = [] } = {}) {
  const base = new Set(redOnBase);
  return { blocking: failed.filter(f => !base.has(f)), knownRedOnBase: failed.filter(f => base.has(f)) };
}

function runTest(cwd, file) {
  return spawnSync(process.execPath, ['--test', file], { cwd, stdio: 'ignore' }).status === 0;
}

function loadTests() {
  return readdirSync('tests').filter(name => name.endsWith('.test.mjs')).map(name => ({ file: `tests/${name}`, text: readFileSync(`tests/${name}`, 'utf8') }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [base, head] = process.argv.slice(2);
  if (!/^[0-9a-f]{7,40}$/i.test(base || '') || !/^[0-9a-f]{7,40}$/i.test(head || '')) {
    console.error('usage: select-tests-for-changed-paths.mjs <base-sha> <head-sha>');
    process.exit(2);
  }
  const changedPaths = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const { selected, overflow, watched } = selectTestsForChangedPaths({ changedPaths, tests: loadTests() });
  console.log(JSON.stringify({ watched: watched.length, selected, overflow }, null, 2));
  if (overflow.length) { console.error(`CHANGED_PATH_TESTS_OVERFLOW:${overflow.length}`); process.exit(1); }
  if (!selected.length) { console.log('NO_CHANGED_PATH_TESTS'); process.exit(0); }
  const failed = selected.filter(file => !runTest('.', file));
  if (!failed.length) { console.log('CHANGED_PATH_TESTS_PASS'); process.exit(0); }
  const dir = mkdtempSync(path.join(tmpdir(), 'base-'));
  let redOnBase = [];
  try {
    execFileSync('git', ['worktree', 'add', '--detach', dir, base], { stdio: 'ignore' });
    redOnBase = failed.filter(file => existsSync(path.join(dir, file)) && !runTest(dir, file));
  } finally {
    try { execFileSync('git', ['worktree', 'remove', '--force', dir], { stdio: 'ignore' }); } catch { rmSync(dir, { recursive: true, force: true }); }
  }
  const { blocking, knownRedOnBase } = partitionFailures({ failed, redOnBase });
  console.log(JSON.stringify({ blocking, knownRedOnBase }, null, 2));
  if (knownRedOnBase.length) console.error(`KNOWN_RED_ON_BASE:${knownRedOnBase.join(',')}`);
  if (blocking.length) { spawnSync(process.execPath, ['--test', ...blocking], { stdio: 'inherit' }); console.error(`CHANGED_PATH_TESTS_BLOCKING:${blocking.join(',')}`); process.exit(1); }
  process.exit(0);
}
