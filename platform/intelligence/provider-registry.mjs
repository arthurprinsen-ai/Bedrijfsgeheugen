export function createProviderRegistry(entries = []) {
  const byId = new Map();
  for (const entry of entries) {
    if (!entry?.id || !entry?.provider || !entry?.model || !Array.isArray(entry.allowedDataClasses) || !Array.isArray(entry.allowedPurposes)) {
      throw new TypeError('provider entry requires id, provider, model, allowedDataClasses and allowedPurposes');
    }
    if (entry.trainingAllowed === true) throw new TypeError('training on customer data cannot be enabled');
    if (entry.persistentProviderMemory === true) throw new TypeError('persistent provider memory cannot be enabled');
    byId.set(entry.id, Object.freeze({ trainingAllowed: false, persistentProviderMemory: false, ...entry }));
  }
  return Object.freeze({
    get(id) { return byId.get(id) ?? null; },
    assertAllowed({ id, dataClass, purpose }) {
      const entry = byId.get(id);
      if (!entry) throw new Error('AI provider/model is not registered');
      if (!entry.allowedDataClasses.includes(dataClass)) throw new Error(`data class ${dataClass} is not allowed for provider/model ${id}`);
      if (!entry.allowedPurposes.includes(purpose)) throw new Error(`purpose ${purpose} is not allowed for provider/model ${id}`);
      if (entry.status !== 'Approved') throw new Error(`provider/model ${id} is not approved`);
      return entry;
    },
  });
}
