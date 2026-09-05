import { ORIGIN } from './registry.mjs';

export const CANONICAL_ALIASES = new Map([
  [`${ORIGIN}/blog/afas-koppeling/`, `${ORIGIN}/afas-koppeling`],
  [`${ORIGIN}/blog/afas-koppeling`, `${ORIGIN}/afas-koppeling`],
]);

function visibleHtml(input) {
  return String(input || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, '');
}

function linksFromHtml(html) {
  const urls = [];
  for (const m of visibleHtml(html).matchAll(/<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
    const href = m[1] ?? m[2] ?? '';
    if (!href.startsWith(`${ORIGIN}/`)) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (clean) urls.push(clean);
  }
  return urls;
}

export function buildLinkGraph(pages) {
  const outbound = new Map();
  const inbound = new Map();
  const pageMap = new Map();

  for (const page of pages || []) {
    if (!page?.canonical) continue;
    pageMap.set(page.canonical, page);
    if (!outbound.has(page.canonical)) outbound.set(page.canonical, new Set());
    if (!inbound.has(page.canonical)) inbound.set(page.canonical, new Set());
  }

  for (const page of pages || []) {
    if (!page?.canonical) continue;
    const targets = outbound.get(page.canonical) || new Set();
    for (const target of linksFromHtml(page.html)) {
      if (target === page.canonical) continue;
      targets.add(target);
      if (!inbound.has(target)) inbound.set(target, new Set());
      inbound.get(target).add(page.canonical);
    }
    outbound.set(page.canonical, targets);
  }

  return { outbound, inbound, pageMap };
}

export function validateMoneyPages(pages, registry) {
  const fouten = [];
  const graph = buildLinkGraph(pages);
  const money = (registry?.pages || []).filter(entry => entry.role === 'money');

  for (const entry of money) {
    if (!graph.pageMap.has(entry.route)) {
      fouten.push(`${entry.route}: geregistreerde money page ontbreekt uit indexeerbare estate`);
      continue;
    }
    const inbound = graph.inbound.get(entry.route) || new Set();
    if (inbound.size === 0) fouten.push(`${entry.route}: money page is orphan; minimaal één andere indexeerbare pagina moet ernaar linken`);

    for (const support of entry.supporting_routes || []) {
      if (!graph.pageMap.has(support)) continue;
      const out = graph.outbound.get(support) || new Set();
      if (!out.has(entry.route)) fouten.push(`${support}: supporting route mist link naar money page ${entry.route}`);
    }
  }

  for (const [source, targets] of graph.outbound) {
    for (const target of targets) {
      const canonical = CANONICAL_ALIASES.get(target);
      if (canonical) fouten.push(`${source}: interne link gebruikt canonical alias ${target}; link rechtstreeks naar ${canonical}`);
    }
  }

  return fouten;
}
