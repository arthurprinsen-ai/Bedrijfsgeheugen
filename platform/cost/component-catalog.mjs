const PROTECTED_DOMAINS = new Set(['security', 'reliability', 'data quality', 'production', 'trust']);

function classify(component, override) {
  if (override) {
    return {
      costClass: override.costClass,
      ownerAgentId: override.ownerAgentId,
      protectedMetrics: Object.freeze([...(override.protectedMetrics ?? [])]),
      classificationState: 'CLASSIFIED',
      runDecision: override.runDecision ?? 'RUN',
    };
  }

  if (component.costProfile?.costClass) {
    return {
      costClass: component.costProfile.costClass,
      ownerAgentId: component.costProfile.ownerAgentId ?? component.id,
      protectedMetrics: Object.freeze([...(component.costProfile.protectedMetrics ?? [])]),
      classificationState: 'CLASSIFIED',
      runDecision: component.costProfile.runDecision ?? 'RUN',
    };
  }

  const protectedDomain = (component.domains ?? [])
    .some(domain => PROTECTED_DOMAINS.has(String(domain).toLowerCase()));
  if (protectedDomain) {
    return {
      costClass: 'production_core',
      ownerAgentId: component.id ?? 'agent-reliability',
      protectedMetrics: Object.freeze(['security', 'production', 'data_integrity']),
      classificationState: 'CLASSIFIED',
      runDecision: 'RUN',
    };
  }

  return {
    costClass: 'unclassified',
    ownerAgentId: 'agent-cost',
    protectedMetrics: Object.freeze([]),
    classificationState: 'UNCLASSIFIED',
    runDecision: 'BUDGET_DEFERRED',
  };
}

export function buildComponentCatalog({ makeScenarios = [], agents = [], overrides = {}, now = () => new Date().toISOString() } = {}) {
  const entries = new Map();
  const add = (key, entry) => {
    if (entries.has(key)) throw new Error(`duplicate component key: ${key}`);
    entries.set(key, Object.freeze(entry));
  };

  for (const scenario of makeScenarios) {
    if (scenario?.id === undefined || !String(scenario.name ?? '').trim()) {
      throw new TypeError('Make scenario id and name are required');
    }
    const key = `make:${scenario.id}`;
    add(key, {
      componentKey: key,
      kind: 'MAKE_SCENARIO',
      componentId: String(scenario.id),
      name: String(scenario.name),
      active: scenario.isActive !== false,
      trigger: scenario.trigger ?? null,
      discoveredAt: now(),
      ...classify(scenario, overrides[key]),
    });
  }

  for (const agent of agents) {
    if (!agent?.id) throw new TypeError('agent id is required');
    const key = `agent:${agent.id}`;
    add(key, {
      componentKey: key,
      kind: 'AGENT',
      componentId: String(agent.id),
      name: String(agent.name ?? agent.id),
      active: agent.active !== false,
      domains: Object.freeze([...(agent.domains ?? [])]),
      discoveredAt: now(),
      ...classify(agent, overrides[key]),
    });
  }

  return entries;
}
