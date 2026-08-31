import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { leesSchil, bouwPagina, zetKop, kruimelpad, INHOUD_CSS } from './bouw-v18-chrome.mjs';
import { INTERACTIE_CSS, INTERACTIE_JS, ORGANISATIE_SCHEMA, EXTRA_HTML, mensenblok, volgendeStap, VOLGENDE_CSS } from './v18-verrijking.mjs';
import { VERVANGEN } from './v18-views-lijst.mjs';
import { knoppenNaarLinks } from './bouw-v18-chrome.mjs';
import { MODULE_CSS, MODULE_JS, PORTAALBEELD, hoofdletterMerk } from './v18-modules.mjs';

// Zet elke contentpagina in dezelfde v18-schil: kop, navigatie, videoband,
// kruimelpad, voet en opmaak. Titel, omschrijving, canoniek en het zoekwoord
// blijven van de pagina zelf — die zijn per pagina bepaald in de zoekwoordstrategie.
//
// Draait tijdens de build, ná bouw-v18-production.mjs. De bestanden in de repo
// blijven de leesbare bron; de v18-schil komt er in de build omheen.

// deze staan al in v18 of horen geen sitekop te hebben
const OVERSLAAN = new Set([
  'index.html', 'prototype-v18-stable.html', 'prijzen.html', 'cases.html',
  'index-oud.html',
  'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html'
]);

// de pagina's die de v18-build zelf schrijft dragen de schil al
for (const p of JSON.parse(await readFile('site/inhoudspaginas.json', 'utf8'))) {
  OVERSLAAN.add(p.bestand);
}
// en de weergaven uit de navigatie: die zijn hun eigen pagina geworden
for (const b of VERVANGEN) OVERSLAAN.add(b);

const schil = await leesSchil('index.html');
const basisCss = await readFile('assets/stijl.css', 'utf8');

const bestanden = [];
for await (const p of glob('*.html')) if (!OVERSLAAN.has(p)) bestanden.push(p);
for await (const p of glob('blog/*/index.html')) bestanden.push(p);
// de blogindex zelf valt buiten beide patronen hierboven
if (!OVERSLAAN.has('blog/index.html')) bestanden.push('blog/index.html');
bestanden.sort();

function tussen(html, patroon) {
  const m = html.match(patroon);
  return m ? m[1].trim() : '';
}

function padVan(bestand) {
  if (bestand.endsWith('/index.html')) return '/' + bestand.slice(0, -'index.html'.length);
  return '/' + bestand.replace(/\.html$/, '');
}

// het kruimelpad van de pagina zelf overnemen; anders er een afleiden
function kruimelsVan(html, bestand) {
  const blok = html.match(/<nav class="bgkruim"[^>]*>([\s\S]*?)<\/nav>/);
  if (blok) {
    const schakels = [...blok[1].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<span aria-current="page">([\s\S]*?)<\/span>/g)]
      .map(m => m[3] !== undefined
        ? { naam: m[3].replace(/<[^>]+>/g, '').trim() }
        : { url: m[1], naam: m[2].replace(/<[^>]+>/g, '').trim() });
    if (schakels.length) return schakels;
  }
  const h1 = tussen(html, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, '').trim();
  const naam = h1 || padVan(bestand).replace(/\//g, '').replace(/-/g, ' ');
  if (bestand.startsWith('blog/')) {
    return [{ naam: 'Home', url: '/' }, { naam: 'Blog', url: '/blog/' }, { naam }];
  }
  return [{ naam: 'Home', url: '/' }, { naam }];
}

let goed = 0;
const fouten = [];

for (const bestand of bestanden) {
  const oud = await readFile(bestand, 'utf8');
  try {
    const canoniek = tussen(oud, /<link rel="canonical" href="([^"]+)"/i)
      || 'https://www.bedrijfsgeheugen.nl' + padVan(bestand);
    await bouwPagina({
      schil, basisCss, bestand, doel: bestand,
      titel: tussen(oud, /<title>([\s\S]*?)<\/title>/i),
      omschrijving: tussen(oud, /<meta name="description" content="([^"]*)"/i),
      canoniek,
      zoekwoord: tussen(oud, /<meta name="bg-zoekwoord" content="([^"]*)"/i),
      kruimels: kruimelsVan(oud, bestand)
    });
    goed++;
  } catch (e) {
    fouten.push(`${bestand}: ${e.message}`);
  }
}

// ── de pagina's die de v18-build zelf schrijft: deelkaarten en kruimelpad ──
// Zij erven de kop en voet al, maar dragen de og-tags van de homepage en
// hebben geen kruimelpad. Dat trekken we hier recht.
const v18Paginas = [
  ...JSON.parse(await readFile('site/inhoudspaginas.json', 'utf8')).map(p => ({ bestand: p.bestand, pad: p.pad, naam: p.h1 || p.kicker })),
];

for (const p of v18Paginas) {
  let html;
  try { html = await readFile(p.bestand, 'utf8'); } catch { continue; }
  const titel = tussen(html, /<title>([\s\S]*?)<\/title>/i);
  const omschrijving = tussen(html, /<meta name="description" content="([^"]*)"/i);
  const canoniek = tussen(html, /<link rel="canonical" href="([^"]+)"/i) || 'https://www.bedrijfsgeheugen.nl' + p.pad;

  html = zetKop(html, titel, omschrijving, canoniek, tussen(html, /<meta name="bg-zoekwoord" content="([^"]*)"/i));

  if (!html.includes('inhoud-kruim')) {
    const mainStart = html.indexOf('<main');
    const na = html.indexOf('>', mainStart) + 1;
    html = html.slice(0, na)
      + kruimelpad([{ naam: 'Home', url: '/' }, { naam: p.naam }])
      + html.slice(na);
    html = html.replace('</head>', INHOUD_CSS + '\n</head>');
  }
  // zonder h1 weet Google niet waar de pagina over gaat: de eerste h2 wordt kop
  if (!/<h1[\s>]/.test(html)) {
    html = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/, (heel, attrs, inhoud) => `<h1${attrs}>${inhoud}</h1>`);
  }
  html = knoppenNaarLinks(html);
  if (!html.includes('v18-interactie-js')) {
    html = html.replace(/<img[^>]*portal-v18-full\.png[^>]*>/g, PORTAALBEELD);
    html = html.replace('</head>', INTERACTIE_CSS + '\n' + VOLGENDE_CSS + '\n' + MODULE_CSS + '\n</head>');
    html = html.replace('</main>', '<section class="inhoud-body"><div class="wrap">' + volgendeStap(false) + mensenblok(false) + '</div></section></main>');
    html = html.replace('</body>', EXTRA_HTML + '\n' + INTERACTIE_JS + '\n' + MODULE_JS + '\n' + ORGANISATIE_SCHEMA + '\n</body>');
  }
  html = hoofdletterMerk(html);
  await writeFile(p.bestand, html, 'utf8');
}

// de homepage krijgt alleen het organisatieschema erbij; die heeft haar eigen beweging
{
  let home = await readFile('index.html', 'utf8');
  home = home.replace(/<img[^>]*portal-v18-full\.png[^>]*>/g, PORTAALBEELD);
  home = home.includes('v18-modules') ? home : home.replace('</head>', MODULE_CSS + '\n</head>').replace('</body>', MODULE_JS + '\n</body>');
  home = hoofdletterMerk(home);
  await writeFile('index.html', home, 'utf8');
  if (!home.includes('"@type":"Organization"')) {
    home = home.replace('</body>', ORGANISATIE_SCHEMA + '\n</body>');
    await writeFile('index.html', home, 'utf8');
  }
}

console.log(`V18-schil om ${goed} paginas gezet, ${v18Paginas.length} v18-paginas nagelopen`);
if (fouten.length) {
  console.error('Niet gelukt:\n' + fouten.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}

// de norm voor de controle komt uit de gebouwde homepage, zodat kop en voet
// nooit uit de pas lopen met wat er live staat
{
  // uit een omgezette pagina, niet uit de homepage: daar staan nog knoppen
  const voorbeeld = await readFile('over-ons.html', 'utf8');
  const kop = voorbeeld.match(/<header class="v17-header"[\s\S]*?<\/header>/);
  const voet = voorbeeld.match(/<footer[\s\S]*?<\/footer>/);
  if (kop) await writeFile('.github/canoniek/kop.html', kop[0], 'utf8');
  if (voet) await writeFile('.github/canoniek/voet.html', voet[0], 'utf8');
}

// De losse bouwstenen onder components/ zijn fragmenten, geen pagina's. Ze
// horen niet in Google: dunne inhoud die met echte pagina's concurreert.
for await (const p of glob('components/*/*.html')) {
  let h = await readFile(p, 'utf8');
  if (!/name="robots"/i.test(h)) {
    h = h.includes('</head>')
      ? h.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>')
      : '<meta name="robots" content="noindex, follow">\n' + h;
    await writeFile(p, h, 'utf8');
  }
}

// de sitemap als laatste, want pas nu bestaan alle pagina's
await import('./bouw-sitemap.mjs');
