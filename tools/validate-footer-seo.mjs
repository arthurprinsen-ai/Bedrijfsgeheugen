import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const clean = value => value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = value => clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const routeNorm = route => route === '/' ? '/' : `/${route.replace(/^\/|\/$/g, '')}`;

export function extractFooterLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1].trim(), text: clean(m[2]) }));
}

function error({ file = '.github/canoniek/voet.html', href = 'none', keyword = 'none', rule }) {
  return `FOOTER_SEO_ERROR file=${file} href=${href || 'empty'} keyword=${keyword} rule=${rule}`;
}

export async function validateFooterSeo({ footerHtml, contract, seo, routeExists }) {
  const errors = [];
  const links = extractFooterLinks(footerHtml);
  const internal = links.filter(x => x.href.startsWith('/'));
  const internalRoutes = new Set(internal.map(x => routeNorm(x.href)));
  for (const link of links) {
    if (!link.href || /^javascript:/i.test(link.href) || link.href === '#') {
      errors.push(error({ href: link.href, rule: 'unsafe-or-empty-href' }));
      continue;
    }
    if (link.href.startsWith('/') && !(await routeExists(routeNorm(link.href)))) {
      errors.push(error({ href: link.href, rule: 'dead-route' }));
    }
  }
  for (const route of contract.strategicDestinations) {
    if (!internalRoutes.has(routeNorm(route))) errors.push(error({ href: route, rule: 'missing-strategic-destination' }));
  }
  for (const required of ['/privacy', '/contact']) {
    if (!internalRoutes.has(required)) errors.push(error({ href: required, rule: 'missing-trust-link' }));
  }
  const owners = seo.keywordOwners || [];
  for (const link of internal) {
    const anchor = norm(link.text);
    for (const owner of owners) {
      if (anchor === norm(owner.keyword) && routeNorm(link.href) !== routeNorm(owner.route)) {
        errors.push(error({ href: link.href, keyword: owner.keyword, rule: 'exact-anchor-wrong-owner' }));
      }
    }
  }
  const seenKeywords = new Map();
  for (const owner of owners) {
    const keyword = norm(owner.keyword);
    const route = routeNorm(owner.route);
    if (seenKeywords.has(keyword) && seenKeywords.get(keyword) !== route) {
      errors.push(error({ href: owner.route, keyword: owner.keyword, rule: 'duplicate-keyword-owner' }));
    }
    seenKeywords.set(keyword, route);
  }
  return errors;
}

export async function defaultRouteExists(route, root = process.cwd()) {
  if (route === '/') return existsSync(join(root, 'index.html'));
  if (route === '/blog') return existsSync(join(root, 'blog', 'index.html'));
  const path = route.replace(/^\//, '');
  if (existsSync(join(root, `${path}.html`)) || existsSync(join(root, path, 'index.html'))) return true;
  const redirects = existsSync(join(root, '_redirects')) ? readFileSync(join(root, '_redirects'), 'utf8') : '';
  return redirects.split(/\r?\n/).some(line => line.trim().split(/\s+/)[0] === route);
}

export async function runFooterSeoValidation(root = process.cwd()) {
  const contract = JSON.parse(readFileSync(join(root, 'site/footer-contract.json'), 'utf8'));
  const seo = JSON.parse(readFileSync(join(root, 'site/seo-baseline.json'), 'utf8'));
  const footerHtml = readFileSync(join(root, contract.canonicalSource), 'utf8');
  const errors = await validateFooterSeo({ footerHtml, contract, seo, routeExists: route => defaultRouteExists(route, root) });
  if (errors.length) {
    console.error(errors.join('\n'));
    return 1;
  }
  console.log(`Canonical footer SEO contract OK (${extractFooterLinks(footerHtml).length} links)`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = await runFooterSeoValidation();
