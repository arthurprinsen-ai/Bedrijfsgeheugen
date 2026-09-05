import { readFile } from 'node:fs/promises';
import { loadRegistry } from './registry.mjs';
import { inspectBlog } from './blog-contract.mjs';

function attr(tag, name) {
  const m = String(tag || '').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function canonicalOf(html) {
  const head = String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const tag = [...head.matchAll(/<link\b[^>]*>/gi)].find(m => /(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0], 'rel')))?.[0] || '';
  return attr(tag, 'href');
}

function hasEvidence(html) {
  const body = String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  return /data-bg-evidence(?:\s|=|>)/i.test(body)
    || /<table\b/i.test(body)
    || /class=(?:"[^"]*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|callout|tabelwrap|praktijk|voorbeeld|methode|vergelijk)\b[^"]*"|'[^']*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|callout|tabelwrap|praktijk|voorbeeld|methode|vergelijk)\b[^']*')/i.test(body)
    || /<h[1-4]\b[^>]*>[^<]*(?:bewijs|bronnen?|onderbouwing|case|resultaat|wat krijg je|prijs|kosten|voorbeeld|in de praktijk|uit de praktijk|vergelijking|methode|berekening)[^<]*<\/h[1-4]>/i.test(body);
}

function registeredPageErrors(page, entry) {
  const fouten = [];
  const html = String(page.html || '');
  if (!/id=["']bg-seo-order-graph["']/i.test(html)) fouten.push(`${page.path}: SEO order graph ontbreekt`);
  const role = attr(html.match(/<body\b[^>]*>/i)?.[0] || '', 'data-bg-page-role');
  const stage = attr(html.match(/<body\b[^>]*>/i)?.[0] || '', 'data-bg-funnel-stage');
  if (role !== entry.role) fouten.push(`${page.path}: live page role ${role || '(leeg)'} moet ${entry.role} zijn`);
  if (stage !== entry.funnel_stage) fouten.push(`${page.path}: live funnel stage ${stage || '(leeg)'} moet ${entry.funnel_stage} zijn`);
  if (entry.role === 'money') {
    if (!hasEvidence(html)) fouten.push(`${page.path}: money page mist zichtbaar bewijs/onderbouwing`);
    const action = entry.primary_cta?.action || '';
    const escaped = action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`data-bg-conversion=["']${escaped}["']`, 'i').test(html)) fouten.push(`${page.path}: primaire CTA ${action || '(leeg)'} is niet meetbaar gemarkeerd`);
  }
  return fouten;
}

export function validateLiveSeoOrderSet(pages, registry) {
  const fouten = [];
  for (const page of pages || []) {
    const entry = (registry?.pages || []).find(item => item.route === page.canonical);
    if (entry) fouten.push(...registeredPageErrors(page, entry));
    if (/^blog\/[^/]+\/index\.html$/i.test(page.path || '') && !entry) {
      fouten.push(...inspectBlog(page.html, page.path, registry));
    }
  }
  return fouten;
}

async function readLivePages() {
  const files = [
    ['live-home.html', 'live-home.html'],
    ['live-prijzen.html', 'live-prijzen.html'],
    ['live-afas.html', 'live-afas.html'],
    ['live-blog-index.html', 'live-blog-index.html'],
    ['live-blog-afas-api.html', 'blog/afas-api/index.html'],
    ['live-blog-kennis-borgen.html', 'blog/kennis-borgen-in-je-bedrijf/index.html']
  ];
  const pages = [];
  for (const [file, path] of files) {
    const html = await readFile(file, 'utf8');
    pages.push({ path, canonical: canonicalOf(html), html });
  }
  return pages;
}

export async function checkLiveSeoOrder() {
  const registry = await loadRegistry();
  const pages = await readLivePages();
  const fouten = validateLiveSeoOrderSet(pages, registry);
  if (fouten.length) throw new Error(`Live SEO order readback faalt (${fouten.length}):\n- ${fouten.join('\n- ')}`);
  console.log(`Live SEO order readback OK: ${pages.length} representatieve productiepagina's`);
  return { pages: pages.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await checkLiveSeoOrder();
