import { readFile, writeFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from './site-shell/contracts.mjs';
import { finalizeSiteContracts } from './site-shell/finalize-site-contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);
const AI_MODEL_SEO_PAGES = Object.freeze([
  'openai-ai-modellen/index.html',
  'claude-ai-modellen/index.html',
  'gemini-ai-modellen/index.html',
  'mistral-ai-modellen/index.html',
  'amazon-ai-modellen/index.html',
  'chatgpt-vs-claude/index.html',
  'chatgpt-vs-gemini/index.html',
  'claude-vs-gemini/index.html'
]);

const xmlEscape = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function isExclude(pad) {
  return EXCLUDES.has(pad) || /^shell-gate-.*\.html$/i.test(pad);
}

function alternatePair(url, known) {
  const value=String(url);
  if(!value.startsWith(ORIGIN + '/')) return null;
  const path=value.slice(ORIGIN.length) || '/';
  const isEn=path==='/en' || path==='/en/' || path.startsWith('/en/');
  const nlPath=isEn ? (path==='/en'||path==='/en/' ? '/' : path.slice(3)) : path;
  const nlUrl=ORIGIN + (nlPath || '/');
  const enUrl=ORIGIN + '/en' + (nlPath==='/' ? '/' : nlPath);
  if(!known.has(nlUrl) || !known.has(enUrl)) return null;
  return {nlUrl,enUrl};
}

export function maakSitemap(urls, alternates = new Map()) {
  const schoon = [...new Set((urls || []).filter(url => String(url).startsWith(`${ORIGIN}/`)))].sort((a, b) => a.localeCompare(b, 'nl'));
  const known = new Set(schoon);
  const regels = schoon.map(url => {
    let alt = alternates.get(url) || [];
    if (!alt.length) {
      const pair = alternatePair(url, known);
      if (pair) alt = [
        { hreflang:'nl', href:pair.nlUrl },
        { hreflang:'en', href:pair.enUrl },
        { hreflang:'x-default', href:pair.nlUrl }
      ];
    }
    const links = alt.map(item => `<xhtml:link rel="alternate" hreflang="${xmlEscape(item.hreflang)}" href="${xmlEscape(item.href)}"/>`).join('');
    return `  <url><loc>${xmlEscape(url)}</loc>${links}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${regels.join('\n')}\n</urlset>\n`;
}

function noindex(html) {
  const tag = String(html).match(/<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/i)?.[0] || '';
  const content = tag.match(/\bcontent=(?:"([^"]*)"|'([^']*)')/i);
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(content?.[1] ?? content?.[2] ?? '');
}

function canonical(html) {
  const tag = String(html).match(/<link\b[^>]*rel=(?:"canonical"|'canonical')[^>]*>/i)?.[0] || '';
  const href = tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
  return href?.[1] ?? href?.[2] ?? '';
}

async function htmlBestanden() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!isExclude(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  for await (const p of glob('en/**/*.html')) bestanden.push(p);
  bestanden.push('blog/index.html', 'kennis/index.html', ...AI_MODEL_SEO_PAGES);
  return [...new Set(bestanden)];
}

function alternateLinks(html) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*rel=(?:"alternate"|'alternate')[^>]*>/gi)) {
    const tag=m[0];
    const href=tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
    const lang=tag.match(/\bhreflang=(?:"([^"]*)"|'([^']*)')/i);
    const valueHref=href?.[1]??href?.[2]??'';
    const valueLang=lang?.[1]??lang?.[2]??'';
    if(valueHref.startsWith(`${ORIGIN}/`) && valueLang) out.push({hreflang:valueLang,href:valueHref});
  }
  return out;
}

export async function genereerSitemap(bestand = 'sitemap.xml') {
  // Dit is de eerste stap ná alle late website-writers. Dwing hier eerst het
  // definitieve outputcontract af, zodat sitemap, UI- en SEO-gates exact de
  // HTML controleren die Netlify daarna publiceert.
  await finalizeSiteContracts();

  const urls = [];
  const alternates = new Map();
  for (const pad of await htmlBestanden()) {
    let html;
    try { html = await readFile(pad, 'utf8'); } catch { continue; }
    if (!html.includes('<body') || noindex(html)) continue;
    const url = canonical(html);
    if (!url.startsWith(`${ORIGIN}/`)) continue;
    urls.push(url);
    const links=alternateLinks(html);
    if(links.length) alternates.set(url,links);
  }
  const xml = maakSitemap(urls,alternates);
  await writeFile(bestand, xml, 'utf8');
  console.log(`Sitemap gegenereerd uit ${new Set(urls).size} actuele canonicals; geen onbewezen lastmod-datums`);
  return xml;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await genereerSitemap();
