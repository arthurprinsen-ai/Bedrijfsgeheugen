import { readFile, writeFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from './site-shell/contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);

const xmlEscape = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function isExclude(pad) {
  return EXCLUDES.has(pad) || /^shell-gate-.*\.html$/i.test(pad);
}

export function maakSitemap(urls) {
  const schoon = [...new Set((urls || []).filter(url => String(url).startsWith(`${ORIGIN}/`)))].sort((a, b) => a.localeCompare(b, 'nl'));
  const regels = schoon.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${regels.join('\n')}\n</urlset>\n`;
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
  bestanden.push('blog/index.html');
  return [...new Set(bestanden)];
}

export async function genereerSitemap(bestand = 'sitemap.xml') {
  const urls = [];
  for (const pad of await htmlBestanden()) {
    let html;
    try { html = await readFile(pad, 'utf8'); } catch { continue; }
    if (!html.includes('<body') || noindex(html)) continue;
    const url = canonical(html);
    if (!url.startsWith(`${ORIGIN}/`)) continue;
    urls.push(url);
  }
  const xml = maakSitemap(urls);
  await writeFile(bestand, xml, 'utf8');
  console.log(`Sitemap gegenereerd uit ${new Set(urls).size} actuele canonicals; geen onbewezen lastmod-datums`);
  return xml;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await genereerSitemap();
