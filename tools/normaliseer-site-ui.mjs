import { readFile, writeFile, glob } from 'node:fs/promises';
import {
  VRAAGBALK, VRAAG_CSS, VRAAG_JS,
  MODULE_CSS, MODULE_JS, bouwModules,
  CONTEXT_CSS, CONTEXT_JS, rolblok
} from './v18-modules.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

export const TRUST_BAR_HTML = `<div class="bg-uniform-trust" role="region" aria-label="Onze werkwijze"><div class="bg-uniform-trust-in">
  <span>✓ Vaste prijs, geen uurtje-factuurtje</span>
  <span>✓ In twee weken draaiend</span>
  <span>✓ Voor het Nederlandse mkb</span>
</div></div>`;

const TRUST_CSS = `<style id="bg-uniform-site-ui">
.bg-uniform-trust{background:#17191f;color:#d7d9df;font-family:'Instrument Sans',system-ui,sans-serif;font-size:13px;line-height:1.35;border-bottom:1px solid rgba(255,255,255,.07)}
.bg-uniform-trust-in{max-width:1200px;margin:0 auto;padding:9px 22px;display:flex;align-items:center;justify-content:center;gap:12px 32px;flex-wrap:wrap}
.bg-uniform-trust span::first-letter{color:#FFE86B}
.bg-uniform-footer-contact{border-top:1px solid rgba(255,255,255,.12);margin-top:14px;padding-top:14px;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;color:#a9b0bc;font-size:13px}
.bg-uniform-footer-contact a{color:inherit;text-decoration:none}
.bg-uniform-footer-contact a:hover{text-decoration:underline}
@media(max-width:640px){.bg-uniform-trust-in{justify-content:flex-start;padding:8px 18px;gap:5px 14px}.bg-uniform-trust{font-size:12px}}

/* Prijzen gebruikt een eigen header. Mobiel krijgt die exact dezelfde informatie-architectuur als de rest van de site. */
@media(max-width:900px){
  #bgkopMob.bgkop-mob{position:fixed!important;inset:0 0 0 auto!important;width:min(94vw,440px)!important;height:100dvh!important;max-height:none!important;background:#fff!important;color:#0e2148!important;z-index:9999!important;overflow-y:auto!important;padding:26px 28px 42px!important;box-shadow:-18px 0 50px rgba(7,21,35,.18)!important;border:0!important}
  #bgkopMob[hidden]{display:none!important}
  .bg-uniform-mobile-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0 22px;border-bottom:1px solid #e3e6ec}
  .bg-uniform-mobile-brand{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:23px;font-weight:700;color:#0e2148}
  .bg-uniform-mobile-close{width:46px;height:46px;border:1px solid #d7dce5;border-radius:14px;background:#fff;color:#2742d6;font-size:28px;line-height:1;display:grid;place-items:center;cursor:pointer}
  .bg-uniform-mobile-section{padding:24px 0;border-bottom:1px solid #e3e6ec}
  .bg-uniform-mobile-label{display:block;color:#7e8999;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
  #bgkopMob .bg-uniform-mobile-section a{display:flex!important;align-items:center;justify-content:space-between!important;width:100%!important;padding:12px 4px!important;margin:0!important;color:#0e2148!important;background:transparent!important;border:0!important;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:19px!important;font-weight:650!important;text-decoration:none!important}
  #bgkopMob .bg-uniform-mobile-section a::after{content:'→';color:#2742d6;font-size:22px;font-weight:700}
  .bg-uniform-mobile-actions{padding-top:24px;display:grid;gap:10px}
  #bgkopMob .bg-uniform-mobile-actions a{display:flex!important;justify-content:center!important;padding:13px 18px!important;border-radius:12px!important;text-decoration:none!important;font-weight:700!important}
  #bgkopMob .bg-uniform-mobile-actions .login{border:1px solid #d7dce5!important;color:#0e2148!important;background:#fff!important}
  #bgkopMob .bg-uniform-mobile-actions .signup{background:#FFE86B!important;color:#14171A!important}
}
.bg-pricing-tools{padding:34px 0 12px;background:var(--papier,#FBFAF7)}
.bg-pricing-tools .wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.bg-pricing-tools{--white:#fff;--line:var(--lijn,#DCDFE6);--ink:var(--inkt,#14171A);--ink2:var(--inkt,#14171A);--paper:var(--papier,#FBFAF7);--blue:var(--blauw,#2742D6);--muted:var(--grijs,#5C646E);--lime:var(--geel,#FFE86B)}
</style>`;

export const PRICING_MOBILE_MENU_HTML = `<div class="bgkop-mob" id="bgkopMob" hidden>
  <div class="bg-uniform-mobile-head"><span class="bg-uniform-mobile-brand">Bedrijfsgeheugen</span><button type="button" class="bg-uniform-mobile-close" data-bg-menu-close aria-label="Menu sluiten">×</button></div>
  <div class="bg-uniform-mobile-section"><span class="bg-uniform-mobile-label">ONTDEKKEN</span>
    <a href="${ORIGIN}/">Home</a><a href="${ORIGIN}/oplossingen">Oplossingen</a><a href="${ORIGIN}/product">Platform</a><a href="${ORIGIN}/prijzen">Prijzen</a><a href="${ORIGIN}/cases">Cases</a>
  </div>
  <div class="bg-uniform-mobile-section"><span class="bg-uniform-mobile-label">KENNIS &amp; BEDRIJF</span>
    <a href="${ORIGIN}/kennis">Kennis</a><a href="${ORIGIN}/over-ons">Over ons</a><a href="${ORIGIN}/meer">Meer</a>
  </div>
  <div class="bg-uniform-mobile-section"><span class="bg-uniform-mobile-label">START</span>
    <a href="${ORIGIN}/zelfscan">Gratis zelfscan</a><a href="${ORIGIN}/frisse-blik">Frisse Blik Scan</a>
  </div>
  <div class="bg-uniform-mobile-actions"><a class="login" href="${ORIGIN}/inloggen">Inloggen</a><a class="signup" href="${ORIGIN}/aanmelden">Aanmelden →</a></div>
</div>`;

const MOBILE_CLOSE_JS = `<script id="bg-uniform-mobile-close-js">document.addEventListener('click',function(e){if(e.target.closest('[data-bg-menu-close]')){var b=document.getElementById('bgkopKnop');if(b)b.click();}});</script>`;

function openDivMetKlasse(html, klasse, vanaf = 0) {
  const re = /<div\b[^>]*class="[^"]*"[^>]*>/gi;
  re.lastIndex = vanaf;
  let m;
  while ((m = re.exec(html))) {
    const cm = m[0].match(/class="([^"]*)"/i);
    if (cm && cm[1].split(/\s+/).includes(klasse)) return { index: m.index, open: m[0], endOpen: re.lastIndex };
  }
  return null;
}

function divEinde(html, open) {
  const tags = /<div\b[^>]*>|<\/div\s*>/gi;
  tags.lastIndex = open.index;
  let diepte = 0, m;
  while ((m = tags.exec(html))) {
    if (/^<div\b/i.test(m[0])) diepte++;
    else diepte--;
    if (diepte === 0) return tags.lastIndex;
  }
  return -1;
}

function verwijderDivMetKlasse(html, klasse) {
  let uit = html;
  while (true) {
    const open = openDivMetKlasse(uit, klasse);
    if (!open) break;
    const eind = divEinde(uit, open);
    if (eind < 0) break;
    uit = uit.slice(0, open.index) + uit.slice(eind);
  }
  return uit;
}

function vervangDivMetKlasse(html, klasse, nieuw) {
  const open = openDivMetKlasse(html, klasse);
  if (!open) return html;
  const eind = divEinde(html, open);
  if (eind < 0) return html;
  return html.slice(0, open.index) + nieuw + html.slice(eind);
}

function zetTrustBovenV17(html) {
  if (!html.includes('<header class="v17-header"')) return html;
  const body = html.match(/<body\b[^>]*>/i);
  const kop = html.indexOf('<header class="v17-header"');
  if (!body || kop < body.index) return html;
  const naBody = body.index + body[0].length;
  // Alles wat vóór de echte header in de body stond was een oude claims/contactbalk.
  return html.slice(0, naBody) + TRUST_BAR_HTML + html.slice(kop);
}

function voegTrustToeZonderV17(html) {
  if (html.includes('bg-uniform-trust')) return html;
  const body = html.match(/<body\b[^>]*>/i);
  if (!body) return html;
  const naBody = body.index + body[0].length;
  return html.slice(0, naBody) + TRUST_BAR_HTML + html.slice(naBody);
}

function footerContact(html) {
  const footerEind = html.lastIndexOf('</footer>');
  if (footerEind < 0) return html;
  const footerStart = html.lastIndexOf('<footer', footerEind);
  if (footerStart < 0) return html;
  const voet = html.slice(footerStart, footerEind);
  const items = [];
  if (!/Bedrijfsgeheugen\s*[·&middot;]\s*Enschede/i.test(voet)) items.push('<span>Bedrijfsgeheugen · Enschede</span>');
  if (!voet.includes('mailto:arthur@bedrijfsgeheugen.nl')) items.push('<a href="mailto:arthur@bedrijfsgeheugen.nl">arthur@bedrijfsgeheugen.nl</a>');
  if (!voet.includes('tel:+31627483345')) items.push('<a href="tel:+31627483345">06 27 48 33 45</a>');
  if (!/ma[–-]vr\s*08:00[–-]18:00/i.test(voet)) items.push('<span>ma–vr 08:00–18:00</span>');
  if (!items.length) return html;
  const blok = `<div class="bg-uniform-footer-contact">${items.join('')}</div>`;
  return html.slice(0, footerEind) + blok + html.slice(footerEind);
}

function pricingMenu(html) {
  if (!html.includes('id="bgkopMob"')) return html;
  let uit = vervangDivMetKlasse(html, 'bgkop-mob', PRICING_MOBILE_MENU_HTML);
  if (!uit.includes('bg-uniform-mobile-close-js')) uit = uit.replace('</body>', MOBILE_CLOSE_JS + '\n</body>');
  return uit;
}

function pricingTools(html) {
  if (html.includes('bgx-vraagbalk') && html.includes('bgx-rekenaar') && html.includes('bgx-rol')) return html;
  const { body: rekenaar } = bouwModules('');
  const blok = `<section class="bg-pricing-tools" aria-label="Interactieve prijsinstrumenten"><div class="wrap">${VRAAGBALK}${rekenaar}${rolblok('prijzen')}</div></section>`;
  const anker = html.indexOf('<nav class="bgkruim"');
  let uit = anker >= 0 ? html.slice(0, anker) + blok + html.slice(anker) : html.replace('</body>', blok + '</body>');
  if (!uit.includes('id="v18-vraag"')) uit = uit.replace('</head>', VRAAG_CSS + '\n' + MODULE_CSS + '\n' + CONTEXT_CSS + '\n</head>');
  if (!uit.includes('id="v18-vraag-js"')) uit = uit.replace('</body>', VRAAG_JS + '\n' + MODULE_JS + '\n' + CONTEXT_JS + '\n</body>');
  return uit;
}

function voegCssToe(html) {
  return html.includes('id="bg-uniform-site-ui"') ? html : html.replace('</head>', TRUST_CSS + '\n</head>');
}

export function normaliseerHtml(html, bestand) {
  const isPrijzen = bestand === 'prijzen.html';
  let uit = html;

  if (isPrijzen) {
    uit = verwijderDivMetKlasse(uit, 'bgx-gegevens');
    // De prijsbalk is al het juiste ontwerp; inhoud exact gelijk trekken aan de norm.
    const bgtop = openDivMetKlasse(uit, 'bgtop');
    if (bgtop) {
      const eind = divEinde(uit, bgtop);
      if (eind > 0) uit = uit.slice(0, bgtop.index) + TRUST_BAR_HTML + uit.slice(eind);
    } else uit = voegTrustToeZonderV17(uit);
    uit = pricingMenu(uit);
    uit = pricingTools(uit);
  } else {
    uit = zetTrustBovenV17(uit);
    if (!uit.includes('bg-uniform-trust')) uit = voegTrustToeZonderV17(uit);
    uit = verwijderDivMetKlasse(uit, 'bgx-gegevens');
    uit = verwijderDivMetKlasse(uit, 'bgx-vraagbalk');
    uit = verwijderDivMetKlasse(uit, 'bgx-rekenaar');
    uit = verwijderDivMetKlasse(uit, 'bgx-rol');
  }

  uit = footerContact(uit);
  uit = voegCssToe(uit);
  return uit;
}

const MAG_NIET = new Set(['index-oud.html', 'prototype-v18-stable.html', 'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']);

export async function normaliseerAllePaginas() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!MAG_NIET.has(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  if (!MAG_NIET.has('blog/index.html')) bestanden.push('blog/index.html');

  let gewijzigd = 0;
  for (const bestand of bestanden) {
    let html;
    try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    const nieuw = normaliseerHtml(html, bestand);
    if (nieuw !== html) { await writeFile(bestand, nieuw, 'utf8'); gewijzigd++; }
  }
  console.log(`Uniforme site-UI toegepast op ${gewijzigd} pagina's`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await normaliseerAllePaginas();
}
