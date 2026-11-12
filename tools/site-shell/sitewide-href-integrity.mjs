/**
 * Read-only rendered href contract for the EXISTING full-site website browser gate.
 * This is not a crawler, publisher or new scheduler. Missing routes/unsafe anchors
 * fail the existing protected gate; HTTP/redirect truth remains a separate live check.
 */
import { PUBLIC_UTILITY_ROUTES } from './contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const NON_INDEXED_ROUTE = new Set([...PUBLIC_UTILITY_ROUTES,'/portal-v2','/klantportaal','/aanmelden','/offerte','/bedankt',
  // Both NL and EN checkout routes are real, independently browser-tested,
  // and deliberately noindex; they must not appear in the SEO sitemap.
  '/afsluiten','/en/afsluiten','/pakketadvies']);
const NON_INDEXED_PREFIX = ['/api/','/.netlify/','/assets/','/fonts/','/images/','/img/','/portal-v2/'];
const PUBLIC_ASSET = /\.(?:pdf|png|jpe?g|webp|gif|avif|svg|css|m?js|json|xml|txt|zip|ico|woff2?|ttf|eot|mp4|webm)$/i;

export function normalizedSeoRoute(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function auditRenderedHrefs({ route, hrefs, sitemapRoutes, expectedCount, origin=ORIGIN }) {
  if (!Array.isArray(hrefs) || !Array.isArray(sitemapRoutes))
    throw new TypeError('HREF_AUDIT_SOURCE_LIST_REQUIRED');
  const failures=[];
  const allowed=new Set(sitemapRoutes.map(normalizedSeoRoute));
  if (!allowed.has(normalizedSeoRoute(route)))
    failures.push('SOURCE_ROUTE_NOT_IN_FINAL_SITEMAP');
  if (!Number.isInteger(expectedCount) || expectedCount!==hrefs.length)
    failures.push('HREF_INVENTORY_INCOMPLETE');
  let internal=0,external=0;
  const seen=new Set();
  for (const [index,raw] of hrefs.entries()) {
    const href=typeof raw==='string' ? raw.trim() : '';
    if (!href || href==='#') {
      failures.push('EMPTY_OR_PLACEHOLDER_HREF:'+index);
      continue;
    }
    if (/\s/.test(href) || href.includes('\\') || href.startsWith('//')) {
      failures.push('INVALID_OR_SCHEME_RELATIVE_HREF:'+index);
      continue;
    }
    if (href.startsWith('#')) continue;
    if (/^(?:mailto|tel):/i.test(href)) continue;
    if (/^(?:javascript|data|file|vbscript):/i.test(href) || /^http:\/\//i.test(href)) {
      failures.push('UNSAFE_OR_HTTP_HREF:'+index);
      continue;
    }
    if (!href.startsWith('/') && !/^https:\/\//i.test(href)) {
      failures.push('NONCANONICAL_RELATIVE_HREF:'+index);
      continue;
    }
    let url;
    try { url=new URL(href,origin); } catch {
      failures.push('UNPARSEABLE_HREF:'+index);
      continue;
    }
    if (url.protocol!=='https:' || url.username || url.password) {
      failures.push('UNSAFE_HREF_OR_CREDENTIALS:'+index);
      continue;
    }
    if (url.origin!==origin) {
      if (url.hostname==='bedrijfsgeheugen.nl')
        failures.push('NONCANONICAL_FIRST_PARTY_HOST:'+index);
      else external++;
      continue;
    }
    const path=normalizedSeoRoute(url.pathname);
    internal++;
    if (PUBLIC_ASSET.test(path) || NON_INDEXED_ROUTE.has(path)
      || NON_INDEXED_PREFIX.some(prefix=>url.pathname.startsWith(prefix))) continue;
    if (!allowed.has(path)) {
      const finding='INTERNAL_TARGET_NOT_IN_FINAL_SITEMAP:'+path;
      if (!seen.has(finding)) failures.push(finding);
      seen.add(finding);
    }
  }
  return {pageRoute:route,hrefsChecked:hrefs.length,internal,external,failures};
}
