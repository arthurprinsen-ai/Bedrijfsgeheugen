import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FINGERPRINT = 'powerhouse-loop-assurance-v2';
export const REQUIRED_STAGES = ['input','decision','action','readback','outcome','measurement','learning','guard'];

export function validateLoopRegistry(registry = {}) {
  const gaps = [];
  const loops = Array.isArray(registry.loops) ? registry.loops : [];
  const seen = new Set();

  if (registry.fingerprint !== FINGERPRINT) gaps.push('registry fingerprint mismatch');
  if (loops.length === 0) gaps.push('no loops registered');

  for (const [index, loop] of loops.entries()) {
    const label = loop?.loop_key || `loop[${index}]`;
    if (!loop?.loop_key) gaps.push(`${label}: missing loop_key`);
    if (loop?.loop_key) {
      if (seen.has(loop.loop_key)) gaps.push(`${label}: duplicate loop_key`);
      seen.add(loop.loop_key);
    }
    if (!Number.isInteger(loop?.expected_cadence_minutes) || loop.expected_cadence_minutes <= 0) {
      gaps.push(`${label}: invalid expected_cadence_minutes`);
    }
    if (loop?.runtime_source == null && loop?.cron_jobname == null) {
      gaps.push(`${label}: requires runtime_source and/or cron_jobname`);
    }
    const stages = Array.isArray(loop?.required_stages) ? loop.required_stages : [];
    const missingStages = REQUIRED_STAGES.filter(stage => !stages.includes(stage));
    if (missingStages.length) gaps.push(`${label}: missing required stages ${missingStages.join(',')}`);
  }

  return { ok: gaps.length === 0, gaps, count: loops.length };
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '..');
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'powerhouse/assurance/loop-registry.json'), 'utf8'));
  const result = validateLoopRegistry(registry);
  process.stdout.write(JSON.stringify({ fingerprint: FINGERPRINT, ...result }, null, 2) + '\n');
  if (process.argv.includes('--check') && !result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
