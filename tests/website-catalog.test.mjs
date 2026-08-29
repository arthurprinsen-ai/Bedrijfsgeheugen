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
  assert.match(menu, /href:\s*'\/partners'[\s\S]*label:\s*'Partners'/, 'Meer must contain Partners as shown in the accepted V18 site');
});

test('desktop and directory preserve the accepted Meer information architecture', () => {
  const shell = read('assets/recovered-page-shell.js');
  const more = read('meer.html');
  assert.match(shell, />Meer</, 'desktop shared header must expose Meer');
  for (const href of ['/meer','/over-ons','/hoe-het-werkt','/partners']) {
    assert.ok(shell.includes(`href=\"${href}\"`), `desktop Meer must expose ${href}`);
  }
  assert.match(more, /Alles rond Bedrijfsgeheugen op één plek\./);
  assert.match(more, /Van organisatie en kennis tot vertrouwen, support en praktische hulpmiddelen\./);
  assert.match(more, /Wie we zijn en hoe we werken/);
  for (const heading of ['Bedrijf','Voor wie','Scans & meten','Kennis & vertrouwen','AI & groei','Koppelingen']) {
    assert.ok(more.includes(heading), `Meer must contain desktop group ${heading}`);
  }
  for (const href of ['/over-ons','/hoe-het-werkt','/partners','/voor-mkb','/investeerders-ma','/frisse-blik','/zelfscan','/ai-scan','/afmaakindex','/monitor','/benchmark','/kennis','/blog/','/ai-act','/data-soevereiniteit','/ai-adoptie','/ai-marketing-mkb','/ai-capability-model','/afas-koppeling','/exact-online-koppeling','/twinfield-koppeling','/webshop-koppeling','/api-koppeling-laten-maken']) {
    assert.ok(more.includes(`href=\"${href}\"`), `Meer directory must expose ${href}`);
  }
  assert.ok(routes.has('/meer'), '/meer must be in the website catalog');
  assert.ok(routes.has('/partners'), '/partners must be in the website catalog');
});
