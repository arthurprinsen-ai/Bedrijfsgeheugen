import fs from 'node:fs';
import path from 'node:path';

const OUTCOME_STATE = Object.freeze({ success: 'GREEN', failure: 'RED', cancelled: 'UNKNOWN', skipped: 'UNKNOWN' });

export function normalizeSensorOutcome(outcome) {
  return OUTCOME_STATE[String(outcome || '').toLowerCase()] || 'UNKNOWN';
}

export function buildSensorEvidence({ sensorId, outcome, candidateSha, runId, runAttempt, metadata = {} } = {}) {
  if (!sensorId) throw new Error('sensorId is required');
  return Object.freeze({
    fingerprint: 'powerhouse-quality-sensor-evidence-v1',
    sensor_id: sensorId,
    state: normalizeSensorOutcome(outcome),
    raw_outcome: outcome || null,
    candidate_sha: candidateSha || null,
    run_id: runId || null,
    run_attempt: runAttempt || null,
    observed_at: new Date().toISOString(),
    metadata,
  });
}

function main() {
  const [sensorId, outcome, outputPath] = process.argv.slice(2);
  if (!sensorId || !outputPath) throw new Error('usage: sensor-evidence.mjs <sensor-id> <outcome> <output-path>');
  const evidence = buildSensorEvidence({
    sensorId,
    outcome,
    candidateSha: process.env.GITHUB_SHA,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
