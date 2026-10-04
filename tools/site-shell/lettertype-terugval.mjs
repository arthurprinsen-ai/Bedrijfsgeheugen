import { readFile, writeFile, glob } from 'node:fs/promises';
import { publiekePaginas } from './cta-conversie.mjs';

/* Lettertype-terugval met gelijke maten.
 *
 * Aanleiding (11 sept 2026): /zelfscan (CLS 0,109) en /ai-scan (0,174) verspringen
 * op telefoons. Met Google Fonts geblokkeerd is die verschuiving weg: het is de
 * wissel van het terugvallettertype naar Instrument Sans / Bricolage Grotesque
 * (font-display: swap). De introtekst liep in de terugval een regel langer, en
 * bij de wissel schoof alles eronder 31 px omhoog.
 *
 * font-display: swap blijft (besluit: tekst nooit onzichtbaar, Notion 25.
 * Technische SEO). In plaats daarvan krijgt de terugval dezelfde maten als het
 * echte lettertype: een lokale Arial (of het maatgelijke Helvetica, Liberation
 * Sans, Arimo) met size-adjust en ascent/descent-override, en Roboto voor Android.
 * Dan wisselt alleen de vorm van de letters, niet de regelval.
 *
 * Maten berekend uit de fontbestanden (fontTools, hhea-maten, gemiddelde
 * letterbreedte over Nederlandse sitetekst): size-adjust = breedte(echt) /
 * breedte(terugval); overrides = maat(echt) / size-adjust. */
export const TERUGVAL_MARKER = 'bg-lettertype-terugval';
export const FONT_PRELOAD_MARKER = 'bg-critical-font-preloads';
export const CRITICAL_FONT_URLS = Object.freeze({
  instrumentSans: 'https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2',
  bricolageGrotesque: 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9K6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMlGIInE.woff2'
});

export function criticalFontPreloadsHtml() {
  return `<!-- ${FONT_PRELOAD_MARKER} -->
<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href="${CRITICAL_FONT_URLS.instrumentSans}">
<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" href="${CRITICAL_FONT_URLS.bricolageGrotesque}">`;
}

function ensureCriticalFontPreloads(input) {
  const html = String(input);
  if (!/<head\b[^>]*>/i.test(html) || html.includes(FONT_PRELOAD_MARKER)) return html;
  return html.replace(/<head\b[^>]*>/i, head => `${head}\n${criticalFontPreloadsHtml()}`);
}

const ARIAL = { regular: ["Arial", "ArialMT", "Helvetica", "Liberation Sans", "Arimo"], bold: ["Arial Bold", "Arial-BoldMT", "Helvetica Bold", "Liberation Sans Bold", "Arimo Bold"] };
const ROBOTO = { regular: ["Roboto", "Roboto-Regular"], bold: ["Roboto Bold", "Roboto-Bold"] };
export const LETTERTYPEN = Object.freeze({
  'Instrument Sans': { arial: [101.79, 95.29, 24.56], roboto: [103.01, 94.16, 24.27] },
  'Bricolage Grotesque': { arial: [102.47, 90.76, 26.35], roboto: [103.70, 89.68, 26.04] }
});

function face(naam, bronnen, gewicht, [size, asc, desc]) {
  const src = bronnen.map(b => `local("${b}")`).join(',');
  return `@font-face{font-family:"${naam}";src:${src};font-weight:${gewicht};size-adjust:${size}%;ascent-override:${asc}%;descent-override:${desc}%;line-gap-override:0%}`;
}

export function terugvalCss() {
  const regels = [];
  for (const [familie, maten] of Object.entries(LETTERTYPEN)) {
    for (const [soort, lokaal] of [['arial', ARIAL], ['roboto', ROBOTO]]) {
      const naam = `${familie} Fallback${soort === 'roboto' ? ' Roboto' : ''}`;
      regels.push(face(naam, lokaal.regular, '100 550', maten[soort]), face(naam, lokaal.bold, '551 900', maten[soort]));
    }
  }
  return `<style id="${TERUGVAL_MARKER}">${regels.join('')}</style>`;
}

/* Voegt na elk "Instrument Sans" / "Bricolage Grotesque" in een font- of
   font-family-declaratie de twee maatgelijke terugvallers toe. */
export function metTerugvalStapel(css) {
  return String(css).replace(/(font(?:-family)?\s*:)([^;{}<>]*)/gi, (geheel, eigenschap, waarde) => {
    if (/Fallback/.test(waarde)) return geheel;
    const nieuw = waarde.replace(/(["']?)(Instrument Sans|Bricolage Grotesque)\1(?=\s*(?:,|!|$))/g, (m, q, familie) => {
      const aanhaling = q || '"';
      return `${m},${aanhaling}${familie} Fallback${aanhaling},${aanhaling}${familie} Fallback Roboto${aanhaling}`;
    });
    return eigenschap + nieuw;
  });
}

export function metLettertypeTerugval(input) {
  let html = String(input);
  if (!/<\/head>/i.test(html)) return html;

  // Start de twee kritieke Latin variable fonts vóór de Google Fonts stylesheet
  // klaar is. Zo blijft font-display:swap behouden, maar vindt de fontwissel
  // vóór de eerste betekenisvolle layout plaats. Dit voorkomt de gemeten
  // 31–63px reflow op content- en advisorpagina's.
  html = ensureCriticalFontPreloads(html);

  // Bestaande gegenereerde pagina's kunnen de fallback-marker al bevatten.
  // Preloads moeten daar alsnog worden toegevoegd; de stack-normalisatie zelf
  // blijft idempotent.
  if (html.includes(`id="${TERUGVAL_MARKER}"`)) return html;

  html = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, css, dicht) => open + metTerugvalStapel(css) + dicht);
  html = html.replace(/(\sstyle=")([^"]*)(")/gi, (m, open, css, dicht) => open + metTerugvalStapel(css.replace(/&quot;/g, '"')).replace(/"/g, '&quot;') + dicht);
  return html.replace(/<head\b[^>]*>/i, m => `${m}\n${terugvalCss()}`);
}

export async function applyLettertypeTerugval() {
  let paginas = 0, stijlbladen = 0;
  for (const p of await publiekePaginas()) {
    const oud = await readFile(p, 'utf8');
    const nieuw = metLettertypeTerugval(oud);
    if (nieuw !== oud) { await writeFile(p, nieuw); paginas++; }
  }
  for await (const p of glob('assets/*.css')) {
    const oud = await readFile(p, 'utf8');
    const nieuw = metTerugvalStapel(oud);
    if (nieuw !== oud) { await writeFile(p, nieuw); stijlbladen++; }
  }
  console.log(`Lettertype-terugval: ${paginas} pagina's en ${stijlbladen} stijlbladen met maatgelijke terugval`);
  return paginas;
}
