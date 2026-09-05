import { readFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from './site-shell/contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const SEO_EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);

export function verwachtCanonical(pad) {
  if (pad === 'index.html') return `${ORIGIN}/`;
  if (pad.endsWith('/index.html')) return `${ORIGIN}/${pad.slice(0, -'index.html'.length)}`;
  return `${ORIGIN}/${pad.replace(/\.html$/, '')}`;
}

function matches(html, re) {
  return [...String(html).matchAll(re)];
}

function attribuut(tag, naam) {
  const m = String(tag).match(new RegExp(`\\b${naam}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function isNoindex(html) {
  const robots = matches(html, /<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/gi);
  return robots.some(tag => /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attribuut(tag[0], 'content')));
}

export function controleerSeoHtml(input, pad) {
  const html = String(input);
  const fouten = [];
  const verwacht = verwachtCanonical(pad);

  const titels = matches(html, /<title\b[^>]*>([\s\S]*?)<\/title>/gi);
  if (titels.length !== 1 || !titels[0]?.[1]?.replace(/<[^>]+>/g, '').trim()) {
    fouten.push(`${pad}: exact één niet-lege title vereist`);
  }

  const descriptions = matches(html, /<meta\b[^>]*name=(?:"description"|'description')[^>]*>/gi);
  if (descriptions.length !== 1 || !attribuut(descriptions[0]?.[0], 'content').trim()) {
    fouten.push(`${pad}: exact één niet-lege meta description vereist`);
  }

  const robots = matches(html, /<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/gi);
  if (robots.length !== 1) fouten.push(`${pad}: exact één robots meta vereist`);
  else if (/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attribuut(robots[0][0], 'content'))) {
    fouten.push(`${pad}: publieke SEO-pagina mag niet noindex zijn`);
  }

  const canonicals = matches(html, /<link\b[^>]*rel=(?:"canonical"|'canonical')[^>]*>/gi);
  const canonical = canonicals.length === 1 ? attribuut(canonicals[0][0], 'href') : '';
  if (canonicals.length !== 1) fouten.push(`${pad}: exact één canonical vereist`);
  else if (canonical !== verwacht) fouten.push(`${pad}: canonical ${canonical || '(leeg)'} moet ${verwacht} zijn`);

  const h1s = matches(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/gi);
  if (h1s.length !== 1) fouten.push(`${pad}: exact één H1 vereist, gevonden ${h1s.length}`);

  const anchors = matches(html, /<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>/gi);
  for (const anchor of anchors) {
    const href = anchor[1] ?? anchor[2] ?? '';
    if (/^\/(?!\/)/.test(href)) fouten.push(`${pad}: absolute interne href vereist, gevonden ${href}`);
  }

  if (pad !== 'index.html') {
    const kruimels = matches(html, /<(?:nav|ol)\b[^>]*(?:aria-label=(?:"Kruimelpad"|'Kruimelpad')|class=(?:"[^"]*\bbgkruim\b[^"]*"|'[^']*\bbgkruim\b[^']*'))[^>]*>/gi);
    if (kruimels.length < 1) fouten.push(`${pad}: zichtbaar kruimelpad ontbreekt`);
  }

  return fouten;
}

async function seoBestanden() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!SEO_EXCLUDES.has(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  bestanden.push('blog/index.html');
  return [...new Set(bestanden)];
}

export async function controleerTechnischeSeo() {
  const fouten = [];
  const paginas = [];
  for (const pad of await seoBestanden()) {
    let html;
    try { html = await readFile(pad, 'utf8'); } catch { continue; }
    if (!html.includes('<body') || isNoindex(html)) continue;
    const paginaFouten = controleerSeoHtml(html, pad);
    fouten.push(...paginaFouten);
    paginas.push({ pad, html, canonical: verwachtCanonical(pad) });
  }

  const routes = new Set(paginas.map(p => p.canonical));
  for (const { pad, html } of paginas) {
    const anchors = matches(html, /<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>/gi);
    for (const anchor of anchors) {
      const href = anchor[1] ?? anchor[2] ?? '';
      if (!href.startsWith(`${ORIGIN}/`)) continue;
      const schoon = href.split('#')[0].split('?')[0];
      if (!schoon || schoon === ORIGIN) continue;
      if (/\.(?:pdf|png|jpe?g|webp|svg|zip|xml|txt)$/i.test(schoon)) continue;
      if (!routes.has(schoon)) fouten.push(`${pad}: interne link wijst niet rechtstreeks naar een indexeerbare canonical route: ${href}`);
    }
  }

  if (fouten.length) throw new Error(`Technische SEO-gate faalt (${fouten.length}):\n- ${fouten.join('\n- ')}`);
  console.log(`Technische SEO OK: ${paginas.length} indexeerbare pagina's; canonical, title, description, H1, breadcrumbs en interne links gecontroleerd`);
  return { paginas: paginas.length, routes: [...routes] };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await controleerTechnischeSeo();
