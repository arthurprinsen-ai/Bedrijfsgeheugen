export const BRAIN_COMMANDS = Object.freeze({
  INGEST_SIGNAL:'INGEST_SIGNAL',
  ANALYZE_SIGNAL:'ANALYZE_SIGNAL',
  RECORD_DECISION:'RECORD_DECISION',
  EXECUTE_CHANGE:'EXECUTE_CHANGE',
  VERIFY_AND_LEARN:'VERIFY_AND_LEARN',
  SELF_HEAL:'SELF_HEAL',
});

export const BRAIN_QUERIES = Object.freeze({ STATUS:'STATUS' });

function assertRuntime(runtime) {
  for (const method of ['ingest','analyze','recordDecision','executeChange','verifyAndLearn','selfHeal','snapshot']) {
    if (typeof runtime?.[method] !== 'function') throw new TypeError(`runtime.${method} is required`);
  }
}

function unsupported(kind, value) {
  const error = new Error(`unsupported Brain ${kind}: ${String(value)}`);
  error.code = 'BRAIN_OPERATION_UNSUPPORTED';
  return error;
}

export function createBrainGateway({ runtime }) {
  assertRuntime(runtime);

  async function command(request) {
    if (!request || typeof request.type !== 'string') throw new TypeError('Brain command type is required');
    const payload = Object.freeze({ ...(request.payload ?? {}) });
    switch (request.type) {
      case BRAIN_COMMANDS.INGEST_SIGNAL:
        return runtime.ingest(payload, { actorId:request.actorId ?? payload.actorId });
      case BRAIN_COMMANDS.ANALYZE_SIGNAL:
        return runtime.analyze(payload);
      case BRAIN_COMMANDS.RECORD_DECISION:
        return runtime.recordDecision(payload);
      case BRAIN_COMMANDS.EXECUTE_CHANGE:
        return runtime.executeChange(payload);
      case BRAIN_COMMANDS.VERIFY_AND_LEARN:
        return runtime.verifyAndLearn(payload);
      case BRAIN_COMMANDS.SELF_HEAL:
        return runtime.selfHeal(payload);
      default:
        throw unsupported('command', request.type);
    }
  }

  function query(request) {
    if (!request || typeof request.type !== 'string') throw new TypeError('Brain query type is required');
    if (request.type !== BRAIN_QUERIES.STATUS) throw unsupported('query', request.type);
    const state = runtime.snapshot();
    return Object.freeze({
      events:state.events.length,
      activeObjects:state.activeObjects.size,
      workingObjects:state.workingObjects.size,
      recommendations:state.recommendations.size,
      decisions:state.decisions.size,
      learning:state.learning.length,
      agentWork:state.agentWork.size,
    });
  }

  return Object.freeze({ command, query });
}
