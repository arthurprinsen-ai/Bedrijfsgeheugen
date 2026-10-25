#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Read-only preflight. Never copy or execute archived migrations.
const root = path.resolve(process.argv[2] ?? '.');
const activeDir = path.join(root, 'supabase/migrations');
const archiveDir = path.join(root, 'supabase/migration-history/repository-only');
const report = { checkedFiles: 0, references: 0, missing: [], archivalCandidates: [], ambiguous: [] };
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && /\.(?:mjs|cjs|js|ts)$/.test(entry.name) ? [full] : [];
  });
}
for (const file of walk(path.join(root, 'tests'))) {
  const source = fs.readFileSync(file, 'utf8');
  report.checkedFiles++;
  const re = /supabase\/migrations\/([0-9]{8,}_[A-Za-z0-9_.-]+\.sql)/g;
  for (const match of source.matchAll(re)) {
    report.references++;
    const name = match[1];
    if (fs.existsSync(path.join(activeDir, name))) continue;
    const item = { test: path.relative(root, file), path: `supabase/migrations/${name}`, line: source.slice(0, match.index).split('\n').length };
    report.missing.push(item);
    const archive = path.join(archiveDir, name);
    if (fs.existsSync(archive) && fs.statSync(archive).size > 0 && fs.readFileSync(archive, 'utf8').trim()) {
      report.archivalCandidates.push({ ...item, suggestedPath: `supabase/migration-history/repository-only/${name}` });
    } else {
      report.ambiguous.push({ ...item, reason: 'No nonempty exact-name archived source; verify historical SQL identity manually' });
    }
  }
}
console.log(JSON.stringify(report, null, 2));
if (report.missing.length) {
  console.error(`MIGRATION_TEST_SOURCE_MISSING: ${report.missing.length} obsolete SQL source references; no files modified`);
  process.exitCode = 1;
}
