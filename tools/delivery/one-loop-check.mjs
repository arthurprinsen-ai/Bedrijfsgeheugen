import { readFileSync } from 'node:fs';
import { evaluateFinishingPressure } from './one-loop.mjs';

export function evaluateOneLoopAdmission(input = {}) {
  const result = evaluateFinishingPressure(input);
  if (result.decision === 'WAITING_CAPACITY') {
    return { ok: false, code: 'WAITING_CAPACITY', ...result };
  }
  return { ok: true, code: result.decision, ...result };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const payloadPath = process.argv[2];
  const payload = payloadPath ? JSON.parse(readFileSync(payloadPath, 'utf8')) : {};
  const result = evaluateOneLoopAdmission(payload);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok && process.env.POWERHOUSE_ONE_LOOP_ENFORCE === '1') process.exitCode = 2;
}
