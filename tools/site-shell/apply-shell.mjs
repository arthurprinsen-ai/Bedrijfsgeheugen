import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { GLOBAL_COMPONENTS, PUBLIC_PAGE_EXCLUDES } from './contracts.mjs';
import { ensureBrandShellCss, ensureFooterContact, ensureTrustBar, extractComponent, markPageSlots, replaceComponent } from './components.mjs';
import { ensureKnowledgeNavigation } from './ensure-knowledge-nav.mjs';
import { scoopCss } from '../bouw-v18-chrome.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const PAD = {
  home: `${ORIGIN}/`, product: `${ORIGIN}/product`, pricing: `${ORIGIN}/prijzen`, solutions: `${ORIGIN}/oplossingen`,
  integrations: `${ORIGIN}/systemen-koppelen`, resources: `${ORIGIN}/blog/`, company: `${ORIGIN}/over-ons`,
  cases: `${ORIGIN}/cases`, login: `${ORIGIN}/inloggen`, signup: `${ORIGIN}/aanmelden`, selfscan: `${ORIGIN}/zelfscan`,
  'frisseblik-scan': `${ORIGIN}/frisse-blik`, start: `${ORIGIN}/aanmelden`
};

export const CANONICAL_SHELL_SOURCE = 'over-ons.html';
const EXTRA_EXCLUDES = new Set(['index.html']);
const MAPPEN = ['.', 'blog'];

const PAGE_SHELL_CSS = `<style id="canonical-page-shell">
.paginakop{background:#0a1117;color:#fff;padding:132px 0 62px;position:relative}
.paginakop .wrap{max-width:1120px}.paginakop .bgkruim,.paginakop .bgkruim a,.paginakop .bgkruim span{color:rgba(255,255,255,.7);padding:0;font-size:13px}
.paginakop .bgkruim a{text-decoration:none}.paginakop .bgkruim span[aria-hidden]{margin:0 8px}
.paginakop .eyebrow{display:inline-block;margin:18px 0 10px;color:var(--lime,#d8ff68);font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
.paginakop h1{color:#fff;margin:0 0 18px;max-width:20ch}.paginakop h1 span{display:block}
.paginakop p{color:rgba(255,255,255,.84);max-width:72ch;font-size:18px;line-height:1.6;margin:0}
.held .bgkruim{background:transparent!important;color:rgba(255,255,255,.72)!important;padding:0 0 18px!important;margin:0!important;border:0!important;box-shadow:none!important}
.held .bgkruim a,.held .bgkruim span{background:transparent!important;color:inherit!important}
.held .bgkruim a{text-decoration:none}
.paginakop .bgkruim{background:none;position:static;backdrop-filter:none;box-shadow:none;border:0}
@media(max-width:768px){.paginakop{padding:104px 0 46px}.held .bgkruim{padding-bottom:14px!important}
body:has(.held .heldknoppen) .held .bgkruim,body:has(.held .heldknoppen) .held .pil,body:has(.held .heldknoppen) .held h1,body:has(.held .heldknoppen) .held .ondertitel,body:has(.held .heldknoppen) .held .payoff,body:has(.held .heldknoppen) .held .intro,body:has(.held .heldknoppen) .held .heldknoppen,body:has(.held .heldknoppen) .held .bovenop{font-family:system-ui,-apple-system,"Segoe UI",sans-serif!important}}
/* Vangregel voor rasters: een grid- of flexkind krimpt nooit onder zijn inhoud
   zolang min-width op auto staat. Daardoor werd een 1fr-kolom breder dan de
   container en knipte overflow:hidden de kaart af. :where() houdt dit op
   specificiteit nul, dus elke eigen min-width van een pagina wint. */
:where(main[data-bg-component="main"] *:not(img,svg,video,canvas,iframe,input,select,textarea,button)){min-width:0}
main,.page{background:var(--paper,#fff)}.page>main{padding:0}.bgkruim,.kruimelpad{font-size:13px;padding:18px 0 0}
</style>`;


// Stijlblokken met een id (<style id="v18-inhoud"> e.d.) die zowel in de schil
// als in de pagina zelf staan. Tot 10 sept 2026 kwamen ze twee keer op 82 van
// de 87 pagina's: één keer uit de schil vóór de pagina-opmaak en één keer erna.
// De tweede kopie won dan van de eigen regels van de pagina met dezelfde
// specificiteit (pilknoppen van 124x109 px, kaarten in een smalle kolom).
export function stijlId(blok) {
  const m = String(blok).match(/^<style\b[^>]*\bid="([^"]+)"/i);
  return m ? m[1] : null;
}
export function zonderSchilblokken(stijlen, schilVoor) {
  const inSchil = new Set([...String(schilVoor).matchAll(/<style\b[^>]*\bid="([^"]+)"/gi)].map(m => m[1]));
  const gezien = new Set();
  return stijlen.filter(blok => {
    const id = stijlId(blok);
    if (!id) return true;
    if (inSchil.has(id) || gezien.has(id)) return false;
    gezien.add(id);
    return true;
  });
}

// Oude gedeelde stylesheets van een handgemaakte pagina (/kennis/, /prijzen).
// kop.css hoort bij de oude lichte kop en heeft naast de schil geen functie.
// stijl.css zet globaal .wrap{max-width:1120px;padding:0 20px}; als los
// stylesheet raakte dat ook kop en voet van de schil (container 1120 in plaats
// van 1220, logo 70 px verschoven, hogere voet). Daarom komt stijl.css hier
// ingebed en gescoopt op de hoofdinhoud, zoals bij de gegenereerde pagina's.
// :where() houdt de specificiteit gelijk aan die van stijl.css zelf, zodat de
// eigen regels van de pagina er net als voorheen overheen gaan.
export function eigenKoppelingen(koppel, stijlBasis) {
  const uit = [];
  let basisGezet = false;
  for (const link of koppel) {
    if (/\/assets\/kop\.css/i.test(link)) continue;
    if (/\/assets\/stijl\.css/i.test(link) && stijlBasis) {
      if (!basisGezet) uit.push(`<style id="pagina-basis">${scoopCss(stijlBasis, ':where(main[data-bg-component="main"])')}</style>`);
      basisGezet = true;
      continue;
    }
    uit.push(link);
  }
  return uit;
}

function absolutiseerInterneHref(html) {
  return String(html).replace(/href=(['"])\/(?!\/)([^'"]*)\1/gi, (_heel, quote, pad) => `href=${quote}${ORIGIN}/${pad}${quote}`);
}

function knoppenNaarLinks(html) {
  return html.replace(/<button([^>]*data-view="[a-z0-9-]+"[^>]*)>([\s\S]*?)<\/button>/g, (heel, attrs, inhoud) => {
    const mv = attrs.match(/data-view="([a-z0-9-]+)"/);
    const doel = mv && PAD[mv[1]];
    if (!doel) return heel;
    return `<a href="${doel}"${attrs.replace(/\s*type="button"/, '')}>${inhoud}</a>`;
  });
}

function routerLaatLinksDoor(html) {
  const oud = "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();showView(btn.dataset.view);";
  if (!html.includes(oud)) return html;
  return html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);");
}

function schilUitBron(bronHtml, bronPad) {
  const html = markPageSlots(bronHtml);
  const eerste = html.search(/<div class="page(?: active)?" id="view-[a-z0-9-]+">/);
  const eindMain = html.indexOf('</main>');
  if (eerste === -1 || eindMain === -1) throw new Error(`canonical shell: bron ${bronPad} bevat geen projecteerbare v17/v18-schil`);
  if (!/<header\b[^>]*class="[^"]*\bv17-header\b/i.test(html)) throw new Error(`canonical shell: bron ${bronPad} heeft geen canonical v17-header`);
  if (!/<aside\b[^>]*class="[^"]*\bv18-mobile-drawer\b/i.test(html)) throw new Error(`canonical shell: bron ${bronPad} heeft geen canonical v18-mobile-drawer`);
  return { bron: html, voor: html.slice(0, eerste), na: html.slice(eindMain) };
}

export function projectGlobalComponents(targetHtml, sourceHtml) {
  let target = markPageSlots(String(targetHtml));
  const source = markPageSlots(String(sourceHtml));
  for (const name of GLOBAL_COMPONENTS) {
    const replacement = extractComponent(source, name);
    if (!replacement) throw new Error(`canonical shell source mist component ${name}`);
    const current = extractComponent(target, name);
    if (!current) throw new Error(`target mist component ${name}`);
    target = replaceComponent(target, name, replacement);
  }
  return target;
}

export function extractPageMain(input, pad = '') {
  const html = String(input);
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1];
  if (pad === 'prijzen.html') {
    const body = html.match(/<body\b[^>]*>/i);
    if (!body) return null;
    const vanaf = body.index + body[0].length;
    const navEind = html.indexOf('</nav>', vanaf);
    const footerStart = html.indexOf('<footer', navEind >= 0 ? navEind : vanaf);
    if (navEind < 0 || footerStart < 0 || footerStart <= navEind) return null;
    return html.slice(navEind + '</nav>'.length, footerStart).trim();
  }
  return null;
}

function eigenHoofd(oud) {
  const titel = oud.match(/<title>[\s\S]*?<\/title>/i);
  const desc = oud.match(/<meta name="description" content="[^"]*"\s*\/?>/i);
  const canon = oud.match(/<link rel="canonical" href="[^"]*"\s*\/?>/i);
  const og = oud.match(/<meta property="og:[^"]*" content="[^"]*"\s*\/?>/gi) || [];
  const tw = oud.match(/<meta name="twitter:[^"]*" content="[^"]*"\s*\/?>/gi) || [];
  const data = oud.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
  const stijl = oud.match(/<style[\s\S]*?<\/style>/gi) || [];
  const koppel = oud.match(/<link rel="stylesheet"[^>]*>/gi) || [];
  return { titel: titel && titel[0], desc: desc && desc[0], canon: canon && canon[0], og, tw, data, stijl, koppel };
}

const tekstUit = html => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function kruimelSchemaVoor(label, pad) {
  if (pad === '404.html' || !label) return null;
  const url = `${ORIGIN}/` + pad.replace(/index\.html$/, '').replace(/\.html$/, '');
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${ORIGIN}/"},{"@type":"ListItem","position":2,"name":"${label}","item":"${url}"}]}<\/script>`;
}

function plaatsPrijsKruimelInHero(binnen, label) {
  let rest = String(binnen);
  const bestaand = rest.match(/<nav\b[^>]*class="[^"]*\bbgkruim\b[^"]*"[^>]*>[\s\S]*?<\/nav>/i);
  let nav = bestaand ? bestaand[0] : `<nav class="bgkruim" aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a><span aria-hidden="true">›</span><span aria-current="page">${label}</span></nav>`;
  if (bestaand) rest = rest.replace(bestaand[0], '');
  if (!/aria-label=(?:"Kruimelpad"|'Kruimelpad')/i.test(nav)) nav = nav.replace(/<nav\b([^>]*)>/i, '<nav$1 aria-label="Kruimelpad">');

  const held = rest.match(/<(?:section|div)\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*>/i);
  if (!held || held.index === undefined) return nav + rest;
  const heldEnd = held.index + held[0].length;
  const naHeld = rest.slice(heldEnd);
  const wrap = naHeld.match(/^\s*<div\b[^>]*class="[^"]*\bwrap\b[^"]*"[^>]*>/i);
  if (wrap) {
    const insertAt = heldEnd + wrap.index + wrap[0].length;
    return rest.slice(0, insertAt) + nav + rest.slice(insertAt);
  }
  return rest.slice(0, heldEnd) + nav + rest.slice(heldEnd);
}

function kruimelErbij(binnen, oud, pad) {
  if (pad === 'prijzen.html') {
    const h1 = oud.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const label = h1 ? tekstUit(h1[1]).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : 'Prijzen';
    return { binnen: plaatsPrijsKruimelInHero(binnen, label), schema: /BreadcrumbList/.test(oud) ? null : kruimelSchemaVoor(label, pad) };
  }
  if (/aria-label="Kruimelpad"/i.test(binnen)) {
    if (/BreadcrumbList/.test(oud)) return { binnen, schema: null };
    const laatste = binnen.match(/aria-current="page"[^>]*>([\s\S]*?)<\/span>/i);
    const label = laatste ? tekstUit(laatste[1]).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : '';
    return { binnen, schema: kruimelSchemaVoor(label, pad) };
  }
  const h1 = oud.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titel = oud.match(/<title>([\s\S]*?)<\/title>/i);
  let label = h1 ? tekstUit(h1[1]) : (titel ? tekstUit(titel[1]).split('|')[0].split(' — ')[0] : '');
  label = label.replace(/[.:]$/, '').trim();
  if (!label) return { binnen, schema: null };
  if (label.length > 60) label = label.slice(0, 57).trim() + '...';
  const veilig = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nav = `<nav class="bgkruim" aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a><span aria-hidden="true">›</span><span aria-current="page">${veilig}</span></nav>\n`;
  return { binnen: nav + binnen, schema: kruimelSchemaVoor(veilig, pad) };
}

function legacyPricingHero(rest) {
  const h1Index = rest.search(/<h1\b/i);
  if (h1Index < 0) return null;
  const voorH1 = rest.slice(0, h1Index);
  const openingen = [...voorH1.matchAll(/<section\b[^>]*>/gi)];
  const opening = openingen.at(-1);
  if (!opening || opening.index === undefined || !/class="[^"]*\bheld\b/i.test(opening[0])) return null;
  const start = opening.index;
  const tags = /<section\b[^>]*>|<\/section\s*>/gi;
  tags.lastIndex = start;
  let diepte = 0, m;
  while ((m = tags.exec(rest))) {
    if (/^<section\b/i.test(m[0])) diepte += 1; else diepte -= 1;
    if (diepte === 0) return { start, end: tags.lastIndex, html: rest.slice(start, tags.lastIndex) };
  }
  return null;
}

function markeerBestaandeV18Hero(binnen) {
  return String(binnen).replace(
    /<section\b(?![^>]*data-bg-component)([^>]*\bclass="[^"]*\binhoud-kop\b[^"]*"[^>]*)>/i,
    '<section$1 data-bg-component="hero">'
  );
}

function markeerBestaandePrijsHero(binnen) {
  return String(binnen).replace(
    /<(section|div)\b(?![^>]*data-bg-component)([^>]*\bclass="[^"]*\bheld\b[^"]*"[^>]*)>/i,
    '<$1$2 data-bg-component="hero">'
  );
}

function paginakop(binnen, pad) {
  if (/<section\b[^>]*class="[^"]*\binhoud-kop\b[^"]*"[^>]*>/i.test(binnen)) return markeerBestaandeV18Hero(binnen);
  if (pad === 'prijzen.html' && /<(?:section|div)\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*>/i.test(binnen)) return markeerBestaandePrijsHero(binnen);

  let rest = binnen;
  const pak = re => { const m = rest.match(re); if (!m) return ''; rest = rest.replace(m[0], ''); return m[0]; };
  const kruimel = pak(/<nav class="bgkruim"[\s\S]*?<\/nav>/i);

  let bron = rest;
  if (pad === 'prijzen.html') {
    const legacy = legacyPricingHero(rest);
    if (legacy) {
      bron = legacy.html;
      rest = rest.slice(0, legacy.start) + rest.slice(legacy.end);
    }
  }

  const kopMatch = bron.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (!kopMatch) return binnen;
  const bovenkopMatch = bron.match(/<span class="eyebrow"[^>]*>[\s\S]*?<\/span>/i);
  const inleidingMatch = bron.match(/<p class="(?:p-intro|leid|lead)"[^>]*>[\s\S]*?<\/p>/i);
  const kop = kopMatch[0];
  const bovenkop = bovenkopMatch ? bovenkopMatch[0] : '';
  const inleiding = inleidingMatch ? inleidingMatch[0] : '';

  if (bron === rest) {
    rest = rest.replace(kop, '');
    if (bovenkop) rest = rest.replace(bovenkop, '');
    if (inleiding) rest = rest.replace(inleiding, '');
  }

  return `<section class="paginakop" data-bg-component="hero"><div class="wrap">${kruimel}${bovenkop}${kop}${inleiding}</div></section>\n${rest}`;
}

// Gegevensblokken (JSON-LD) horen bij de pagina, niet bij de schil. De schil komt uit
// over-ons.html en nam daarvan het WebPage-schema "Over ons" mee naar vrijwel elke pagina;
// daarbij stapelden identieke blokken zich op tot elf per pagina (10 sept 2026).
const LDJSON = /<script type="application\/ld\+json">([\s\S]*?)<\/script>\s*/gi;
function schemaInhoud(blok) {
  const m = String(blok).match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}
const zonderSlash = u => String(u || '').replace(/\/+$/, '');
export function schoneSchemas(blokken, canonUrl) {
  const gezien = new Set();
  const uit = [];
  for (const blok of blokken) {
    const j = schemaInhoud(blok);
    const sleutel = j ? JSON.stringify(j) : String(blok).replace(/\s+/g, ' ');
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    if (j && canonUrl && ['WebPage', 'BlogPosting', 'Article', 'AboutPage'].includes(j['@type'])) {
      const eigen = typeof j.mainEntityOfPage === 'string' ? j.mainEntityOfPage : (j.mainEntityOfPage && j.mainEntityOfPage['@id']) || j.url;
      if (eigen && zonderSlash(eigen) !== zonderSlash(canonUrl)) continue;
    }
    uit.push(blok);
  }
  return uit;
}

export function applyCanonicalShell(html, shell, pad, stijlBasis = null) {
  const binnen = extractPageMain(html, pad);
  if (binnen === null) return null;
  const eigen = eigenHoofd(html);
  const kruimel = kruimelErbij(binnen, html, pad);
  const opening = paginakop(kruimel.binnen, pad);
  let uit = shell.voor + `<div class="page active" id="view-inhoud">\n<main data-bg-component="main">${opening}</main>\n</div>\n` + shell.na;
  uit = uit.replace(LDJSON, '');
  if (kruimel.schema) eigen.data.push(kruimel.schema);
  if (eigen.titel) uit = uit.replace(/<title>[\s\S]*?<\/title>/i, eigen.titel);
  if (eigen.desc) uit = uit.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, eigen.desc);
  if (eigen.canon) uit = /<link rel="canonical"/i.test(uit) ? uit.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, eigen.canon) : uit.replace('</head>', `${eigen.canon}\n</head>`);
  if (eigen.og.length) { uit = uit.replace(/<meta property="og:[^"]*" content="[^"]*"\s*\/?>\s*/gi, ''); uit = uit.replace('</head>', eigen.og.join('\n') + '\n</head>'); }
  if (eigen.tw.length) { uit = uit.replace(/<meta name="twitter:[^"]*" content="[^"]*"\s*\/?>\s*/gi, ''); uit = uit.replace('</head>', eigen.tw.join('\n') + '\n</head>'); }
  const canonUrl = (eigen.canon && (eigen.canon.match(/href="([^"]*)"/) || [])[1]) || null;
  eigen.data = schoneSchemas(eigen.data, canonUrl);
  if (eigen.data.length) uit = uit.replace('</head>', eigen.data.join('\n') + '\n</head>');
  // Een stijlblok met een id dat de schil al meebrengt, komt maar één keer op
  // de pagina: op de plek van de schil, vóór de eigen opmaak van de pagina.
  // Stond hij er ná de pagina nog een keer, dan won de gedeelde regel het van
  // de eigen regel met dezelfde specificiteit (zie zonderSchilblokken).
  const eigenCss = eigenKoppelingen(eigen.koppel, stijlBasis).concat(zonderSchilblokken(eigen.stijl, shell.voor)).join('\n');
  uit = uit.replace('</head>', `${eigenCss}\n${PAGE_SHELL_CSS}\n</head>`);
  uit = ensureKnowledgeNavigation(routerLaatLinksDoor(knoppenNaarLinks(uit)));
  uit = absolutiseerInterneHref(uit);
  return markPageSlots(uit);
}

async function publiekePaginas() {
  const uit = [];
  for (const map of MAPPEN) {
    let items; try { items = await readdir(map, { withFileTypes: true }); } catch { continue; }
    for (const item of items) {
      if (map === '.' && item.isFile() && item.name.endsWith('.html') && !PUBLIC_PAGE_EXCLUDES.has(item.name) && !EXTRA_EXCLUDES.has(item.name)) uit.push(item.name);
      if (map === 'blog' && item.isDirectory()) uit.push(join('blog', item.name, 'index.html'));
    }
  }
  // De kennisbank is een eigen, indexeerbare route, maar hoort wel in dezelfde
  // kop en voet. Zonder deze regel hield /kennis/ de oude lichte kop, een eigen
  // voet en geen mobiel menu.
  uit.push('kennis/index.html');
  return uit;
}

export async function applyCanonicalShellToAllPages(sourcePath = CANONICAL_SHELL_SOURCE) {
  const sourceRaw = await readFile(sourcePath, 'utf8');
  const sourcePrepared = ensureBrandShellCss(ensureFooterContact(ensureTrustBar(sourceRaw)));
  const shell = schilUitBron(sourcePrepared, sourcePath);
  const sourceCanonical = ensureKnowledgeNavigation(absolutiseerInterneHref(shell.bron));
  await writeFile(sourcePath, sourceCanonical, 'utf8');
  const homeRaw = await readFile('index.html', 'utf8');
  const homePrepared = ensureBrandShellCss(ensureFooterContact(ensureTrustBar(homeRaw)));
  const homeProjected = ensureKnowledgeNavigation(absolutiseerInterneHref(projectGlobalComponents(homePrepared, sourceCanonical)));
  await writeFile('index.html', homeProjected, 'utf8');

  const stijlBasis = await readFile('assets/stijl.css', 'utf8').catch(() => null);
  let gelukt = 2, overgeslagen = 0;
  for (const pad of await publiekePaginas()) {
    if (pad === sourcePath) continue;
    let oud; try { oud = await readFile(pad, 'utf8'); } catch { continue; }
    let nieuw;
    try { nieuw = applyCanonicalShell(oud, shell, pad, stijlBasis); } catch (error) { console.warn(`Canonical shell overgeslagen (${pad}): ${error.message}`); overgeslagen++; continue; }
    if (!nieuw) { console.warn(`Canonical shell overgeslagen (${pad}): geen migreerbare hoofdinhoud gevonden`); overgeslagen++; continue; }
    await writeFile(pad, nieuw, 'utf8'); gelukt++;
  }
  console.log(`Canonical brand shell uit ${sourcePath} toegepast op ${gelukt} pagina's, ${overgeslagen} overgeslagen`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await applyCanonicalShellToAllPages();