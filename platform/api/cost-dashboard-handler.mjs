import { createDashboardProjection } from '../cost/dashboard-projection.mjs';

const SECURITY_HEADERS = Object.freeze({
  'cache-control': 'private, no-store',
  'vary': 'authorization, cookie',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
});

function json(body, status, extraHeaders = {}) {
  return Response.json(body, { status, headers: { ...SECURITY_HEADERS, ...extraHeaders } });
}

export function createCostDashboardHandler({ getUser, store, now = () => new Date().toISOString() } = {}) {
  if (typeof getUser !== 'function') throw new TypeError('getUser is required');
  if (typeof store?.get !== 'function') throw new TypeError('store.get is required');

  return async function handle(request) {
    if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405, { allow: 'GET' });
    const user = await getUser();
    if (!user?.id) return json({ error: 'UNAUTHORIZED' }, 401);
    const roles = Array.isArray(user.roles)
      ? user.roles
      : Array.isArray(user.appMetadata?.roles)
        ? user.appMetadata.roles
        : Array.isArray(user.app_metadata?.roles)
          ? user.app_metadata.roles
          : [];
    if (!roles.includes('powerhouse-cost-admin')) return json({ error: 'FORBIDDEN' }, 403);
    const record = await store.get();
    if (!record) return json({ error: 'NOT_FOUND' }, 404);
    return json(createDashboardProjection(record, { now }), 200);
  };
}

export { SECURITY_HEADERS as COST_DASHBOARD_SECURITY_HEADERS };
