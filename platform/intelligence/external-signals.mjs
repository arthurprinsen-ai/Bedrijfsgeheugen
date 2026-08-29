export function createExternalSignal(input) {
  for (const field of ['id','tenantId','source','domain','observedAt','summary']) if (!input?.[field]) throw new TypeError(`${field} is required`);
  return Object.freeze({
    id:input.id, tenantId:input.tenantId, source:input.source, domain:input.domain, observedAt:input.observedAt,
    summary:input.summary, sourceTrust:Number(input.sourceTrust ?? 0), corroboration:Number(input.corroboration ?? 0), freshness:Number(input.freshness ?? 0),
    matchedObjectIds:Object.freeze([...(input.matchedObjectIds ?? [])]), relevance:Number(input.relevance ?? 0),
  });
}

export function canSurfaceExternally(signal, threshold = 0.6) {
  const contextual = signal.matchedObjectIds.length > 0;
  const confidence = signal.sourceTrust * 0.35 + signal.corroboration * 0.25 + signal.freshness * 0.15 + signal.relevance * 0.25;
  return Object.freeze({ allowed:contextual && confidence >= threshold, confidence, reason: contextual ? 'CONTEXT_MATCHED' : 'NO_COMPANY_CONTEXT' });
}
