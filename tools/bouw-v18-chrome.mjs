import { readFile, writeFile } from 'node:fs/promises';
import { TABEL_CSS, INTERACTIE_CSS, INTERACTIE_JS, verrijkInhoud, opDezePagina, mensenblok, schemas, ORGANISATIE_SCHEMA, EXTRA_HTML, volgendeStap, VOLGENDE_CSS } from './v18-verrijking.mjs';
import { MODULE_CSS, MODULE_JS, bouwModules, SPEELS_CSS, SPEELS_JS, LEK, VERTREK, zetStrepen, VRAAG_CSS, VRAAG_JS, VRAAGBALK, OVERTYP, hoofdletterMerk } from './v18-modules.mjs';

// Zet elke pagina in de opmaak van de homepage: dezelfde kop, navigatie, voet,
// dezelfde videohero, dezelfde letters, kleuren en kaarten.
//
// De oude stylesheet gaat er bewust UIT. De oude klassen (kaart, btn, tegel, rij,
// faq-item) worden hieronder opnieuw gedefinieerd in de v18-tokens, zodat de
// inhoud dezelfde vormentaal krijgt als de homepage in plaats van een eigen.

const PAD = {
  home: '/', product: '/product', pricing: '/prijzen', solutions: '/oplossingen',
  integrations: '/systemen-koppelen', resources: '/blog/', company: '/over-ons',
  cases: '/cases', login: '/inloggen', signup: '/aanmelden', selfscan: '/zelfscan',
  'frisseblik-scan': '/frisse-blik', start: '/start', more: '/meer'
};

// De herovideo staat in Supabase-opslag, dezelfde als op de homepage.
export const HERO_URL = 'https://adhjwmvyoixzjtmiroln.supabase.co/storage/v1/object/public/media/hero/shanghai-v1.mp4';

// pagina's die hun eigen werking hebben (scans, rekenmodules): daar blijft de
// eigen opmaak staan, want die stuurt het tonen en verbergen van stappen
export const EIGEN_WERKING = new Set([
  'zelfscan.html', 'ai-scan.html', 'monitor.html', 'benchmark.html', 'afmaakindex.html',
  'frisse-blik.html', 'wijzigingen.html', 'wijzigingen-uitgelegd.html',
  'ai-capability-model.html', 'due-diligence.html', 'offerte.html', 'brochure.html'
]);

export const INHOUD_CSS = `<style id="v18-inhoud"> .inhoud-kop{position:relative;background:linear-gradient(135deg,#071a3c,#12316c);color:#fff;padding:136px 0 72px;overflow:hidden;isolation:isolate}.inhoud-kop video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;filter:brightness(.58) saturate(.92)}.inhoud-kop::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(120% 90% at 12% 0%,rgba(80,120,255,.32),transparent 60%),linear-gradient(180deg,rgba(7,26,60,.62),rgba(7,26,60,.9))}.inhoud-kop h1{color:#fff;margin:14px 0 18px;font-size:clamp(36px,5.4vw,62px);line-height:1.02;letter-spacing:-.025em;max-width:19ch}.inhoud-kop .intro{color:rgba(255,255,255,.8);max-width:64ch;font-size:19px;line-height:1.65;margin:0}.inhoud-kop .hero-kicker{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em}.inhoud-kruim{background:var(--paper);border-bottom:1px solid var(--line);padding:0!important;margin:0!important}.inhoud-kruim .wrap{padding:14px 0!important}.v17-header a,.v17-header a:hover{text-decoration:none}.inhoud-kruim .wrap{padding:15px 0;font-size:13px;color:var(--muted)}.inhoud-kruim a{color:var(--muted);text-decoration:none}.inhoud-kruim a:hover{color:var(--blue)}.inhoud-kruim [aria-current=page]{color:var(--ink);font-weight:650}.inhoud-body{background:var(--paper);color:var(--ink);padding:80px 0 112px;overflow-x:clip}.inhoud-body *{max-width:100%;box-sizing:border-box}.inhoud-body pre,.inhoud-body code{overflow-x:auto;white-space:pre-wrap;word-break:break-word}@media(max-width:640px){.inhoud-body [class*=rooster],.inhoud-body [class*=rij],.inhoud-body [class*=grid],.inhoud-body [class*=kolom],.inhoud-body [class*=tegels]{grid-template-columns:1fr!important;display:grid!important}.inhoud-body [style*="grid-template-columns"]{grid-template-columns:1fr!important}}.inhoud-body .wrap>*{max-width:72ch}.inhoud-body h2{font-size:clamp(26px,3.1vw,38px);line-height:1.12;letter-spacing:-.02em;margin:64px 0 14px;scroll-margin-top:96px}.inhoud-body h2:first-of-type{margin-top:0}.inhoud-body h3{font-size:20px;letter-spacing:-.01em;margin:36px 0 8px}.inhoud-body p,.inhoud-body li{font-size:17.5px;line-height:1.75;color:var(--ink2)}.inhoud-body a{color:var(--blue);font-weight:550}.inhoud-body ul,.inhoud-body ol{padding-left:1.15rem}.inhoud-body li{margin:.4rem 0}.inhoud-body li::marker{color:var(--blue)}.inhoud-body strong{color:var(--ink)}.inhoud-body table{width:100%;max-width:none;border-collapse:separate;border-spacing:0;margin:32px 0;background:var(--white);border:1px solid var(--line);border-radius:20px;overflow:hidden;font-size:16px;box-shadow:0 2px 4px rgba(7,21,35,.03),0 18px 44px rgba(7,21,35,.07)}.inhoud-body th,.inhoud-body td{padding:16px 18px;text-align:left;border-bottom:1px solid var(--line)}.inhoud-body tr:last-child td{border-bottom:0}.inhoud-body th{background:rgba(7,21,35,.03);font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}.inhoud-body img{max-width:100%;height:auto;border-radius:20px}.inhoud-body svg:not([width]):not([height]){width:1.4em;height:1.4em;flex:0 0 auto;vertical-align:-.18em}.inhoud-body .ico svg,.inhoud-body .bol svg{width:1.25em;height:1.25em}.inhoud-body .ico,.inhoud-body .bol{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:rgba(39,66,214,.09);color:var(--blue);margin-bottom:10px}.inhoud-body blockquote{margin:32px 0;padding:24px 28px;background:var(--white);border:1px solid var(--line);border-left:3px solid var(--blue);border-radius:0 20px 20px 0;font-size:19px;line-height:1.6}.inhoud-body .mark,.inhoud-body mark{background:linear-gradient(var(--lime),var(--lime)) no-repeat 0 78%;background-size:100% 46%;border:0;padding:0 .06em;color:inherit;box-decoration-break:clone;-webkit-box-decoration-break:clone}.inhoud-body .eyebrow,.inhoud-body .kicker{display:inline-block;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#C2410C;margin-bottom:8px}.inhoud-body .kaart,.inhoud-body .p-kaart,.inhoud-body .tegel,.inhoud-body .blok,.inhoud-body .faq-item,.inhoud-body .stap{max-width:none;background:var(--white);border:1px solid var(--line);border-radius:22px;padding:28px 30px;margin:18px 0;box-shadow:0 1px 2px rgba(7,21,35,.04),0 16px 40px rgba(7,21,35,.06)}.inhoud-body .rooster,.inhoud-body .rij{max-width:none;display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(270px,1fr))}.inhoud-body .btn,.inhoud-body .knop,.inhoud-body a.cta{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:15px 28px;font-weight:700;font-size:15.5px;text-decoration:none;margin:10px 10px 10px 0}.inhoud-body .btn.sec,.inhoud-body .knop.sec{background:var(--white);color:var(--ink);border:1px solid var(--line)}.inhoud-body .pil{display:inline-block;background:var(--white);border:1px solid var(--line);border-radius:999px;padding:7px 15px;font-size:13.5px;font-weight:600;margin:5px 7px 5px 0}.inhoud-body .getal,.inhoud-body .nr{font-weight:800;color:var(--blue);font-variant-numeric:tabular-nums}@media(max-width:768px){.inhoud-kop{padding:100px 0 48px}.inhoud-kop h1{max-width:none}.inhoud-body{padding:52px 0 76px}.inhoud-body p,.inhoud-body li{font-size:16.5px}.inhoud-body h2{margin:44px 0 12px}.inhoud-body .kaart,.inhoud-body .p-kaart,.inhoud-body .tegel,.inhoud-body .blok,.inhoud-body .faq-item,.inhoud-body .stap{padding:22px 22px}}</style>`;

export function scoopCss(css, scope = '.inhoud-body') {
  let uit = '';
  let i = 0;
  while (i < css.length) {
    const haak = css.indexOf('{', i);
    if (haak === -1) { uit += css.slice(i); break; }

    const kop = css.slice(i, haak);
    const isAt = kop.trim().startsWith('@');

    // blok afbakenen met haakjes tellen
    let diep = 0, j = haak;
    for (; j < css.length; j++) {
      if (css[j] === '{') diep++;
      else if (css[j] === '}') { diep--; if (diep === 0) break; }
    }
    const lijf = css.slice(haak + 1, j);

    if (isAt) {
      const at = kop.trim().split(/\s|\(/)[0];
      if (['@media', '@supports', '@layer', '@container'].includes(at)) {
        uit += kop + '{' + scoopCss(lijf, scope) + '}';
      } else {
        uit += kop + '{' + lijf + '}';        // @font-face, @keyframes: ongemoeid
      }
    } else {
      const selectors = kop.split(',').map(s => {
        const t = s.trim();
        if (!t) return t;
        if (/^(html|:root)\b/.test(t)) return scope;
        if (/^body\b/.test(t)) return t.replace(/^body/, scope);
        return `${scope} ${t}`;
      }).filter(Boolean).join(',');
      uit += selectors + '{' + lijf + '}';
    }
    i = j + 1;
  }
  return uit;
}

// De oude opmaak gaat mee voor de STRUCTUUR (kolommen, afstanden, blokken die
// naast elkaar horen). Wat de oude opmaak op paginaniveau aan kleur, achtergrond
// en lettertype zette, gaat eruit: dat komt nu uit de v18-tokens.
export function zonderPaginaKleur(css, scope = '.inhoud-body') {
  const re = new RegExp('(' + scope.replace('.', '\\.') + ')\\s*\\{([^}]*)\\}', 'g');
  return css.replace(re, (heel, sel, lijf) => {
    const schoon = lijf.split(';')
      .filter(d => !/^\s*(background|background-color|background-image|color|font-family|min-height|height)\s*:/i.test(d))
      .join(';');
    return sel + '{' + schoon + '}';
  });
}

export async function leesSchil(bron = 'index.html') {
  const html = await readFile(bron, 'utf8');
  const grenzen = [];
  const re = /<div class="page(?: active)?" id="view-[a-z0-9-]+">/g;
  let m;
  while ((m = re.exec(html)) !== null) grenzen.push(m.index);
  const eindMain = html.indexOf('</main>');
  if (!grenzen.length || eindMain === -1) throw new Error('v18-chrome: schil niet gevonden');
  return { voor: html.slice(0, grenzen[0]), na: html.slice(eindMain) };
}

export function knoppenNaarLinks(html) {
  return html.replace(/<button([^>]*data-view="[a-z0-9-]+"[^>]*)>([\s\S]*?)<\/button>/g, (heel, attrs, inhoud) => {
    const mv = attrs.match(/data-view="([a-z0-9-]+)"/);
    const doel = mv && PAD[mv[1]];
    if (!doel) return heel;
    return `<a href="${doel}"${attrs.replace(/\s*type="button"/, '')}>${inhoud}</a>`;
  });
}

export function routerLaatLinksDoor(html) {
  const oud = "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();showView(btn.dataset.view);";
  return html.includes(oud)
    ? html.replace(oud, "viewButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!document.getElementById('view-'+btn.dataset.view))return;e.preventDefault();showView(btn.dataset.view);")
    : html;
}

// ── inhoud uit de oude pagina halen ───────────────────────────────────────
export function pluisInhoud(oud) {
  const mainStart = oud.indexOf('<main');
  const mainEind = oud.lastIndexOf('</main>');
  if (mainStart === -1 || mainEind === -1) throw new Error('geen <main>');
  let body = oud.slice(oud.indexOf('>', mainStart) + 1, mainEind);

  body = body.replace(/<nav class="bgkruim"[\s\S]*?<\/nav>/g, '');
  // een pagina die zelf een voettekst in de inhoud had: die van de site is er al
  body = body.replace(/<footer[\s\S]*?<\/footer>/g, '');

  const kicker = (body.match(/<span class="(?:eyebrow|kicker)"[^>]*>([\s\S]*?)<\/span>/) || [, ''])[1]
    .replace(/<[^>]+>/g, '').trim();

  const h1m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1 = h1m ? h1m[1].replace(/<[^>]+>/g, '').trim() : '';

  // intro: de p.intro of de eerste alinea na de h1
  let intro = '';
  const introm = body.match(/<p class="(?:intro|leid)"[^>]*>([\s\S]*?)<\/p>/);
  if (introm) intro = introm[1];
  else if (h1m) {
    const na = body.slice(body.indexOf(h1m[0]) + h1m[0].length);
    const eerste = na.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (eerste) intro = eerste[1];
  }

  // kicker, h1 en intro uit de inhoud halen: die staan straks in de hero
  if (h1m) body = body.replace(h1m[0], '');
  if (introm) body = body.replace(introm[0], '');
  body = body.replace(/<span class="(?:eyebrow|kicker)"[^>]*>[\s\S]*?<\/span>/, '');

  // De oude paginakop is nu leeg: kicker, titel en intro staan in de hero. Zo'n
  // leeg omhulsel houdt wel zijn achtergrond en levert een zwarte balk op.
  body = ruimLeegOp(body);

  return { kicker, h1, intro: intro.replace(/<[^>]+>/g, '').trim(), body };
}

export function ruimLeegOp(html) {
  let vorig;
  do {
    vorig = html;
    html = html.replace(/<(header|div|section|p|span|figure|aside)\b[^>]*>\s*<\/\1>/g, '');
  } while (html !== vorig);
  return html;
}

export function kruimelpad(schakels) {
  const delen = schakels.map((s, n) => n === schakels.length - 1
    ? `<span aria-current="page">${s.naam}</span>`
    : `<a href="${s.url}">${s.naam}</a> <span aria-hidden="true">›</span> `).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: schakels.map((s, n) => ({
      '@type': 'ListItem', position: n + 1, name: s.naam,
      ...(s.url ? { item: 'https://www.bedrijfsgeheugen.nl' + s.url } : {})
    }))
  };
  return `<section class="inhoud-kruim"><div class="wrap"><nav aria-label="Kruimelpad">${delen}</nav></div></section>`
    + `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ── één pagina in de v18-opmaak zetten ────────────────────────────────────
const kaalTekst = t => String(t).replace(/<[^>]+>/g, ' ');

export async function bouwPagina({ schil, basisCss, bestand, doel, titel, omschrijving, canoniek, zoekwoord, kruimels }) {
  const oud = await readFile(bestand, 'utf8');
  const { kicker, h1, intro, body } = pluisInhoud(oud);

  // structuur van de oorspronkelijke pagina, gescoopt en ontdaan van eigen kleuren
  const paginaStijl = [...oud.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m =>m[1]).join('\n');const eigenStijl = `<style id="pagina-structuur">${zonderPaginaKleur(scoopCss(basisCss + '\n' + paginaStijl))}</style>`;

  const scripts = [...oud.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g)]
    .map(m => m[0]).filter(s => !s.includes('/assets/js/menu.js')).join('\n');

  const hero = `<section class="inhoud-kop">
<video autoplay muted playsinline loop preload="metadata" aria-hidden="true"><source src="${HERO_URL}" type="video/mp4"></video>
<div class="wrap">
${kicker ? `<div class="hero-kicker"><span></span> ${kicker}</div>` : ''}
<h1>${h1 || titel.split('|')[0].trim()}</h1>
${intro ? `<p class="intro">${intro}</p>` : ''}
</div></section>`;

  const isBlog = bestand.startsWith('blog/');
  const eigen = EIGEN_WERKING.has(bestand);
  // pagina's met eigen werking laten we met rust: hun knoppen en stappen doen al iets
  const { body: metModules } = eigen ? { body } : bouwModules(zetStrepen(body));
  const { body: levend, koppen } = eigen ? { body: metModules, koppen: [] } : verrijkInhoud(metModules);
  const overtypen = /overtyp|overgetypt|dubbele invoer|handmatig in|opnieuw in/i.test(kaalTekst(body));
  const inhoud = eigen
    ? levend + volgendeStap(isBlog)
    : VRAAGBALK + opDezePagina(koppen) + levend + (overtypen ? OVERTYP : '') + VERTREK + volgendeStap(isBlog) + mensenblok(isBlog);

  let html = schil.voor
    + '<div class="page active" id="view-inhoud">'
    + hero
    + kruimelpad(kruimels)
    + `<section class="inhoud-body"><div class="wrap">${inhoud}</div></section>`
    + '</div>'
    + EXTRA_HTML
    + LEK
    + schil.na;

  html = html.replace('</head>', `${eigenStijl}\n${INHOUD_CSS}\n${INTERACTIE_CSS}\n${VOLGENDE_CSS}\n${MODULE_CSS}\n${SPEELS_CSS}\n${VRAAG_CSS}\n${TABEL_CSS}\n</head>`);
  html = html.replace('</body>', `${INTERACTIE_JS}\n${MODULE_JS}\n${SPEELS_JS}\n${VRAAG_JS}\n${ORGANISATIE_SCHEMA}\n${schemas({ isBlog, titel, omschrijving, canoniek, h1, body: levend })}\n</body>`);
  html = knoppenNaarLinks(html);
  html = routerLaatLinksDoor(html);
  html = html.replace('</body>', `${scripts}\n</body>`);
  html = zetKop(html, titel, omschrijving, canoniek, zoekwoord);
  html = hoofdletterMerk(html);

  await writeFile(doel, html, 'utf8');
  return { doel, tekens: html.length };
}

export function zetKop(html, titel, omschrijving, canoniek, zoekwoord) {
  const zet = (patroon, nieuw) => {
    if (patroon.test(html)) html = html.replace(patroon, nieuw);
    else html = html.replace('</head>', nieuw + '\n</head>');
  };
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titel}</title>`);
  zet(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${omschrijving}">`);
  zet(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canoniek}">`);
  zet(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${titel}">`);
  zet(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${omschrijving}">`);
  zet(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canoniek}">`);
  zet(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${titel}">`);
  zet(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${omschrijving}">`);
  if (zoekwoord) zet(/<meta name="bg-zoekwoord" content="[^"]*"\s*\/?>/i, `<meta name="bg-zoekwoord" content="${zoekwoord}">`);
  return html;
}
