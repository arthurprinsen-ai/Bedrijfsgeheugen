// Privacy-safe diagnostic taxonomy for the existing translation error lineage.
// Never serialize provider messages, credentials, translated text, or tenant IDs.
const SAFE_REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function classifyI18nError(error) {
  if (error?.code === 'DATA_SOVEREIGNTY_AI_BLOCKED') {
    return Object.freeze({ failure_class: 'SOVEREIGNTY_DENIED', upstream_status: null });
  }
  const message = typeof error?.message === 'string' ? error.message : '';
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
