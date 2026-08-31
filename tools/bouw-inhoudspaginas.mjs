import { readFile, writeFile } from 'node:fs/promises';

// Maakt pagina's die geen weergave in de homepage-app hebben, maar wel dezelfde
// kop, voet en opmaak moeten dragen. De teksten staan in site/inhoudspaginas.json
// zodat ze te wijzigen zijn zonder aan code te komen.
// Draait NA bouw-v18-production-core.mjs, want die schrijft index.html.

const PAD = {
  home: '/', product: '/product', pricing: '/prijzen', solutions: '/oplossingen',
  integrations: '/systemen-koppelen', resources: '/blog/', company: '/over-ons',
  cases: '/cases', login: '/inloggen', signup: '/aanmelden', selfscan: '/zelfscan',
  'frisseblik-scan': '/frisse-blik', start: '/aanmelden'
};

function ontsnap(tekst) {
  return String(tekst).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function zonderWeergaven(html) {
  const grenzen = [];
  const re = /<div class="page(?: active)?" id="view-([a-z0-9-]+)">/g;
  let m;
  while ((m = re.exec(html)) !== null) grenzen.push({ start: m.index });
  const eindMain = html.indexOf('</main>');
  if (eindMain === -1 || grenzen.length === 0) throw new Error('inhoudspaginas: geen weergaven gevonden');
  return { voor: html.slice(0, grenzen[0].start), na: html.slice(eindMain) };
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
  if (!html.includes(oud)) throw new Error('inhoudspaginas: routerregel niet gevonden');
  return html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);");
}

function inhoudBlok(p) {
  const blokken = (p.blokken || []).map(b => `<article><h2>${ontsnap(b.kop)}</h2><p>${ontsnap(b.tekst)}</p></article>`).join('\n');
  const cta = p.cta ? `<p><a class="cta" href="${p.cta.href}">${ontsnap(p.cta.tekst)} →</a></p>` : '';
  const slot = p.slot ? `<p>${ontsnap(p.slot)}</p>` : '';
  return `<div class="page active" id="view-inhoud">
<section class="inhoud-kop"><div class="wrap">
<div class="hero-kicker"><span></span> ${ontsnap(p.kicker || '')}</div>
<h1>${ontsnap(p.h1)}</h1>
<p>${ontsnap(p.intro)}</p>
</div></section>
<section class="inhoud-body"><div class="wrap">
${blokken}
${slot}
${cta}
</div></section>
</div>
`;
}

const bron = await readFile('index.html', 'utf8');
const paginas = JSON.parse(await readFile('site/inhoudspaginas.json', 'utf8'));
const { voor, na } = zonderWeergaven(bron);

for (const p of paginas) {
  let html = voor + inhoudBlok(p) + na;
  html = knoppenNaarLinks(html);
  html = routerLaatLinksDoor(html);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${ontsnap(p.titel)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${ontsnap(p.omschrijving)}">`);
  const canoniek = `https://www.bedrijfsgeheugen.nl${p.pad}`;
  if (/<link rel="canonical"/i.test(html)) {
    html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canoniek}">`);
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${canoniek}">\n</head>`);
  }
  await writeFile(p.bestand, html, 'utf8');
  console.log(`Inhoudspagina geschreven: ${p.bestand} (${html.length} tekens)`);
}
