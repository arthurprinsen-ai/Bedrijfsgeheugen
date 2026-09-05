import { readFile } from 'node:fs/promises';

export const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const ROLES = new Set(['pillar', 'money', 'support', 'blog-index', 'article']);
const FUNNEL = new Set(['discover', 'consider', 'decide']);
const SCHEMA = new Set(['WebPage', 'Service', 'CollectionPage', 'Article']);

function isAbsoluteInternalUrl(value) {
  return typeof value === 'string' && (value === `${ORIGIN}/` || value.startsWith(`${ORIGIN}/`));
}

function normaliseer(value) {
  return String(value ?? '').trim().toLocaleLowerCase('nl-NL');
}

function claimKeyword(claims, phrase, route, label, fouten) {
  const keyword = normaliseer(phrase);
  if (!keyword) return;
  const owner = claims.get(keyword);
  if (owner && owner.route !== route) {
    fouten.push(`${label}: keyword-cluster collision; "${phrase}" is al owned door ${owner.route}`);
    return;
  }
  if (!owner) claims.set(keyword, { route, label });
}

export function validateRegistry(registry) {
  const fouten = [];
  if (!registry || typeof registry !== 'object') return ['registry moet een object zijn'];
  if (!Number.isInteger(registry.version) || registry.version < 1) fouten.push('registry.version moet een positief geheel getal zijn');
  if (!Array.isArray(registry.pages) || registry.pages.length === 0) {
    fouten.push('registry.pages moet minimaal één pagina bevatten');
    return fouten;
  }

  const intents = new Map();
  const keywords = new Map();
  const keywordClaims = new Map();
  const routes = new Set();

  for (const [index, entry] of registry.pages.entries()) {
    const label = `pages[${index}]`;
    const route = entry?.route || label;
    if (!isAbsoluteInternalUrl(entry?.route)) fouten.push(`${label}.route moet absolute Bedrijfsgeheugen URL zijn`);
    else if (routes.has(entry.route)) fouten.push(`${label}.route duplicate: ${entry.route}`);
    else routes.add(entry.route);

    if (!ROLES.has(entry?.role)) fouten.push(`${label}.role is ongeldig`);
    if (!FUNNEL.has(entry?.funnel_stage)) fouten.push(`${label}.funnel_stage is ongeldig`);
    if (!SCHEMA.has(entry?.schema_type)) fouten.push(`${label}.schema_type is ongeldig`);

    const intent = normaliseer(entry?.primary_intent);
    if (!intent) fouten.push(`${label}.primary_intent is verplicht`);
    else if (intents.has(intent)) fouten.push(`${label}: duplicate primary_intent met ${intents.get(intent)}`);
    else intents.set(intent, entry.route || label);

    const keyword = normaliseer(entry?.primary_keyword);
    if (!keyword) fouten.push(`${label}.primary_keyword is verplicht`);
    else if (keywords.has(keyword)) fouten.push(`${label}: duplicate primary_keyword met ${keywords.get(keyword)}`);
    else keywords.set(keyword, entry.route || label);

    claimKeyword(keywordClaims, entry?.primary_keyword, route, `${label}.primary_keyword`, fouten);

    if (!Array.isArray(entry?.secondary_keywords)) fouten.push(`${label}.secondary_keywords moet een array zijn`);
    else for (const secondary of entry.secondary_keywords) {
      claimKeyword(keywordClaims, secondary, route, `${label}.secondary_keywords`, fouten);
    }

    if (!entry?.primary_cta || typeof entry.primary_cta !== 'object') fouten.push(`${label}.primary_cta is verplicht`);
    else {
      if (!String(entry.primary_cta.action || '').trim()) fouten.push(`${label}.primary_cta.action is verplicht`);
      if (!isAbsoluteInternalUrl(entry.primary_cta.url)) fouten.push(`${label}.primary_cta.url moet absolute Bedrijfsgeheugen URL zijn`);
    }

    if (!Array.isArray(entry?.supporting_routes)) fouten.push(`${label}.supporting_routes moet een array zijn`);
    else for (const supportingRoute of entry.supporting_routes) {
      if (!isAbsoluteInternalUrl(supportingRoute)) fouten.push(`${label}.supporting_routes moeten absolute Bedrijfsgeheugen URLs zijn`);
    }
  }

  return [...new Set(fouten)];
}

export async function loadRegistry(path = 'site/seo-order-map.json') {
  const registry = JSON.parse(await readFile(path, 'utf8'));
  const fouten = validateRegistry(registry);
  if (fouten.length) throw new Error(`SEO intent registry ongeldig (${fouten.length}):\n- ${fouten.join('\n- ')}`);
  return registry;
}

export function entryForCanonical(url, registry) {
  const pages = registry?.pages || [];
  return pages.find(entry => entry.route === url) || null;
}

export function moneyEntries(registry) {
  return (registry?.pages || []).filter(entry => entry.role === 'money');
}
