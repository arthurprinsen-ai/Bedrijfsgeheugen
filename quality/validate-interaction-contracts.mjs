const SUPPORTED_VIEWPORTS = new Set(['desktop', 'mobile']);

function error(code, id, field, message) {
  return { code, id: id || '<missing>', field, message };
}

export function validateInteractionContracts(contracts, options = {}) {
  const errors = [];
  if (!Array.isArray(contracts) || contracts.length === 0) {
    return { ok: false, errors: [error('contract-incomplete', '<registry>', 'contracts', 'interaction contract registry must contain at least one contract')] };
  }

  const seen = new Set();
  for (const contract of contracts) {
    const id = contract?.id;
    if (!id) errors.push(error('contract-incomplete', id, 'id', 'contract id is required'));
    if (id && seen.has(id)) errors.push(error('contract-duplicate', id, 'id', `duplicate interaction contract id: ${id}`));
    if (id) seen.add(id);

    for (const field of ['route', 'root']) {
      if (typeof contract?.[field] !== 'string' || contract[field].trim() === '') {
        errors.push(error('contract-incomplete', id, field, `${field} is required`));
      }
    }

    if (!Array.isArray(contract?.viewports) || contract.viewports.length === 0) {
      errors.push(error('contract-incomplete', id, 'viewports', 'at least one viewport is required'));
    } else {
      for (const viewport of contract.viewports) {
        if (!SUPPORTED_VIEWPORTS.has(viewport)) {
          errors.push(error('contract-invalid-viewport', id, 'viewports', `unsupported viewport: ${viewport}`));
        }
      }
    }

    if (!Array.isArray(contract?.states) || contract.states.length === 0) {
      errors.push(error('contract-incomplete', id, 'states', 'at least one state is required'));
    }

    if (!Array.isArray(contract?.triggers) || contract.triggers.length === 0) {
      errors.push(error('contract-incomplete', id, 'triggers', 'at least one trigger is required'));
    }

    if (!contract?.hooks || typeof contract.hooks !== 'object') {
      errors.push(error('contract-incomplete', id, 'hooks', 'hooks are required'));
    } else {
      for (const field of ['state', 'step', 'overlay']) {
        if (typeof contract.hooks[field] !== 'string' || contract.hooks[field].trim() === '') {
          errors.push(error('contract-incomplete', id, `hooks.${field}`, `hooks.${field} is required`));
        }
      }
    }
  }

  if (options.requireUniqueRoutes === true) {
    const routes = new Set();
    for (const contract of contracts) {
      const key = `${contract.route}::${contract.root}`;
      if (routes.has(key)) errors.push(error('contract-duplicate-target', contract.id, 'root', `duplicate route/root target: ${key}`));
      routes.add(key);
    }
  }

  return { ok: errors.length === 0, errors };
}
