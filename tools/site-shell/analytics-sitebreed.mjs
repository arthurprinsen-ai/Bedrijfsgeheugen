import { readFile, writeFile } from 'node:fs/promises';
import { CONSENT_DEFAULT, TOESTEMMINGSBANNER } from './apply-shell.mjs';
import { publiekePaginas } from './cta-conversie.mjs';

/* Analytics op elke publieke pagina, pas na toestemming.
 *
 * Aanleiding (11 sept 2026): GA4 met toestemming (basic Consent Mode, #1391/#1395)
 * kwam alleen op pagina's waarvan de bron zelf een GA4-tag had. De homepage,
 * /zelfscan, /frisse-blik en /aanmelden maten niets, dus de knopkleur (oranje,
 * #1386) was niet te toetsen. Deze laatste buildstap zet op elke publieke pagina:
 *   1. Consent Mode standaard op geweigerd (vóór alles wat met gtag praat);
 *   2. het meet-ID als <meta name="bg-ga4">;
 *   3. assets/toestemming.js;
 *   4. de toestemmingsbanner.
 * Zonder toestemming laadt er niets van Google en wordt er niets gemeten.
 *
 * assets/toestemming.js wordt bij de build gemaakt uit het toestemmingsdeel van
 * assets/stijl.js — één bron, geen tweede kopie die uit de pas kan lopen. Op
 * pagina's die stijl.js al laden doet het toestemmingsdeel niets (anders twee
 * keer gtag.js). Daarnaast meet het de klik op een primaire knop, met exact de
 * selectoren uit assets/cta-conversie.css, en alleen na toestemming.
 * Het klantportaal (eigen ontwerp) blijft erbuiten, net als bij de knopkleur. */
export const GA4_ID = 'G-912L0PB68G';
export const TOESTEMMING_SRC = 'https://www.bedrijfsgeheugen.nl/assets/toestemming.js?v=1';
export const TOESTEMMING_MARKER = 'data-bg-toestemming';
export const KLIK_EVENT = 'primaire_knop_klik';
/* Eigen, privacyarme meting (11 sept 2026, besluit Arthur: alles meten om te optimaliseren):
   elke klik op link of knop, scrolldiepte 25/50/75/90/100, formulier gestart/verzonden en
   actieve tijd, naar Supabase bg_interacties. Geen cookies, geen IP, geen formulierwaarden.
   Met toestemming gaan dezelfde gebeurtenissen ook naar GA4. Zie assets/meting.js. */
export const METING_SRC = 'https://www.bedrijfsgeheugen.nl/assets/meting.js?v=2';
export const METING_MARKER = 'data-bg-meting';

export function knopSelectoren(css) {
  const start = css.indexOf(':root:root :is(');
  if (start < 0) throw new Error('cta-conversie.css: geen :root:root :is(...)-regel gevonden');
  let i = start + ':root:root :is('.length, diepte = 1, j = i;
  for (; j < css.length && diepte; j++) { if (css[j] === '(') diepte++; else if (css[j] === ')') diepte--; }
  return css.slice(i, j - 1).trim();
}

export function maakToestemmingsScript(stijlBron, css) {
  const einde = stijlBron.indexOf('})();');
  if (!stijlBron.startsWith('/*') || einde < 0 || !stijlBron.slice(0, einde).includes('bg_consent')) {
    throw new Error('assets/stijl.js: toestemmingsdeel niet gevonden als eerste blok');
  }
  const toestemming = stijlBron.slice(stijlBron.indexOf('(function(){'), einde + 5);
  const sel = JSON.stringify(knopSelectoren(css));
  return `/* Bedrijfsgeheugen — toestemming en knopmeting. GEGENEREERD bij de build door
   tools/site-shell/analytics-sitebreed.mjs uit assets/stijl.js; niet met de hand wijzigen. */
if(!document.querySelector('script[src*="/assets/stijl.js"]'))${toestemming}
(function(){
  var SEL=${sel};
  function toegestaan(){try{return localStorage.getItem('bg_consent')==='granted';}catch(e){return false;}}
  document.addEventListener('click',function(e){
    var t=e.target,knop=t&&t.closest?t.closest(SEL):null;
    if(!knop||!toegestaan()||typeof window.gtag!=='function')return;
    window.gtag('event','${KLIK_EVENT}',{knop_tekst:(knop.textContent||'').replace(/\\s+/g,' ').trim().slice(0,100),link_url:knop.getAttribute('href')||'',page_path:location.pathname,transport_type:'beacon'});
  },true);
})();
`;
}

// Interne links absoluut, net als finalize-site-contracts ze maakt: zo blijft
// die laag op 0 normalisaties en is de banner na die laag gelijk aan hier.
const BANNER = TOESTEMMINGSBANNER.replace(/href="\/(?!\/)/g, 'href="https://www.bedrijfsgeheugen.nl/');

export function metAnalytics(input) {
  let html = String(input);
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) return html;
  const kop = [];
  if (!html.includes("gtag('consent','default'")) kop.push(CONSENT_DEFAULT);
  if (!html.includes('name="bg-ga4"')) kop.push(`<meta name="bg-ga4" content="${GA4_ID}">`);
  if (!html.includes(TOESTEMMING_MARKER)) kop.push(`<script src="${TOESTEMMING_SRC}" defer ${TOESTEMMING_MARKER}></script>`);
  if (!html.includes(METING_MARKER)) kop.push(`<script src="${METING_SRC}" defer ${METING_MARKER}></script>`);
  if (kop.length) html = html.replace(/<\/head>/i, kop.join('\n') + '\n</head>');
  if (!html.includes('id="bgCookie"')) html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, BANNER + '\n</body>');
  return html;
}

export async function applySitewideAnalytics() {
  const script = maakToestemmingsScript(await readFile('assets/stijl.js', 'utf8'), await readFile('assets/cta-conversie.css', 'utf8'));
  await writeFile('assets/toestemming.js', script);
  let gewijzigd = 0;
  const paginas = await publiekePaginas();
  for (const p of paginas) {
    const oud = await readFile(p, 'utf8');
    const nieuw = metAnalytics(oud);
    if (nieuw !== oud) { await writeFile(p, nieuw); gewijzigd++; }
  }
  console.log(`Analytics na toestemming: ${gewijzigd} van ${paginas.length} pagina's aangevuld (${GA4_ID})`);
  return gewijzigd;
}
