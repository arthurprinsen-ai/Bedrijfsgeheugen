import { readFile, writeFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from '../site-shell/contracts.mjs';
import { loadRegistry, entryForCanonical, ORIGIN } from './registry.mjs';
import { enrichBlog } from './blog-contract.mjs';
import { enrichRegisteredPage, inferSeoMeta } from './enrich.mjs';
import { injectSeoGraph } from './schema.mjs';
import { markPrimaryConversions, injectConversionTracker } from './conversion.mjs';

const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);

function attr(tag, name) {
  const m = String(tag || '').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function headOf(html) {
  return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
}

function noindex(html) {
  const robots = [...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m => /^robots$/i.test(attr(m[0], 'name')))?.[0] || '';
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attr(robots, 'content'));
}

function canonicalOf(html) {
  const tag = [...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m => /(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0], 'rel')))?.[0] || '';
  return attr(tag, 'href');
}

function markBodyContext(input, role, funnel) {
  const html = String(input);
  return html.replace(/<body\b([^>]*)>/i, (_tag, attrs) => {
    const clean = attrs
      .replace(/\sdata-bg-page-role=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-funnel-stage=(?:"[^"]*"|'[^']*')/gi, '');
    return `<body${clean} data-bg-page-role="${role}" data-bg-funnel-stage="${funnel}">`;
  });
}

function markKnownCtas(input, registry, role = 'support', funnel = 'discover') {
  let html = String(input);
  const seen = new Set();
  for (const entry of registry.pages || []) {
    const cta = entry.primary_cta;
    if (!cta?.url || !cta?.action || seen.has(`${cta.action}|${cta.url}`)) continue;
    seen.add(`${cta.action}|${cta.url}`);
    html = markPrimaryConversions(html, { role, funnel_stage: funnel, primary_cta: cta });
  }
  return html;
}

function enrichGenericPage(input, registry) {
  let html = String(input);
  const meta = inferSeoMeta(html);
  html = markBodyContext(html, 'support', 'discover');
  html = markKnownCtas(html, registry);
  html = injectConversionTracker(html);
  html = injectSeoGraph(html, { ...meta, schema_type: meta.canonical === `${ORIGIN}/blog/` ? 'CollectionPage' : 'WebPage' });
  return html;
}

async function publicHtmlPaths() {
  const paths = [];
  for await (const p of glob('*.html')) if (!EXCLUDES.has(p) && !/^shell-gate-/i.test(p)) paths.push(p);
  for await (const p of glob('blog/*/index.html')) paths.push(p);
  paths.push('blog/index.html');
  return [...new Set(paths)];
}

export async function applySeoOrderEngine() {
  const registry = await loadRegistry();
  let changed = 0;
  let blogs = 0;
  let registered = 0;
  let generic = 0;

  for (const path of await publicHtmlPaths()) {
    let html;
    try { html = await readFile(path, 'utf8'); } catch { continue; }
    if (!/<body\b/i.test(html) || noindex(html)) continue;
    const canonical = canonicalOf(html);
    if (!canonical.startsWith(`${ORIGIN}/`)) continue;

    let out;
    if (/^blog\/[^/]+\/index\.html$/i.test(path)) {
      out = enrichBlog(html, path, registry);
      out = markBodyContext(out, 'article', 'discover');
      out = injectConversionTracker(out);
      blogs++;
    } else {
      const entry = entryForCanonical(canonical, registry);
      if (entry) {
        out = enrichRegisteredPage(html, entry);
        registered++;
      } else {
        out = enrichGenericPage(html, registry);
        generic++;
      }
    }

    if (out !== html) {
      await writeFile(path, out, 'utf8');
      changed++;
    }
  }

  console.log(`SEO order enrichment toegepast: ${changed} gewijzigd; ${blogs} blogs, ${registered} registry-pages, ${generic} overige publieke pagina's`);
  return { changed, blogs, registered, generic };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await applySeoOrderEngine();
