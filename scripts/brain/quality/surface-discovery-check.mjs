import fs from 'node:fs';
import path from 'node:path';
import { discoverQualitySurfaces, buildDiscoveryObligations } from './surface-discovery.mjs';

const PRODUCT_PREFIXES = ['site/', 'portal-v2/', 'public/', 'netlify/functions/', 'supabase/', 'contracts/openapi/'];

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function loadFiles(paths) {
  return paths
    .filter(file => PRODUCT_PREFIXES.some(prefix => file.startsWith(prefix)))
    .filter(file => fs.existsSync(file) && fs.statSync(file).isFile())
    .map(file => ({ path: file, content: fs.readFileSync(file, 'utf8') }));
}

function main() {
  const listFile = arg('--files');
  const registryPath = arg('--registry') || 'config/powerhouse-quality-surface-contracts.json';
  const outputPath = arg('--output') || 'artifacts/quality/coverage/discovery.json';
  if (!listFile || !fs.existsSync(listFile)) throw new Error('surface discovery requires --files <newline-separated changed-file list>');
  const changedPaths = fs.readFileSync(listFile, 'utf8').split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const files = loadFiles(changedPaths);
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const discovered = discoverQualitySurfaces({ files });
  const obligations = buildDiscoveryObligations({ discovered, registeredSurfaces: registry.surfaces || [], evidence: [] });
  const report = {
    fingerprint: 'powerhouse-quality-surface-discovery-evidence-v1',
    candidate_sha: process.env.GITHUB_SHA || null,
    changed_paths: changedPaths,
    discovered,
    obligations,
    not_registered: obligations.filter(item => item.state === 'NOT_REGISTERED'),
    untested: obligations.filter(item => item.state === 'UNTESTED'),
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (process.argv.includes('--check') && report.not_registered.length) process.exitCode = 1;
}

main();
