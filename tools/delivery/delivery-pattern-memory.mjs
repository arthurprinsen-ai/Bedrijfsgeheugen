import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

function unique(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))].sort();
}

function normalizePattern(value = '') {
  return String(value || '').trim().replace(/^\.\//, '');
}

function pathMatches(changedPath, pattern) {
  const changed = normalizePattern(changedPath);
  const candidate = normalizePattern(pattern);
  if (!changed || !candidate) return false;
  if (candidate.endsWith('/')) return changed.startsWith(candidate);
  return changed === candidate || changed.startsWith(`${candidate}/`) || candidate.startsWith(`${changed}/`);
}

function collectTests(record = {}) {
  const values = [
    ...(Array.isArray(record?.test_evidence) ? record.test_evidence : []),
    ...(Array.isArray(record?.evaluation?.historical_replay) ? record.evaluation.historical_replay : []),
    ...(Array.isArray(record?.evaluation?.shadow) ? record.evaluation.shadow : []),
    ...(Array.isArray(record?.evidence?.tests) ? record.evidence.tests : [])
  ];
  return unique(values).filter(test => /^tests\/.+\.(test\.)?(mjs|js|cjs|ts|tsx)$/.test(test) || /^tests\/.+\.test\.mjs$/.test(test));
}

function collectEnforcement(record = {}) {
  const values = [
    ...(Array.isArray(record?.enforcement) ? record.enforcement : []),
    ...(Array.isArray(record?.paths) ? record.paths : []),
    ...(Array.isArray(record?.affected_paths) ? record.affected_paths : [])
  ];
  return unique(values).filter(value => !/^tests\//.test(value));
}

export function derivePatternMemoryRoute({ changedPaths = [], learningRecords = [], maxTests = 12 } = {}) {
  const paths = unique(changedPaths);
  const matches = [];
  const tests = new Set();

  for (const record of learningRecords || []) {
    const fingerprint = String(record?.fingerprint || '').trim();
    if (!fingerprint) continue;
    const enforcement = collectEnforcement(record);
    if (!enforcement.length) continue;
    const matchedPaths = paths.filter(changedPath => enforcement.some(pattern => pathMatches(changedPath, pattern)));
    if (!matchedPaths.length) continue;
    const recordTests = collectTests(record);
    if (!recordTests.length) continue;
    matches.push(Object.freeze({
      fingerprint,
      matchedPaths: Object.freeze(matchedPaths),
      tests: Object.freeze(recordTests)
    }));
    for (const test of recordTests) {
      if (tests.size >= maxTests) break;
      tests.add(test);
    }
  }

  return Object.freeze({
    version: 'POWERHOUSE-DELIVERY-PATTERN-MEMORY-v1',
    changedPaths: Object.freeze(paths),
    matches: Object.freeze(matches),
    tests: Object.freeze([...tests].sort()),
    bounded: tests.size >= maxTests,
    maxTests
  });
}

export async function loadLearningRecords(rootDir = 'brain/learning') {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(rootDir, entry.name);
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'));
      if (parsed && typeof parsed === 'object') records.push(parsed);
    } catch {
      // Invalid learning JSON is enforced elsewhere; pattern memory skips unreadable records fail-safe.
    }
  }
  return records;
}
