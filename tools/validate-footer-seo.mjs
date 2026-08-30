import { readFile, access } from 'node:fs/promises';

const normRoute = r => {
  const x = String(r || '').split('#')[0].split('?')[0] || '/';
  return x === '/' ? '/' : x.replace(/\/$/, '');
};
const normText = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().toLowerCase();

export function extractFooterLinks(footerHtml) {
  return [...String(footerHtml).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1].trim(), text: normText(m[2]) }));
}

async function fileExists(path) { try { await access(path); return true; } catch { return false; } }

export async function loadRouteSet() {
  const redirects = await readFile('_redirects', 'utf8').catch(() => '');
  const set = new Set(['/']);
  for (const line of redirects.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const from = s.split(/\s+/)[0];
    if (from?.startsWith('/') && !from.includes(':')) set.add(normRoute(from));
  }
  return { set, async exists(route) {
    const r = normRoute(route);
    if (set.has(r)) return true;
    if (r === '/') return await fileExists('index.html');
    const clean = r.replace(/^\//, '');
    return await fileExists(`${clean}.html`) || await fileExists(`${clean}/index.html`);
  }};
}

export async function validateFooterSeo({ footerHtml, contract, seo, routeExists } = {}) {
  const footer = footerHtml ?? await readFile(contract?.canonicalSource || '.github/canoniek/voet.html', 'utf8');
  const c = contract ?? JSON.parse(await readFile('site/footer-contract.json', 'utf8'));
  const s = seo ?? JSON.parse(await readFile('site/seo-baseline.json', 'utf8'));
  const routes = routeExists ? null : await loadRouteSet();
  const exists = routeExists || (r => routes.exists(r));
  const links = extractFooterLinks(footer);
  const errors = [];
  const internal = links.filter(x => x.href.startsWith('/'));

  for (const link of links) {
    if (!link.href || /^javascript:/i.test(link.href) || link.href === '#') errors.push(`FOOTER_SEO_ERROR href=${link.href || 'empty'} rule=invalid-destination`);
  }
  for (const link of internal) {
    if (!(await exists(link.href))) errors.push(`FOOTER_SEO_ERROR href=${link.href} rule=dead-route`);
  }
  const hrefs = new Set(internal.map(x => normRoute(x.href)));
  for (const route of c.strategicDestinations) {
    if (!hrefs.has(normRoute(route))) errors.push(`FOOTER_SEO_ERROR href=${route} rule=missing-strategic-destination`);
  }
  for (const required of ['/privacy','/contact']) {
    if (!hrefs.has(required)) errors.push(`FOOTER_SEO_ERROR href=${required} rule=missing-trust-link`);
  }

  const ownerPairs = s.keywordOwners || [];
  const seenKeywords = new Map();
  for (const item of ownerPairs) {
    const k = normText(item.keyword);
    const route = normRoute(item.route);
    if (seenKeywords.has(k) && seenKeywords.get(k) !== route) errors.push(`FOOTER_SEO_ERROR href=${route} keyword=${k} rule=duplicate-keyword-owner`);
    seenKeywords.set(k, route);
    for (const link of internal) {
      if (link.text === k && normRoute(link.href) !== route) errors.push(`FOOTER_SEO_ERROR href=${link.href} keyword=${k} rule=exact-anchor-wrong-owner`);
    }
  }
  if ((footer.match(/class=["'][^"']*\bbgvoet\b/gi) || []).length !== 1) errors.push('FOOTER_SEO_ERROR rule=canonical-footer-identity');
  return errors;
}

if (process.argv[1]?.endsWith('validate-footer-seo.mjs')) {
  const errors = await validateFooterSeo();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('Canonical footer SEO contract OK');
}
