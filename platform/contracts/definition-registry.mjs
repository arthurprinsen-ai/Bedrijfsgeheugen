export function createDefinitionRegistry(definitions = []) {
  const byKey = new Map();
  for (const definition of definitions) {
    if (!definition?.key || !definition?.meaning || !definition?.unit) {
      throw new TypeError('definition requires key, meaning and unit');
    }
    if (byKey.has(definition.key)) throw new TypeError(`duplicate definition: ${definition.key}`);
    byKey.set(definition.key, Object.freeze({ version: 1, ...definition }));
  }
  return Object.freeze({
    get(key) { return byKey.get(key) ?? null; },
    list() { return Object.freeze([...byKey.values()]); },
  });
}

export const CORE_DEFINITIONS = Object.freeze([
  Object.freeze({ key: 'Revenue', meaning: 'Recognized or contracted revenue according to the tenant financial policy; never inferred from website traffic.', unit: 'currency', version: 1 }),
  Object.freeze({ key: 'VerifiedImpact', meaning: 'Observed impact that passed the configured verification and attribution controls.', unit: 'typed', version: 1 }),
  Object.freeze({ key: 'HealthyIntegration', meaning: 'Integration whose latest required execution is verified, fresh enough for its SLA and has no unresolved critical error.', unit: 'boolean', version: 1 }),
  Object.freeze({ key: 'AIInterpretation', meaning: 'AI-derived observation, hypothesis or recommendation that is not Business Truth until promoted by an authorized workflow.', unit: 'semantic', version: 1 }),
]);
