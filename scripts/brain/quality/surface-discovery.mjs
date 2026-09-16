const unique = items => [...new Map(items.map(item => [item.id, item])).values()].sort((a, b) => a.id.localeCompare(b.id));

function add(matches, type, name, source) {
  const normalized = String(name || '').trim().replace(/[;,{].*$/, '');
  if (!normalized) return;
  matches.push({ id: `${type}:${normalized}`, type, name: normalized, provenance: [source] });
}

export function discoverQualitySurfaces({ files = [] } = {}) {
  const matches = [];
  for (const file of files) {
    const source = String(file?.path || '');
    const content = String(file?.content || '');
    if (/\.html?$/i.test(source) && /^(site|portal-v2|public)\//.test(source)) {
      const relative = source.replace(/^(site|portal-v2|public)\//, '').replace(/index\.html?$/i, '').replace(/\.html?$/i, '');
      add(matches, 'route', `/${relative}`.replace(/\/$/, '') || '/', source);
    }
    for (const match of content.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) add(matches, 'rpc', match[1], source);
    const fn = source.match(/^supabase\/functions\/([^/]+)\//);
    if (fn) add(matches, 'function', fn[1], source);
    const netlify = source.match(/^netlify\/functions\/([^/]+)\.(?:mjs|js|ts)$/);
    if (netlify && !netlify[1].startsWith('_')) add(matches, 'netlify_function', netlify[1], source);
    for (const match of content.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_."]+)/gi)) add(matches, 'table', match[1].replaceAll('"', ''), source);
    for (const match of content.matchAll(/create\s+policy\s+([a-zA-Z0-9_"]+)/gi)) add(matches, 'permission', match[1].replaceAll('"', ''), source);
    if (/openapi|swagger/i.test(source) || /(^|\n)paths\s*:/m.test(content)) {
      for (const match of content.matchAll(/^\s{0,8}(\/[^:\s]+)\s*:/gm)) add(matches, 'api', match[1], source);
      for (const match of content.matchAll(/["'](\/[^"']+)["']\s*:/g)) add(matches, 'api', match[1], source);
    }
  }
  return unique(matches);
}

export function buildDiscoveryObligations({ discovered = [], registeredSurfaces = [], evidence = [] } = {}) {
  const registered = new Map(registeredSurfaces.map(item => [item.id, item]));
  const proof = new Map(evidence.map(item => [item.surface_id || item.id, item]));
  return discovered.flatMap(surface => {
    if (!registered.has(surface.id)) return [{ surface_id: surface.id, type: surface.type, state: 'NOT_REGISTERED', reason: 'discovered_surface_has_no_evidence_contract' }];
    const observed = proof.get(surface.id);
    if (!observed || observed.state !== 'GREEN') return [{ surface_id: surface.id, type: surface.type, state: 'UNTESTED', reason: observed ? `evidence_${String(observed.state).toLowerCase()}` : 'registered_surface_has_no_green_evidence' }];
    return [];
  });
}
