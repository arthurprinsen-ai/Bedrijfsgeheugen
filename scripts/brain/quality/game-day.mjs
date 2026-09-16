const ALLOWED = new Set(['provider_outage', 'timeout', 'stale_data', 'duplicate_event', 'expired_token', 'partial_write']);

export function planSafeFaultScenario({ fault, environment = 'staging', destructive = false } = {}) {
  if (!ALLOWED.has(fault)) return { status: 'REJECTED', reason: 'unsupported_fault' };
  if (environment === 'production' && destructive) return { status: 'REJECTED', reason: 'destructive_production_fault_injection_forbidden' };
  return {
    status: 'READY',
    fault,
    environment,
    mode: environment === 'production' ? 'synthetic_non_destructive_shadow' : 'isolated_fault_injection',
    requires_cleanup: environment !== 'production',
    production_destructive: false,
  };
}
