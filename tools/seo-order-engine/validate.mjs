import { readFile, glob } from 'node:fs/promises';
import { validateRegistry, loadRegistry } from './registry.mjs';
import { validateMoneyPages } from './link-graph.mjs';
import { inspectBlog } from './blog-contract.mjs';
import { PUBLIC_PAGE_EXCLUDES } from '../site-shell/contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);

function attr(tag, name) {
  const m = String(tag || '').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function headOf(html) {
  return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
}

function canonicalOf(html) {
  const tag = [...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m => /(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0], 'rel')))?.[0] || '';
  return attr(tag, 'href');
}

function noindex(html) {
  const robots = [...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m => /^robots$/i.test(attr(m[0], 'name')))?.[0] || '';
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attr(robots, 'content'));
}

function hasEvidence(html) {
  const body = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  return /data-bg-evidence(?:\s|=|>)/i.test(body)
    || /<table\b/i.test(body)
    || /class=(?:"[^"]*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|callout|tabelwrap|praktijk|voorbeeld|methode|vergelijk)\b[^"]*"|'[^']*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|callout|tabelwrap|praktijk|voorbeeld|methode|vergelijk)\b[^']*')/i.test(body)
    || /<h[1-4]\b[^>]*>[^<]*(?:bewijs|bronnen?|onderbouwing|case|resultaat|wat krijg je|prijs|kosten|voorbeeld|in de praktijk|uit de praktijk|vergelijking|methode|berekening)[^<]*<\/h[1-4]>/i.test(body);
}

function primaryPageForEntry(pages, entry) {
  const candidates = (pages || []).filter(page => page.canonical === entry.route);
  if (!candidates.length) return null;
  const nonBlog = candidates.find(page => !/^blog\//i.test(page.path || ''));
  if (nonBlog) return nonBlog;
  if (entry.role === 'blog-index') return candidates.find(page => page.path === 'blog/index.html') || candidates[0];
  return candidates[0];
}

function isCanonicalAliasArticle(page, registry) {
  if (!/^blog\/[^/]+\/index\.html$/i.test(page.path || '')) return false;
  return (registry?.pages || []).some(entry => entry.route === page.canonical && entry.role !== 'article');
}

export function validateSeoOrderPages(pages, registry, options = {}) {
  const fouten = [...validateRegistry(registry)];
  fouten.push(...validateMoneyPages(pages, registry));

  for (const entry of registry?.pages || []) {
    const page = primaryPageForEntry(pages, entry);
    if (!page) continue;
    if (!/id=["']bg-seo-order-graph["']/i.test(page.html)) fouten.push(`${entry.route}: SEO order graph ontbreekt`);
    if (entry.role === 'money') {
      if (!hasEvidence(page.html)) fouten.push(`${entry.route}: money page mist zichtbaar bewijs/onderbouwing`);
      const action = entry.primary_cta?.action || '';
      const re = new RegExp(`data-bg-conversion=["']${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
      if (!re.test(page.html)) fouten.push(`${entry.route}: primaire CTA ${action || '(leeg)'} is niet meetbaar gemarkeerd`);
    }
  }

  if (options.inspectBlogs !== false) {
    for (const page of pages || []) {
      if (!/^blog\/[^/]+\/index\.html$/i.test(page.path || '')) continue;
      if (isCanonicalAliasArticle(page, registry)) continue;
      fouten.push(...inspectBlog(page.html, page.path, registry));
    }
  }
  return fouten;
}

async function estatePages() {
  const paths = [];
  for await (const p of glob('*.html')) if (!EXCLUDES.has(p) && !/^shell-gate-/i.test(p)) paths.push(p);
  for await (const p of glob('blog/*/index.html')) paths.push(p);
  paths.push('blog/index.html');
  const pages = [];
  for (const path of [...new Set(paths)]) {
    let html;
    try { html = await readFile(path, 'utf8'); } catch { continue; }
    if (!/<body\b/i.test(html) || noindex(html)) continue;
    const canonical = canonicalOf(html);
    if (!canonical.startsWith(`${ORIGIN}/`)) continue;
    pages.push({ path, canonical, html });
  }
  return pages;
}

export async function validateSeoOrderEngine() {
  const registry = await loadRegistry();
  const pages = await estatePages();
  const fouten = validateSeoOrderPages(pages, registry);
  if (fouten.length) throw new Error(`SEO order gate faalt (${fouten.length}):\n- ${fouten.join('\n- ')}`);
  console.log(`SEO order engine OK: ${pages.length} indexeerbare pagina's; intent, money pages, blogs, linkgraaf, bewijs, structured data en conversies gecontroleerd`);
  return { pages: pages.length, money: registry.pages.filter(p => p.role === 'money').length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await validateSeoOrderEngine();
