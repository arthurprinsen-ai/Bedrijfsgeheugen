import { readFileSync, existsSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const catalog = JSON.parse(read('site/website-catalog.json'));
const nav = JSON.parse(read('site/navigation-baseline.json'));
const routes = new Map(catalog.routes.map(r => [r.route, r]));

function normalizeRoute(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw, 'https://www.bedrijfsgeheugen.nl');
    if (!['www.bedrijfsgeheugen.nl','bedrijfsgeheugen.nl'].includes(u.hostname)) return null;
    let p = u.pathname || '/';
    if (p !== '/' && p.endsWith('/') && !p.startsWith('/blog/')) p = p.slice(0,-1);
    return p;
  } catch { return null; }
}

const discovered = new Set(['/']);
for (const m of read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const r = normalizeRoute(m[1]);
  if (r) discovered.add(r);
}
for (const item of [...(nav.primary || []), ...(nav.account || []), nav.cta].filter(Boolean)) discovered.add(item.href);
for (const m of read('assets/recovered-page-shell.js').matchAll(/href=\\?"([^"#]+)\\?"/g)) {
  const r = normalizeRoute(m[1]);
  if (r) discovered.add(r);
}

const errors = [];
for (const route of [...discovered].sort()) if (!routes.has(route)) errors.push(`UNCATALOGUED ${route}`);
for (const item of catalog.routes) {
  if (!item.file || !existsSync(item.file)) errors.push(`MISSING_FILE ${item.route} -> ${item.file || '(none)'}`);
  if (!Array.isArray(item.sources) || !item.sources.length) errors.push(`NO_SOURCE ${item.route}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`website catalog OK: ${catalog.routes.length} catalogued routes, ${discovered.size} discovered routes`);
