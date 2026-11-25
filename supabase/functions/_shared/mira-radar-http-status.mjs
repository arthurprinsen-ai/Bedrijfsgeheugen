// HTTP is the observable delivery ACK for the EXISTING Mira radar pg_net caller.
// A cron '1 row' proves enqueue only, not source readiness or the HTTP outcome.
// Keep JSON recovery evidence and ONE BRAIN failure registration in the caller.
export function classifyMiraRadarHttpStatus({ sourceReady, errors = [] } = {}) {
  if (Array.isArray(errors) && errors.length > 0) return 502;
  if (sourceReady === true) return 200;
  return 503;
}
