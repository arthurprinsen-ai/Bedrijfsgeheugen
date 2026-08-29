const PERSISTABLE_TYPES = new Set(['Finding','Recommendation','Risk','Opportunity','Learning']);

export function validateAIResult({ result, allowPersistence = false }) {
  if (!result || typeof result !== 'object') throw new TypeError('AI result is required');
  if (!result.type || !result.provenance || !result.confidence) throw new TypeError('AI result requires type, provenance and confidence');
  if (result.containsRestrictedData === true) throw new Error('AI result contains restricted data');
  if (result.containsUnexpectedPII === true) throw new Error('AI result contains unexpected PII');
  if (allowPersistence && !PERSISTABLE_TYPES.has(result.type)) throw new Error(`AI result type ${result.type} cannot persist`);
  return Object.freeze({ ...result, truthClass: 'AIInterpretation', persistenceAllowed: Boolean(allowPersistence), validated: true });
}
