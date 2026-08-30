function normalize(values) {
  return Object.freeze([...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))]);
}

function overlapCount(a, b) {
  const target = new Set(b);
  return a.reduce((count, value) => count + (target.has(value) ? 1 : 0), 0);
}

export function createAgentRegistry(agentDefinitions = []) {
  const agents = [];
  const ids = new Set();

  for (const definition of agentDefinitions) {
    if (!definition?.id) throw new TypeError('agent id is required');
    if (ids.has(definition.id)) throw new Error(`duplicate agent id: ${definition.id}`);
    ids.add(definition.id);
    agents.push(Object.freeze({
      id:String(definition.id),
      domains:normalize(definition.domains),
      capabilities:normalize(definition.capabilities),
      tasks:normalize(definition.tasks),
      playbooks:normalize(definition.playbooks),
      learningContracts:normalize(definition.learningContracts),
      costProfile:definition.costProfile ? Object.freeze({ ...definition.costProfile }) : null,
    }));
  }

  function route({ domains = [], capabilities = [] } = {}) {
    const requestedDomains = normalize(domains);
    const requestedCapabilities = normalize(capabilities);
    const eligible = agents
      .map(agent => ({
        agent,
        domainScore:overlapCount(agent.domains, requestedDomains),
        capabilityScore:overlapCount(agent.capabilities, requestedCapabilities),
      }))
      .filter(candidate => candidate.domainScore > 0 && (requestedCapabilities.length === 0 || candidate.capabilityScore > 0))
      .sort((left, right) =>
        right.domainScore - left.domainScore ||
        right.capabilityScore - left.capabilityScore ||
        left.agent.id.localeCompare(right.agent.id)
      );

    if (!eligible.length) throw new Error('no eligible agent');
    const [primary, ...rest] = eligible;
    return Object.freeze({
      primaryAgentId:primary.agent.id,
      supportAgentIds:Object.freeze(rest.map(candidate => candidate.agent.id)),
    });
  }

  function get(id) {
    return agents.find(agent => agent.id === id) ?? null;
  }

  return Object.freeze({
    route,
    get,
    all:() => Object.freeze([...agents]),
  });
}
