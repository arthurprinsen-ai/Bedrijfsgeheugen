export function createAssessmentResponse({ id, tenantId, scanVersion, questionId, answer, submittedAt, sourceRef }) {
  for (const field of ['id','tenantId','scanVersion','questionId','submittedAt','sourceRef']) if (!arguments[0]?.[field]) throw new TypeError(`${field} is required`);
  return Object.freeze({ id, tenantId, type:'Response', scanVersion, questionId, answer, submittedAt, immutable:true, provenance:Object.freeze({ sourceType:'frisse-blik', sourceRef }) });
}

export function createScanScore({ tenantId, scanVersion, scoreModelVersion, score, calculatedAt, responseIds }) {
  if (!tenantId || !scanVersion || !scoreModelVersion || typeof score !== 'number' || !calculatedAt) throw new TypeError('scan score requires tenantId, scanVersion, scoreModelVersion, score and calculatedAt');
  return Object.freeze({ tenantId, scanVersion, scoreModelVersion, score, calculatedAt, responseIds:Object.freeze([...(responseIds ?? [])]) });
}
