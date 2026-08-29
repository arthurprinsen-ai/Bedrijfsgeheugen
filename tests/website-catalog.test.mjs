import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');
const catalog = JSON.parse(read('site/website-catalog.json'));
const nav = JSON.parse(read('site/navigation-baseline.json'));
const routes = new Map(catalog.routes.map(r => [r.route, r]));

function normalizeRoute(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw, 'https://www.bedrijfsgeheugen.nl');
    if (u.hostname !== 'www.bedrijfsgeheugen.nl' && u.hostname !== 'bedrijfsgeheugen.nl') return null;
    let p = u.pathname || '/';
    if (p !== '/' && p.endsWith('/') && !p.startsWith('/blog/')) p = p.slice(0, -1);
    return p;
  } catch { return null; }
}

function discoveredRoutes() {
  const found = new Set(['/']);
  const sitemap = read('sitemap.xml');
  for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const route = normalizeRoute(m[1]);
    if (route) found.add(route);
  }
  for (const item of [...(nav.primary || []), ...(nav.account || []), nav.cta].filter(Boolean)) found.add(item.href);
  const shell = read('assets/recovered-page-shell.js');
  for (const m of shell.matchAll(/href=\\?"([^"#]+)\\?"/g)) {
    const route = normalizeRoute(m[1]);
    if (route) found.add(route);
  }
  return [...found].sort();
}

test('every discovered website route is explicitly catalogued', () => {
  const missing = discoveredRoutes().filter(route => !routes.has(route));
  assert.deepEqual(missing, [], `uncatalogued routes: ${missing.join(', ')}`);
});

test('catalog entries have explicit reconstruction state and evidence', () => {
  const allowed = new Set(['accepted-current','accepted-recovered','wrong-version','missing','legacy-review']);
  for (const item of catalog.routes) {
    assert.ok(item.route.startsWith('/'), `invalid route ${item.route}`);
    assert.ok(allowed.has(item.state), `${item.route} has invalid state ${item.state}`);
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.route} has no evidence source`);
    assert.ok(item.file, `${item.route} has no source file`);
  }
});

test('Meer preserves the company pages visible in the accepted V18 site', () => {
  const menu = read('assets/js/menu.js');
  assert.match(menu, /maakGroepKnop\('meer', 'Meer'\)/, 'Meer drilldown must remain in the mobile catalog');
  assert.match(menu, /href:\s*'\/over-ons'[\s\S]*label:\s*'Over ons'/, 'Meer must contain Over ons');
  assert.match(menu, /href:\s*'\/hoe-het-werkt'[\s\S]*label:\s*'Werkwijze'/, 'Meer must contain Werkwijze');
  assert.match(menu, /label:\s*'Partners'/, 'Meer must contain Partners as shown in the accepted V18 site');
});
