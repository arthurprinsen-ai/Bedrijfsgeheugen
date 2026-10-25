#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Read-only preflight. Never copy or execute archived migrations.
const apply = process.argv.includes('--apply');
const root = path.resolve(process.argv.find((arg, i) => i > 1 && !arg.startsWith('--')) ?? '.');
const activeDir = path.join(root, 'supabase/migrations');
const archiveDir = path.join(root, 'supabase/migration-history/repository-only');
const report = { checkedFiles: 0, references: 0, missing: [], archivalCandidates: [], ambiguous: [], repaired: [] };
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
  let source = fs.readFileSync(file, 'utf8');
  const replacements = new Map();
  report.checkedFiles++;
  const re = /supabase\/migrations\/([0-9]{8,}_[A-Za-z0-9_.-]+\.sql)/g;
  for (const match of source.matchAll(re)) {
    report.references++;
    const name = match[1];
    if (fs.existsSync(path.join(activeDir, name))) continue;
    const item = { test: path.relative(root, file), path: `supabase/migrations/${name}`, line: source.slice(0, match.index).split('\n').length };
    report.missing.push(item);
    const archive = path.join(archiveDir, name);
    // Read once rather than stat-then-read: archive may change between syscalls.
    let archiveText = null;
    try {
      const stat = fs.lstatSync(archive);
      if (stat.isFile() && !stat.isSymbolicLink()) archiveText = fs.readFileSync(archive, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    if (archiveText?.trim()) {
      const suggestedPath = `supabase/migration-history/repository-only/${name}`;
      report.archivalCandidates.push({ ...item, suggestedPath });
      replacements.set(item.path, suggestedPath);
    } else {
      report.ambiguous.push({ ...item, reason: 'No nonempty exact-name archived source; verify historical SQL identity manually' });
    }
  }
  // Explicit opt-in repair: only literal source references, no SQL or assertion changes.
  // Do not write when this file contains an ambiguous historical reference.
  if (apply && replacements.size && !report.ambiguous.some(item => item.test === path.relative(root, file))) {
    const before = source;
    for (const [oldPath, newPath] of replacements) source = source.split(oldPath).join(newPath);
    if (source !== before) {
      fs.writeFileSync(file, source);
      report.repaired.push({ test: path.relative(root, file), references: replacements.size });
    }
  }
}
console.log(JSON.stringify(report, null, 2));
if (report.ambiguous.length || (!apply && report.missing.length)) {
  console.error(`MIGRATION_TEST_SOURCE_MISSING: ${report.missing.length} obsolete SQL source references; check report.repaired and ambiguous`);
  process.exitCode = 1;
}
