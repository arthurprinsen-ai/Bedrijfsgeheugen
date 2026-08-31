import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Zet elke bestaande pagina in dezelfde schil als de homepage: zelfde kop,
// megamenu, voet, opmaak en scripts. De eigen inhoud van de pagina (alles
// tussen <main> en </main>) en de eigen SEO-gegevens blijven ongemoeid.
// Draait NA bouw-v18-production-core.mjs, want die schrijft index.html.

const PAD = {
  home: '/', product: '/product', pricing: '/prijzen', solutions: '/oplossingen',
  integrations: '/systemen-koppelen', resources: '/blog/', company: '/over-ons',
  cases: '/cases', login: '/inloggen', signup: '/aanmelden', selfscan: '/zelfscan',
  'frisseblik-scan': '/frisse-blik', start: '/aanmelden'
};

// Deze laten we met rust: de homepage zelf, gegenereerde pagina's, losse apps en fragmenten.
const OVERSLAAN = new Set([
  'index.html', 'index-oud.html', 'prijzen.html', 'cases.html', 'partners.html',
  'onderzoeken.html', 'templates.html', 'security.html', 'juridisch.html',
  'help.html', 'changelog.html', 'klantportaal.html', 'klantportaal-demo.html',
  'klant-login.html', 'afmaakindex.html'
]);
const MAPPEN = ['.', 'blog'];

const SLOTSTIJL = `<style id="uniforme-schil">
header.v17-header{background:rgba(12,16,20,.96);border-bottom:1px solid rgba(255,255,255,.10)}
header a,header a:visited,header a:hover,header .brand,header .navbtn,header .login{color:#fff}
header .brand{text-decoration:none}
main,.page{background:var(--paper,#fff)}
.page>main{padding:0}
.bgkruim,.kruimelpad{font-size:13px;padding:18px 0 0}
</style>`;

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
  if (!html.includes(oud)) throw new Error('uniforme schil: routerregel niet gevonden');
  return html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);");
}

function schilUitHomepage(html) {
  const eerste = html.search(/<div class="page(?: active)?" id="view-[a-z0-9-]+">/);
  const eindMain = html.indexOf('</main>');
  if (eerste === -1 || eindMain === -1) throw new Error('uniforme schil: schil niet te bepalen');
  return { voor: html.slice(0, eerste), na: html.slice(eindMain) };
}

// Alles uit de oude <head> dat bij de pagina hoort en niet bij de schil.
function eigenHoofd(oud) {
  const stukken = [];
  const titel = oud.match(/<title>[\s\S]*?<\/title>/i);
  const desc = oud.match(/<meta name="description" content="[^"]*"\s*\/?>/i);
  const canon = oud.match(/<link rel="canonical" href="[^"]*"\s*\/?>/i);
  const og = oud.match(/<meta property="og:[^"]*" content="[^"]*"\s*\/?>/gi) || [];
  const tw = oud.match(/<meta name="twitter:[^"]*" content="[^"]*"\s*\/?>/gi) || [];
  const data = oud.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
  const stijl = oud.match(/<style[\s\S]*?<\/style>/gi) || [];
  const koppel = (oud.match(/<link rel="stylesheet"[^>]*>/gi) || []);
  return { titel: titel && titel[0], desc: desc && desc[0], canon: canon && canon[0], og, tw, data, stijl, koppel, stukken };
}

function tekstUit(html) {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function kruimelSchemaVoor(label, pad) {
  if (pad === '404.html' || !label) return null;
  const url = 'https://www.bedrijfsgeheugen.nl/' + pad.replace(/index\.html$/, '').replace(/\.html$/, '');
  return `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://www.bedrijfsgeheugen.nl/"},{"@type":"ListItem","position":2,"name":"${label}","item":"${url}"}]}<\/script>`;
}

function kruimelErbij(binnen, oud, pad) {
  if (/aria-label="Kruimelpad"/i.test(binnen)) {
    if (/BreadcrumbList/.test(oud)) return { binnen, schema: null };
    const laatste = binnen.match(/aria-current="page"[^>]*>([\s\S]*?)<\/span>/i);
    const label = laatste ? tekstUit(laatste[1]).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : '';
    return { binnen, schema: kruimelSchemaVoor(label, pad) };
  }
  const h1 = oud.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titel = oud.match(/<title>([\s\S]*?)<\/title>/i);
  let label = h1 ? tekstUit(h1[1]) : (titel ? tekstUit(titel[1]).split('|')[0].split(' \u2014 ')[0] : '');
  label = label.replace(/[.:]$/, '').trim();
  if (!label) return { binnen, schema: null };
  if (label.length > 60) label = label.slice(0, 57).trim() + '...';
  const veilig = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nav = `<nav class="bgkruim" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">\u203a</span><span aria-current="page">${veilig}</span></nav>\n`;
  const schema = kruimelSchemaVoor(veilig, pad);
  return { binnen: nav + binnen, schema };
}

function zetInSchil(schil, oud, pad) {
  const main = oud.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!main) return null;
  const eigen = eigenHoofd(oud);

  const kruimel = kruimelErbij(main[1], oud, pad);
  let html = schil.voor + `<div class="page active" id="view-inhoud">\n<main>${kruimel.binnen}</main>\n</div>\n` + schil.na;
  if (kruimel.schema) eigen.data.push(kruimel.schema);

  if (eigen.titel) html = html.replace(/<title>[\s\S]*?<\/title>/i, eigen.titel);
  if (eigen.desc) html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, eigen.desc);
  if (eigen.canon) {
    html = /<link rel="canonical"/i.test(html)
      ? html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, eigen.canon)
      : html.replace('</head>', `${eigen.canon}\n</head>`);
  }
  // og en twitter uit de schil weghalen, die van de pagina zetten
  if (eigen.og.length) {
    html = html.replace(/<meta property="og:[^"]*" content="[^"]*"\s*\/?>\s*/gi, '');
    html = html.replace('</head>', eigen.og.join('\n') + '\n</head>');
  }
  if (eigen.tw.length) {
    html = html.replace(/<meta name="twitter:[^"]*" content="[^"]*"\s*\/?>\s*/gi, '');
    html = html.replace('</head>', eigen.tw.join('\n') + '\n</head>');
  }
  // eigen gestructureerde data van de pagina toevoegen (kruimelpad, artikel, faq)
  if (eigen.data.length) html = html.replace('</head>', eigen.data.join('\n') + '\n</head>');
  // eigen opmaak van de pagina na die van de schil, daarna onze slotregels
  const eigenCss = eigen.koppel.concat(eigen.stijl).join('\n');
  html = html.replace('</head>', `${eigenCss}\n${SLOTSTIJL}\n</head>`);

  html = knoppenNaarLinks(html);
  html = routerLaatLinksDoor(html);
  return html;
}

async function paginas() {
  const uit = [];
  for (const map of MAPPEN) {
    let items;
    try { items = await readdir(map, { withFileTypes: true }); } catch { continue; }
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.html') && map === '.') {
        if (!OVERSLAAN.has(item.name)) uit.push(item.name);
      }
      if (item.isDirectory() && map === 'blog') {
        uit.push(join('blog', item.name, 'index.html'));
      }
    }
  }
  return uit;
}

const homepage = await readFile('index.html', 'utf8');
const schil = schilUitHomepage(homepage);

let gelukt = 0, overgeslagen = 0;
for (const pad of await paginas()) {
  let oud;
  try { oud = await readFile(pad, 'utf8'); } catch { continue; }
  if (oud.includes('id="uniforme-schil"')) { gelukt++; continue; }
  let nieuw = null;
  try { nieuw = zetInSchil(schil, oud, pad); } catch (e) {
    console.warn(`Uniforme schil overgeslagen (${pad}): ${e.message}`);
    overgeslagen++;
    continue;
  }
  if (!nieuw) { console.warn(`Uniforme schil overgeslagen (${pad}): geen <main> gevonden`); overgeslagen++; continue; }
  await writeFile(pad, nieuw, 'utf8');
  gelukt++;
}
console.log(`Uniforme schil toegepast op ${gelukt} pagina's, ${overgeslagen} overgeslagen`);
