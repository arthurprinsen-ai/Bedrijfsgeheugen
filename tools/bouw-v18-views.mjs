import { readFile, writeFile, rm } from 'node:fs/promises';
import { INTERACTIE_CSS, INTERACTIE_JS, ORGANISATIE_SCHEMA, EXTRA_HTML, mensenblok, schemas } from './v18-verrijking.mjs';
import { INHOUD_CSS, kruimelpad, zetKop } from './bouw-v18-chrome.mjs';
import { VIEWS } from './v18-views-lijst.mjs';
import { MODULE_CSS, MODULE_JS, PORTAALBEELD, SPEELS_CSS, SPEELS_JS, LEK, VRAAG_CSS, VRAAG_JS, hoofdletterMerk } from './v18-modules.mjs';

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
  html = html.replace(`<div class="page active" id="view-${p.view}">`,
    `<div class="page active" id="view-${p.view}">${kruimelpad([{ naam: 'Home', url: '/' }, { naam: p.naam }])}`);

  // de secties van deze weergave komen op bij het scrollen, net als op de homepage
  {
    const start = html.indexOf(`<div class="page active" id="view-${p.view}">`);
    const eind = html.indexOf('</main>', start);
    const stuk = html.slice(start, eind).replace(/<section(?![^>]*data-op)([^>]*)>/g, '<section$1 data-op>');
    html = html.slice(0, start) + stuk + html.slice(eind);
  }

  // het portaalbeeld stond als plaatjebestand in de HTML, maar dat bestand bestaat
  // niet — vandaar het gebroken beeld. We tekenen het nu in de pagina zelf.
  html = html.replace(/<img[^>]*portal-v18-full\.png[^>]*>/g, PORTAALBEELD);

  html = html.replace('</head>', `${INHOUD_CSS}\n${INTERACTIE_CSS}\n${MODULE_CSS}\n${SPEELS_CSS}\n${VRAAG_CSS}\n</head>`);
  html = html.replace('</main>',
    `<section class="inhoud-body"><div class="wrap">${mensenblok(false)}</div></section></main>`);
  html = html.replace('</body>', `${EXTRA_HTML}\n${LEK}\n${INTERACTIE_JS}\n${MODULE_JS}\n${SPEELS_JS}\n${VRAAG_JS}\n${ORGANISATIE_SCHEMA}\n`
    + `${schemas({ isBlog: false, titel: p.titel, omschrijving: p.omschrijving, canoniek, h1: p.naam, body: html })}\n</body>`);

  // elke pagina één h1: de weergaven beginnen met een h2
  if (!/<h1[\s>]/.test(html.slice(html.indexOf(`id="view-${p.view}"`)))) {
    const start = html.indexOf(`id="view-${p.view}"`);
    const stuk = html.slice(start);
    const vervangen = stuk.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/, (heel, attrs, inhoud) => `<h1${attrs}>${inhoud}</h1>`);
    html = html.slice(0, start) + vervangen;
  }

  html = zetKop(html, p.titel, p.omschrijving, canoniek, p.zoekwoord);
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
