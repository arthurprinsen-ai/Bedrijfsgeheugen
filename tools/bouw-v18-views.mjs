import { readFile, writeFile, rm } from 'node:fs/promises';
import { INTERACTIE_CSS, INTERACTIE_JS, ORGANISATIE_SCHEMA, EXTRA_HTML, mensenblok, schemas,
         volgendeStap, VOLGENDE_CSS } from './v18-verrijking.mjs';
import { INHOUD_CSS, kruimelpad, zetKop, HERO_URL } from './bouw-v18-chrome.mjs';
import { VIEWS } from './v18-views-lijst.mjs';
import { zoekwoordVoor, HOMEPAGE_WOORD, titelVoor } from './zoekwoorden.mjs';
import { MODULE_CSS, MODULE_JS, PORTAALBEELD, SPEELS_CSS, SPEELS_JS, LEK, VRAAG_CSS, VRAAG_JS, VRAAGBALK,
         VERTREK, bouwModules, hoofdletterMerk, CONTEXT_CSS, CONTEXT_JS, RING, rolblok } from './v18-modules.mjs';

// De navigatie van de homepage is leidend. Elke weergave uit de eenpagina-app
// wordt hier een echte pagina, met eigen titel, omschrijving en adres. Waar een
// oude pagina hetzelfde adres had, wordt die vervangen — niet naast elkaar gezet.

const PAD = {
  home: '/', product: '/product', pricing: '/prijzen', solutions: '/oplossingen',
  integrations: '/systemen-koppelen', resources: '/blog/', company: '/over-ons',
  cases: '/cases', login: '/inloggen', signup: '/aanmelden', selfscan: '/zelfscan',
  'frisseblik-scan': '/frisse-blik', start: '/start', more: '/meer'
};




function alleenDezeWeergave(html, view) {
  const grenzen = [];
  const re = /<div class="page(?: active)?" id="view-([a-z0-9-]+)">/g;
  let m;
  while ((m = re.exec(html)) !== null) grenzen.push({ naam: m[1], start: m.index });
  const eindMain = html.indexOf('</main>');
  for (let i = 0; i < grenzen.length; i++) {
    grenzen[i].eind = i + 1 < grenzen.length ? grenzen[i + 1].start : eindMain;
  }
  const doel = grenzen.filter(g => g.naam === view);
  if (doel.length !== 1) throw new Error(`weergave ${view} niet precies een keer gevonden`);
  let uit = '', vorig = 0;
  for (const g of grenzen) {
    uit += html.slice(vorig, g.start);
    if (g.naam === view) {
      uit += html.slice(g.start, g.eind).replace(`<div class="page" id="view-${view}">`, `<div class="page active" id="view-${view}">`);
    }
    vorig = g.eind;
  }
  return uit + html.slice(vorig);
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
  return html.includes(oud)
    ? html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);")
    : html;
}

const bron = await readFile('index.html', 'utf8');
let gemaakt = 0;

for (const p of VIEWS) {
  let html = alleenDezeWeergave(bron, p.view);
  html = knoppenNaarLinks(html);
  html = routerLaatLinksDoor(html);

  const canoniek = 'https://www.bedrijfsgeheugen.nl' + p.pad;

  // kruimelpad direct onder de weergave, zodat bezoeker en zoekmachine de plek zien
  // Elke pagina begint blauw, met dezelfde videohero als de rest van de site.
  // De weergave heeft zelf al een kop; die zakt daaronder een niveau, zodat er
  // precies één h1 op de pagina staat.
  const hero = `<section class="inhoud-kop">
<video autoplay muted playsinline loop preload="metadata" aria-hidden="true"><source src="${HERO_URL}" type="video/mp4"></video>
<div class="wrap">
<div class="hero-kicker"><span></span> ${p.naam.toUpperCase()}</div>
<h1>${p.h1 || p.naam}</h1>
<p class="intro">${p.omschrijving}</p>
</div></section>`;

  const { body: rekenaar } = bouwModules('');
  const bovenblok = `<section class="inhoud-body" style="padding:34px 0 6px"><div class="wrap">${VRAAGBALK}${rekenaar}${rolblok(p.naam.toLowerCase())}</div></section>`;

  html = html.replace(`<div class="page active" id="view-${p.view}">`,
    `<div class="page active" id="view-${p.view}">${hero}`
    + `${kruimelpad([{ naam: 'Home', url: '/' }, { naam: p.naam }])}${bovenblok}`);

  // de secties van deze weergave komen op bij het scrollen, net als op de homepage
  {
    const start = html.indexOf(`<div class="page active" id="view-${p.view}">`);
    const eind = html.indexOf('</main>', start);
    // de hero zelf krijgt géén data-op: die moet zichtbaar zijn ook als er
    // geen JavaScript draait
    const stuk = html.slice(start, eind).replace(/<section(?![^>]*data-op)(?![^>]*class="inhoud-kop")([^>]*)>/g, '<section$1 data-op>');
    html = html.slice(0, start) + stuk + html.slice(eind);
  }

  // het portaalbeeld stond als plaatjebestand in de HTML, maar dat bestand bestaat
  // niet — vandaar het gebroken beeld. We tekenen het nu in de pagina zelf.
  html = html.replace(/<img[^>]*portal-v18-full\.png[^>]*>/g, PORTAALBEELD);

  html = html.replace('</head>', `${INHOUD_CSS}\n${INTERACTIE_CSS}\n${MODULE_CSS}\n${SPEELS_CSS}\n${VRAAG_CSS}\n${VOLGENDE_CSS}\n${CONTEXT_CSS}\n</head>`);
  // onderaan: de afsluiting
  html = html.replace('</main>',
    `<section class="inhoud-body" style="padding:10px 0 96px"><div class="wrap">${VERTREK}`
    + `${volgendeStap(false)}${mensenblok(false)}</div></section></main>`);
  html = html.replace('</body>', `${EXTRA_HTML}\n${RING}\n${LEK}\n${INTERACTIE_JS}\n${MODULE_JS}\n${SPEELS_JS}\n${VRAAG_JS}\n${CONTEXT_JS}\n${ORGANISATIE_SCHEMA}\n`
    + `${schemas({ isBlog: false, titel: p.titel, omschrijving: p.omschrijving, canoniek, h1: p.naam, body: html })}\n</body>`);

  // de hero levert de h1; een tweede h1 in de weergave zakt naar h2
  {
    const s = html.indexOf(`id="view-${p.view}"`);
    const na = html.slice(s).replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/, (heel, attrs, inhoud, off) =>
      off > 1200 ? `<h2${attrs}>${inhoud}</h2>` : heel);
    html = html.slice(0, s) + na;
  }

  // elke pagina één h1: de weergaven beginnen met een h2
  if (!/<h1[\s>]/.test(html.slice(html.indexOf(`id="view-${p.view}"`)))) {
    const start = html.indexOf(`id="view-${p.view}"`);
    const stuk = html.slice(start);
    const vervangen = stuk.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/, (heel, attrs, inhoud) => `<h1${attrs}>${inhoud}</h1>`);
    html = html.slice(0, start) + vervangen;
  }

  const geerfd = (p.zoekwoord || '').trim();
  const eigenZoekwoord = zoekwoordVoor(p.bestand)
    || (geerfd && geerfd.toLowerCase() !== HOMEPAGE_WOORD ? geerfd : '');
  html = zetKop(html, titelVoor(p.bestand) || p.titel, p.omschrijving, canoniek, eigenZoekwoord);
  if (!eigenZoekwoord) html = html.replace(/<meta name="bg-zoekwoord"[^>]*>\s*/g, '');
  if (p.geenIndex && !/name="robots"/.test(html)) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>');
  }

  html = hoofdletterMerk(html);
  await writeFile(p.bestand, html, 'utf8');
  gemaakt++;
}

// de oude losse bestanden die nu dubbel zouden staan
for (const weg of ['index-oud.html', 'afmaakindex.html.oud']) {
  await rm(weg, { force: true });
}

console.log(`Weergaven als pagina geschreven: ${gemaakt}`);
