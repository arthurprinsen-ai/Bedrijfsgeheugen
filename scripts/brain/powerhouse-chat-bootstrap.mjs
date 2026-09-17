import { compileChatLearningPreflight } from './chat-learning-preflight.mjs';
import { bindPowerhouseSession } from './powerhouse-session-gateway.mjs';

export function bootstrapPowerhouseRun({
  sessionId,
  runId,
  observedAt = new Date().toISOString(),
  authoritySnapshot = {},
  openObligations = [],
  executionClass = 'STANDARD',
  candidateId = null,
  rootDir = process.cwd(),
} = {}) {
  const preflightPacket = compileChatLearningPreflight({ rootDir });
  const sessionReceipt = bindPowerhouseSession({
    sessionId,
    runId,
    observedAt,
    preflightPacket,
    authoritySnapshot,
    openObligations,
    executionClass,
    candidateId,
  });
  return Object.freeze({
    status: 'POWERHOUSE_BOUND',
    preflightPacket,
    sessionReceipt,
  });
}
