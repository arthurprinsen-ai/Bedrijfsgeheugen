import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { leesSchil, bouwPagina, zetKop, kruimelpad, INHOUD_CSS } from './bouw-v18-chrome.mjs';
import { INTERACTIE_CSS, INTERACTIE_JS, ORGANISATIE_SCHEMA, EXTRA_HTML, mensenblok, volgendeStap, VOLGENDE_CSS , GEGEVENS, LOCATIE_SCHEMA} from './v18-verrijking.mjs';
import { VERVANGEN } from './v18-views-lijst.mjs';
import { zoekwoordVoor, titelVoor } from './zoekwoorden.mjs';
import { knoppenNaarLinks, HERO_URL, routerLaatLinksDoor } from './bouw-v18-chrome.mjs';
import { BEWEGING_CSS, BEWEGING_JS, vergelijker, maakBeweeglijk } from './v18-beweging.mjs';
import { MODULE_CSS, MODULE_JS, PORTAALBEELD, hoofdletterMerk, SPEELS_CSS, SPEELS_JS, LEK, VERTREK,
         VRAAGBALK, VRAAG_CSS, VRAAG_JS, CONTEXT_CSS, CONTEXT_JS, RING, rolblok, bouwModules } from './v18-modules.mjs';

function metGegevens(html) {
  if (html.includes('<div class="bgx-gegevens">')) return html;
  return html.replace('<header class="v17-header"', '<header class="v17-header"')
             .replace('</body>', LOCATIE_SCHEMA + '\n</body>');
}

const OVERSLAAN = new Set([
  'index.html', 'prototype-v18-stable.html', 'prijzen.html', 'cases.html',
  'index-oud.html',
  'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html',
  // Volledig zelfstandige canonical trust-centerpagina: behoud bronmarkup,
  // shell, structured data en eigen audit/print-interactie exact zoals getest.
  'compliance-status.html'
]);

for (const p of JSON.parse(await readFile('site/inhoudspaginas.json', 'utf8'))) {
  OVERSLAAN.add(p.bestand);
}
for (const b of VERVANGEN) OVERSLAAN.add(b);

const schil = await leesSchil('index.html');
const basisCss = await readFile('assets/stijl.css', 'utf8');

const bestanden = [];
for await (const p of glob('*.html')) if (!OVERSLAAN.has(p)) bestanden.push(p);
for await (const p of glob('blog/*/index.html')) bestanden.push(p);
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

const v18Paginas = [
  ...JSON.parse(await readFile('site/inhoudspaginas.json', 'utf8')).map(p => ({ bestand: p.bestand, pad: p.pad, naam: p.h1 || p.kicker })),
];

for (const p of v18Paginas) {
  let html;
  try { html = await readFile(p.bestand, 'utf8'); } catch { continue; }
  const titel = tussen(html, /<title>([\s\S]*?)<\/title>/i);
  const omschrijving = tussen(html, /<meta name="description" content="([^"]*)"/i);
  const canoniek = tussen(html, /<link rel="canonical" href="([^"]+)"/i) || 'https://www.bedrijfsgeheugen.nl' + p.pad;

  const eigenZoekwoord = zoekwoordVoor(p.bestand);
  html = zetKop(html, titelVoor(p.bestand) || titel, omschrijving, canoniek, eigenZoekwoord);
  if (!eigenZoekwoord) html = html.replace(/<meta name="bg-zoekwoord"[^>]*>\s*/g, '');

  if (!html.includes('inhoud-kruim')) {
    const mainStart = html.indexOf('<main');
    const na = html.indexOf('>', mainStart) + 1;
    html = html.slice(0, na)
      + kruimelpad([{ naam: 'Home', url: '/' }, { naam: p.naam }])
      + html.slice(na);
    html = html.replace('</head>', INHOUD_CSS + '\n</head>');
  }
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

{
  let home = await readFile('index.html', 'utf8');
  home = home.replace(/<img[^>]*portal-v18-full\.png[^>]*>/g, PORTAALBEELD);
  if (!home.includes('v18-modules')) {
    home = home.replace('</head>', MODULE_CSS + '\n</head>').replace('</body>', MODULE_JS + '\n</body>');
  }
  if (!home.includes('v18-speels')) {
    home = home.replace('</head>', SPEELS_CSS + '\n</head>');
    home = home.replace('</main>', VERTREK + '</main>');
    home = home.replace('</body>', LEK + '\n' + EXTRA_HTML + '\n' + SPEELS_JS + '\n' + INTERACTIE_JS + '\n</body>');
  }
  if (!home.includes('"@type":"Organization"')) {
    home = home.replace('</body>', ORGANISATIE_SCHEMA + '\n</body>');
  }
  home = home.replace(/\/assets\/openart-hero-iphone-safe-v1\.mp4/g, HERO_URL);

  if (!home.includes('bgx-vraagbalk"')) {
    const { body: rekenaar } = bouwModules('');
    const blok = `<section class="inhoud-body" style="padding:44px 0"><div class="wrap">`
      + VRAAGBALK + rekenaar + rolblok('bedrijfsgeheugen') + vergelijker('een werkend bedrijfsgeheugen') + `</div></section>`;
    const naHero = home.indexOf('</section>', home.indexOf('id="view-home"'));
    home = naHero === -1
      ? home.replace('</main>', blok + '</main>')
      : home.slice(0, naHero + 10) + blok + home.slice(naHero + 10);
    const blauw = `<style id="v18-home-blauw">
.hero-video .hero-video-shade,.hero-inspiration .hero-video-shade{
  background:radial-gradient(120% 90% at 12% 0%,rgba(80,120,255,.34),transparent 60%),
             linear-gradient(180deg,rgba(7,26,60,.66),rgba(7,26,60,.92))!important}
</style>`;
    home = home.replace('</head>', INHOUD_CSS + '\n' + VRAAG_CSS + '\n' + CONTEXT_CSS + '\n' + BEWEGING_CSS + '\n' + blauw + '\n</head>');
    home = home.replace('</body>', RING + '\n' + VRAAG_JS + '\n' + CONTEXT_JS + '\n' + BEWEGING_JS + '\n</body>');
    home = maakBeweeglijk(home);
  }

  home = metGegevens(home);
  home = routerLaatLinksDoor(home);
  home = hoofdletterMerk(home);
  await writeFile('index.html', home, 'utf8');
}

console.log(`V18-schil om ${goed} paginas gezet, ${v18Paginas.length} v18-paginas nagelopen`);
if (fouten.length) {
  console.error('Niet gelukt:\n' + fouten.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}

{
  const voorbeeld = await readFile('over-ons.html', 'utf8');
  const kop = voorbeeld.match(/<header class="v17-header"[\s\S]*?<\/header>/);
  const voet = voorbeeld.match(/<footer[\s\S]*?<\/footer>/);
  if (kop) await writeFile('.github/canoniek/kop.html', kop[0], 'utf8');
  if (voet) await writeFile('.github/canoniek/voet.html', voet[0], 'utf8');
}

for await (const p of glob('components/*/*.html')) {
  let h = await readFile(p, 'utf8');
  if (!/name="robots"/i.test(h)) {
    h = h.includes('</head>')
      ? h.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>')
      : '<meta name="robots" content="noindex, follow">\n' + h;
    await writeFile(p, h, 'utf8');
  }
}

{
  const FOTOS = {
    "3184360": "/assets/foto/sfeer-3184360.jpg",
    "3184423": "/assets/foto/sfeer-3184423.jpg",
    "3184465": "/assets/foto/sfeer-3184465.jpg",
    "36733421": "/assets/foto/sfeer-36733421.jpg",
    "5673494": "/assets/foto/sfeer-5673494.jpg",
    "7710178": "/assets/foto/sfeer-7710178.jpg"
};
  for (const p of await allePaginas()) {
    let h = await readFile(p, 'utf8');
    let veranderd = false;
    for (const [nummer, doel] of Object.entries(FOTOS)) {
      const patroon = new RegExp('https://images\\.pexels\\.com/photos/' + nummer + '/[^"\'\\s)]*', 'g');
      if (patroon.test(h)) { h = h.replace(patroon, doel); veranderd = true; }
    }
    if (h.includes('<img') && !h.includes('loading="lazy"')) {
      h = h.replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
      veranderd = true;
    }
    if (veranderd) await writeFile(p, h, 'utf8');
  }
}

async function allePaginas() {
  const uit = [];
  for await (const p of glob('*.html')) uit.push(p);
  for await (const p of glob('blog/*/index.html')) uit.push(p);
  uit.push('blog/index.html');
  return [...new Set(uit)];
}

{
  const nu = new Date();
  const stempel = nu.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const merk = `<p class="bgx-stempel">versie ${stempel}</p>`;
  const wachter = `<script id="v18-versiewachter">
(function(){
  var mijn = ${JSON.stringify(nu.toISOString())};
  try {
    if (sessionStorage.getItem('bg-herladen') === mijn) return;
    fetch('/versie.txt', { cache: 'no-store' }).then(function(r){ return r.text(); }).then(function(t){
      var live = (t || '').trim();
      if (!live || live === mijn) return;
      sessionStorage.setItem('bg-herladen', mijn);
      location.reload();
    }).catch(function(){});
  } catch (e) {}
})();
</script>`;
  await writeFile('versie.txt', nu.toISOString(), 'utf8');
  const stijl = `<style id="v18-stempel">.bgx-stempel{margin:0;padding:14px 0 22px;text-align:center;font-size:11px;
    letter-spacing:.06em;color:rgba(255,255,255,.34);font-family:'IBM Plex Mono',ui-monospace,monospace}</style>`;
  for (const p of await allePaginas()) await stempelOp(p);

  async function stempelOp(pad) {
    let h = await readFile(pad, 'utf8');
    if (h.includes('bgx-stempel') || !h.includes('</footer>')) return;
    h = h.replace('</head>', stijl + '\n</head>');
    h = h.replace('</footer>', merk + '</footer>');
    if (!OVERSLAAN.has(pad)) h = h.replace('</body>', wachter + '\n</body>');
    await writeFile(pad, h, 'utf8');
  }
}

await import('./bouw-sitemap.mjs');