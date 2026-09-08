import { readFile, writeFile, glob } from 'node:fs/promises';
import { ensureKnowledgeNavigation } from './ensure-knowledge-nav.mjs';
import { PUBLIC_PAGE_EXCLUDES } from './contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const KENNIS_HREF = `${ORIGIN}/kennis/`;
const BLOG_HREF = `${ORIGIN}/blog/`;

function platteTekst(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function anchors(html) {
  return [...String(html).matchAll(/<a\b[^>]*href=(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, , href, inhoud]) => ({ href, tekst: platteTekst(inhoud).toLowerCase() }));
}

export function finalizeNavigationHtml(input) {
  return ensureKnowledgeNavigation(String(input));
}

export function verifyFinalNavigationHtml(input, bestand = 'pagina') {
  const html = String(input);
  const links = anchors(html);
  const kennis = links.filter(link => link.tekst === 'kennis' || link.tekst === 'kennisbank');
  const blog = links.filter(link => link.tekst === 'blog' || link.tekst.startsWith('blog '));

  if (!kennis.length) throw new Error(`${bestand}: final navigation mist Kennis/Kennisbank`);
  if (kennis.some(link => link.href !== KENNIS_HREF)) {
    const fout = kennis.find(link => link.href !== KENNIS_HREF);
    throw new Error(`${bestand}: Kennis wijst naar ${fout.href}; final contract vereist ${KENNIS_HREF}`);
  }
  if (!blog.some(link => link.href === BLOG_HREF)) {
    throw new Error(`${bestand}: final navigation mist aparte Blog-bestemming ${BLOG_HREF}`);
  }
  if (links.some(link => link.tekst.startsWith('blog & kennisbank'))) {
    throw new Error(`${bestand}: gecombineerde Blog & Kennisbank-link is niet toegestaan`);
  }
  return true;
}

function attribuut(tag, naam) {
  const m = String(tag).match(new RegExp(`\\b${naam}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

export function assertIndexableRouteHtml(input, canonical, bestand) {
  const html = String(input);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const robotsTag = head.match(/<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/i)?.[0] ?? '';
  if (!robotsTag) throw new Error(`${bestand}: robots meta ontbreekt`);
  const robots = attribuut(robotsTag, 'content');
  if (/(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots)) throw new Error(`${bestand}: route is noindex`);

  const canonicalTag = head.match(/<link\b[^>]*rel=(?:"canonical"|'canonical')[^>]*>/i)?.[0] ?? '';
  if (!canonicalTag) throw new Error(`${bestand}: canonical ontbreekt`);
  const href = attribuut(canonicalTag, 'href');
  if (href !== canonical) throw new Error(`${bestand}: canonical ${href || '(leeg)'} moet ${canonical} zijn`);

  if (!/<title\b[^>]*>[^<\s][\s\S]*?<\/title>/i.test(head)) throw new Error(`${bestand}: title ontbreekt`);
  if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) throw new Error(`${bestand}: H1 ontbreekt`);
  return true;
}

function finaleShellTopLevel(bestand) {
  // Gate-fixtures zijn geen publieke routes en blijven buiten sitemap/publicatie,
  // maar dragen wel dezelfde shell-hash. Daarom worden ze hier bewust WEL
  // genormaliseerd: de hash-gate moet de finale shell vergelijken, niet een
  // snapshot van vóór deze eindcontractlaag.
  return !PUBLIC_PAGE_EXCLUDES.has(bestand) || /^shell-gate-.*\.html$/i.test(bestand);
}

async function finaleShellHtmlBestanden() {
  const bestanden = [];
  for await (const pad of glob('*.html')) if (finaleShellTopLevel(pad)) bestanden.push(pad);
  for await (const pad of glob('blog/*/index.html')) bestanden.push(pad);
  bestanden.push('blog/index.html', 'kennis/index.html');
  return [...new Set(bestanden)].sort();
}

export async function finalizeSiteContracts() {
  let aangepast = 0;
  let gecontroleerd = 0;
  for (const bestand of await finaleShellHtmlBestanden()) {
    let html;
    try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    if (!/<header\b[^>]*(?:class=(['"])[^'"]*\bv17-header\b[^'"]*\1|data-bg-component=(['"])header\2)/i.test(html)) continue;

    const next = finalizeNavigationHtml(html);
    if (next !== html) {
      await writeFile(bestand, next, 'utf8');
      aangepast++;
    }
    verifyFinalNavigationHtml(next, bestand);
    gecontroleerd++;
  }

  const kennis = await readFile('kennis/index.html', 'utf8');
  const blog = await readFile('blog/index.html', 'utf8');
  assertIndexableRouteHtml(kennis, KENNIS_HREF, 'kennis/index.html');
  assertIndexableRouteHtml(blog, BLOG_HREF, 'blog/index.html');

  console.log(`Final site contracts OK: ${gecontroleerd} shell-bestanden gecontroleerd, ${aangepast} genormaliseerd; Kennisbank en Blog zijn aparte indexeerbare routes`);
  return { gecontroleerd, aangepast };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await finalizeSiteContracts();
}
