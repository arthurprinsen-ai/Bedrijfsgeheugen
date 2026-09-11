import { readFile, writeFile, glob } from 'node:fs/promises';

/* Conversieknop: koppelt assets/cta-conversie.css aan elke publieke pagina.
 * Draait in de laatste buildstap (bouw-release-evidence.mjs), na alle
 * schil- en paginabouwers, zodat geen latere stap de koppeling kan wegpoetsen.
 * Het klantportaal heeft een eigen ontwerp (blauw) en blijft erbuiten. */
// Absoluut, net als de andere assets: finalize-site-contracts maakt relatieve
// verwijzingen toch absoluut, en zo blijft die laag op 0 normalisaties.
export const CTA_CSS_HREF = 'https://www.bedrijfsgeheugen.nl/assets/cta-conversie.css?v=1';
export const CTA_MARKER = 'data-bg-conversieknop';
export const PORTAAL = new Set(['klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']);

export function metConversieknop(input) {
  const html = String(input);
  if (html.includes(CTA_MARKER)) return html;
  if (!/<\/head>/i.test(html)) return html;
  return html.replace(/<\/head>/i, `<link rel="stylesheet" href="${CTA_CSS_HREF}" ${CTA_MARKER}>\n</head>`);
}

export async function publiekePaginas() {
  const uit = [];
  for (const patroon of ['*.html', 'blog/**/*.html', 'kennis/**/*.html']) {
    for await (const p of glob(patroon)) if (!PORTAAL.has(p)) uit.push(p);
  }
  return [...new Set(uit)].sort();
}

export async function applyConversionCta() {
  let gewijzigd = 0;
  const paginas = await publiekePaginas();
  for (const p of paginas) {
    const oud = await readFile(p, 'utf8');
    const nieuw = metConversieknop(oud);
    if (nieuw !== oud) { await writeFile(p, nieuw); gewijzigd++; }
  }
  console.log(`Conversieknop: ${gewijzigd} van ${paginas.length} pagina's gekoppeld aan ${CTA_CSS_HREF}`);
  return gewijzigd;
}
