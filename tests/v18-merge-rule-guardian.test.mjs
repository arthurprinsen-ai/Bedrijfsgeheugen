import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('site/v18-component-registry.json','utf8'));
const byRoute = new Map(registry.routes.map(entry => [entry.route, entry]));

const normalizeRoute = href => {
  const raw = href.split('#')[0].split('?')[0];
  if (!raw || raw === '#') return null;
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return null;
  if (raw.startsWith('/assets/') || raw === '/favicon.png' || raw === '/apple-touch-icon.png') return null;
  if (raw.startsWith('javascript:')) return 'INVALID_JAVASCRIPT';
  if (!raw.startsWith('/')) return null;
  if (raw === '/blog') return '/blog/';
  if (raw.endsWith('.html')) return raw.replace(/\.html$/, '') || '/';
  return raw;
};

const fileForRoute = route => {
  const entry = byRoute.get(route);
  return entry?.file ?? null;
};

test('fixed V18 → test merge rules remain encoded in source tags', () => {
  const sources = new Set(registry.routes.map(r => r.sourceTag));
  assert.deepEqual(sources, new Set(['source:v18-leading','source:production-preserved','source:new-v18-authored']));
  for (const entry of registry.routes) {
    if (entry.sourceTag === 'source:production-preserved') {
      assert.ok(fs.existsSync(entry.file), `productiepagina verdwenen: ${entry.route} -> ${entry.file}`);
    }
    if (entry.sourceTag === 'source:new-v18-authored') {
      const html = fs.readFileSync(entry.file, 'utf8');
      assert.ok(html.includes('/assets/v18-test.css'), `nieuwe V18-pagina mist V18-stijl: ${entry.route}`);
      assert.ok(html.includes('/assets/v18-test.js'), `nieuwe V18-pagina mist V18-shell: ${entry.route}`);
    }
  }
});

test('production Blog remains physically present and protected by its source tag', () => {
  const blog = byRoute.get('/blog/');
  assert.ok(blog, 'Blog ontbreekt uit registry');
  assert.equal(blog.sourceTag, 'source:production-preserved');
  assert.ok(fs.existsSync('blog/index.html'), 'productieblog is verdwenen');
});

test('every visible local link on V18 directory and authored pages resolves to a registered real route', () => {
  const authoredFiles = new Set(['meer.html']);
  for (const entry of registry.routes) {
    if (entry.sourceTag === 'source:new-v18-authored') authoredFiles.add(entry.file);
  }
  const unresolved = [];
  const invalid = [];
  for (const file of authoredFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
      const href = match[1].trim();
      if (!href || href === '#' || /^javascript:/i.test(href)) {
        invalid.push(`${file}: ${href || '(leeg)'}`);
        continue;
      }
      const route = normalizeRoute(href);
      if (!route) continue;
      if (route === 'INVALID_JAVASCRIPT') {
        invalid.push(`${file}: ${href}`);
        continue;
      }
      const registeredFile = fileForRoute(route);
      if (!registeredFile || !fs.existsSync(registeredFile)) unresolved.push(`${file}: ${href} -> ${route}`);
    }
  }
  assert.deepEqual(invalid, [], `dode CTA/link gevonden:\n${invalid.join('\n')}`);
  assert.deepEqual(unresolved, [], `onbekende of ontbrekende interne routes:\n${unresolved.join('\n')}`);
});
