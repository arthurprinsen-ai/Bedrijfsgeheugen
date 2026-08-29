export function createQueryGateway({ views = new Map(), authorize }) {
  if (typeof authorize !== 'function') throw new TypeError('authorize function is required');
  return Object.freeze({
    async get({ tenantId, subjectId, viewName, resourceType = 'ReadModel', resourceId = viewName, context = {} }) {
      if (!tenantId || !subjectId || !viewName) throw new TypeError('tenantId, subjectId and viewName are required');
      const decision = await authorize({ tenantId, subjectId, action: 'VIEW', resourceType, resourceId, ...context });
      if (decision?.decision !== 'ALLOW') {
        const error = new Error(`query denied: ${decision?.reason ?? 'policy'}`);
        error.code = 'QUERY_DENIED';
        throw error;
      }
      const provider = views instanceof Map ? views.get(viewName) : views[viewName];
      if (typeof provider !== 'function') throw new Error(`unknown read model: ${viewName}`);
      const result = await provider({ tenantId, subjectId, context });
      return Object.freeze({ ...result, permissionFiltered: true });
    },
  });
}
