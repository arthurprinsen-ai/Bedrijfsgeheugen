import { readFile, writeFile } from 'node:fs/promises';

// De homepage is een app met meerdere weergaven. Deze stap schrijft die weergaven
// ook weg als echte pagina's, met dezelfde kop, voet en opmaak.
// Draait NA bouw-v18-production-core.mjs, want die schrijft index.html.

const PAD = {
  home: '/', product: '/product', pricing: '/prijzen', solutions: '/oplossingen',
  integrations: '/systemen-koppelen', resources: '/blog/', company: '/over-ons',
  cases: '/cases', login: '/inloggen', signup: '/aanmelden', selfscan: '/zelfscan',
  'frisseblik-scan': '/frisse-blik', start: '/aanmelden'
};

const PAGINAS = [
  {
    view: 'pricing',
    bestand: 'prijzen.html',
    titel: 'Prijzen — vaste prijs, geen uurtje-factuurtje | Bedrijfsgeheugen',
    omschrijving: 'Wat Bedrijfsgeheugen kost: vaste prijzen per pakket, zonder uurtje-factuurtje, voor mkb-bedrijven van 3 tot 250 medewerkers.',
    canoniek: 'https://www.bedrijfsgeheugen.nl/prijzen'
  },
  {
    view: 'cases',
    bestand: 'cases.html',
    titel: 'Cases - van vastlopen naar werkend | Bedrijfsgeheugen',
    omschrijving: 'Voorbeelden uit de praktijk: waar mkb-bedrijven op vastliepen en wat er veranderde toen kennis, processen en systemen op orde kwamen.',
    canoniek: 'https://www.bedrijfsgeheugen.nl/cases'
  }
];

function alleenDezeWeergave(html, view) {
  const grenzen = [];
  const re = /<div class="page(?: active)?" id="view-([a-z0-9-]+)">/g;
  let m;
  while ((m = re.exec(html)) !== null) grenzen.push({ naam: m[1], start: m.index });
  const eindMain = html.indexOf('</main>');
  if (eindMain === -1) throw new Error('losse paginas: </main> niet gevonden');
  for (let i = 0; i < grenzen.length; i++) {
    grenzen[i].eind = i + 1 < grenzen.length ? grenzen[i + 1].start : eindMain;
  }
  if (grenzen.filter(g => g.naam === view).length !== 1) {
    throw new Error(`losse paginas: weergave ${view} niet precies een keer gevonden`);
  }
  let uit = '';
  let vorig = 0;
  for (const g of grenzen) {
    uit += html.slice(vorig, g.start);
    if (g.naam === view) {
      uit += html.slice(g.start, g.eind)
        .replace(`<div class="page" id="view-${view}">`, `<div class="page active" id="view-${view}">`);
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
  if (!html.includes(oud)) throw new Error('losse paginas: routerregel niet gevonden');
  return html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);");
}

function vervangEen(html, patroon, nieuw, label) {
  const treffers = html.match(new RegExp(patroon.source, patroon.flags.includes('g') ? patroon.flags : patroon.flags + 'g')) || [];
  if (treffers.length !== 1) throw new Error(`${label}: verwacht een treffer, gevonden ${treffers.length}`);
  return html.replace(patroon, nieuw);
}

const bron = await readFile('index.html', 'utf8');

for (const p of PAGINAS) {
  let html = alleenDezeWeergave(bron, p.view);
  html = knoppenNaarLinks(html);
  html = routerLaatLinksDoor(html);
  html = html.replace('</head>', '<style id="kop-linkkleur">header a,header a:visited,header a:hover{color:#fff}\n.v17-header .brand,.v17-header .brand:visited{color:#fff;text-decoration:none}</style>\n</head>');
  html = vervangEen(html, /<title>[\s\S]*?<\/title>/i, `<title>${p.titel}</title>`, `${p.bestand} titel`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${p.omschrijving}">`);
  if (/<link rel="canonical"/i.test(html)) {
    html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${p.canoniek}">`);
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${p.canoniek}">\n</head>`);
  }
  await writeFile(p.bestand, html, 'utf8');
  console.log(`Losse pagina geschreven: ${p.bestand} (${html.length} tekens)`);
}
