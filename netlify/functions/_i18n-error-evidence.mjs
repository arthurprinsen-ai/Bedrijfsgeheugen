// Privacy-safe diagnostic taxonomy for the existing translation error lineage.
// Never serialize provider messages, credentials, translated text, or tenant IDs.
const SAFE_REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function classifyI18nError(error) {
  if (error?.code === 'DATA_SOVEREIGNTY_AI_BLOCKED') {
    return Object.freeze({ failure_class: 'SOVEREIGNTY_DENIED', upstream_status: null });
  }
  const message = typeof error?.message === 'string' ? error.message : '';
  // Production OpenAI errors use OPENAI_PROVIDER_ERROR_<HTTP>:<details>.
  // Only parse the fixed adapter marker; never log provider details or request content.
  const openaiHttp = /^OPENAI_PROVIDER_ERROR_([45][0-9]{2})(?::|$)/.exec(message);
  if (openaiHttp) {
    return Object.freeze({ failure_class: 'UPSTREAM_HTTP_REJECTION', upstream_status: Number(openaiHttp[1]) });
  }
  // Disjoint, non-sensitive failure types allow the original owner to choose a
  // bounded recovery without confusing rate limiting with JSON/output failures.
  if (message === 'OPENAI_OUTPUT_BUDGET_EXHAUSTED') {
    return Object.freeze({ failure_class: 'OUTPUT_BUDGET_EXHAUSTED', upstream_status: null });
  }
  if (message === 'OPENAI_EMPTY_RESPONSE') {
    return Object.freeze({ failure_class: 'EMPTY_MODEL_RESPONSE', upstream_status: null });
  }
  if (message === 'OPENAI_REFUSAL') {
    return Object.freeze({ failure_class: 'MODEL_REFUSAL', upstream_status: null });
  }
  if (message === 'Translation response was not valid JSON') {
    return Object.freeze({ failure_class: 'TRANSLATION_INVALID_JSON', upstream_status: null });
  }
  if (message === 'Translation response shape mismatch') {
    return Object.freeze({ failure_class: 'TRANSLATION_SHAPE_MISMATCH', upstream_status: null });
  }
  const match = /^\s*([45][0-9]{2})(?:\s|$)/.exec(message);
  if (match) {
    return Object.freeze({ failure_class: 'UPSTREAM_HTTP_REJECTION', upstream_status: Number(match[1]) });
  }
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
    return Object.freeze({ failure_class: 'UPSTREAM_TIMEOUT', upstream_status: null });
  }
  return Object.freeze({ failure_class: 'TRANSLATION_RUNTIME_OR_SHAPE', upstream_status: null });
}

export function reportI18nError({ error, requestId, dataClass, log = console.error }) {
  const diagnosis = classifyI18nError(error);
  const event = Object.freeze({
    event: 'i18n_translation_failure',
    incident_lineage: 'netlify|production-i18n-translate|http-502|20261022-v1',
    request_id: typeof requestId === 'string' && SAFE_REQUEST_ID.test(requestId) ? requestId : null,
    data_class: dataClass === 'Confidential' ? 'Confidential' : 'Public',
    ...diagnosis,
  });
  try { log(JSON.stringify(event)); } catch { /* Diagnostic transport cannot alter the original failure response. */ }
  return event;
}
