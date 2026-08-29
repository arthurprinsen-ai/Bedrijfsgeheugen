export const AGENT_FABRIC_COMMANDS = Object.freeze({
  INTAKE_SIGNAL:'INTAKE_SIGNAL',
  INTAKE_OPPORTUNITY:'INTAKE_OPPORTUNITY',
  TRANSITION_WORK:'TRANSITION_WORK',
  RECORD_LEARNING:'RECORD_LEARNING',
});

export const AGENT_FABRIC_QUERIES = Object.freeze({
  WORK:'WORK',
  WORK_LIST:'WORK_LIST',
  LEARNING_SUGGESTIONS:'LEARNING_SUGGESTIONS',
});

function requireMethod(fabric, method) {
  if (typeof fabric?.[method] !== 'function') throw new TypeError(`fabric.${method} is required`);
}

function unsupported(kind, value) {
  const error = new Error(`unsupported Agent Fabric ${kind}: ${String(value)}`);
  error.code = 'AGENT_FABRIC_OPERATION_UNSUPPORTED';
  return error;
}

export function createAgentFabricGateway({ fabric } = {}) {
  for (const method of ['intake','intakeOpportunity','transition','recordLearning','getWork','listWork','suggestLearning']) {
    requireMethod(fabric, method);
  }

  async function command(request) {
    if (!request || typeof request.type !== 'string') throw new TypeError('Agent Fabric command type is required');
    const payload = Object.freeze({ ...(request.payload ?? {}) });
    switch (request.type) {
      case AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL:
        return fabric.intake(payload);
      case AGENT_FABRIC_COMMANDS.INTAKE_OPPORTUNITY:
        return fabric.intakeOpportunity(payload);
      case AGENT_FABRIC_COMMANDS.TRANSITION_WORK:
        return fabric.transition(payload);
      case AGENT_FABRIC_COMMANDS.RECORD_LEARNING:
        return fabric.recordLearning(payload);
      default:
        throw unsupported('command', request.type);
    }
  }

  function query(request) {
    if (!request || typeof request.type !== 'string') throw new TypeError('Agent Fabric query type is required');
    const payload = Object.freeze({ ...(request.payload ?? {}) });
    switch (request.type) {
      case AGENT_FABRIC_QUERIES.WORK:
        return fabric.getWork(payload.id);
      case AGENT_FABRIC_QUERIES.WORK_LIST:
        return fabric.listWork(payload);
      case AGENT_FABRIC_QUERIES.LEARNING_SUGGESTIONS:
        return fabric.suggestLearning(payload);
      default:
        throw unsupported('query', request.type);
    }
  }

  return Object.freeze({ command, query });
}
