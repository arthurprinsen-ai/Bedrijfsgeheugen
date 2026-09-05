import { readFile, writeFile } from 'node:fs/promises';
import { normaliseerAllePaginas } from './normaliseer-site-ui.mjs';
import { controleerSiteUi } from './controleer-site-ui.mjs';

// De homepage-app had een eigen prijzenweergave met verouderde bedragen.
// /prijzen is sinds 2 september 2026 een eigen contentpagina binnen dezelfde
// canonical merk-shell. Deze stap verwijdert de oude homepage-weergave en
// voert daarna de page-policy en estate-wide shell-gate uit.

const DOEL = 'https://www.bedrijfsgeheugen.nl/prijzen';

const BLOK = `<div class="pagehero"><div class="wrap"><span class="eyebrow">Prijzen</span>
<h2>De prijzen staan op een eigen pagina.</h2>
<p>Vier pakketten, van &euro; 99 per maand tot een prijs op maat, met per pakket wat de AI voor je doet en hoe vers je gegevens zijn.</p>
<p><a class="btn btn-primary" href="${DOEL}">Bekijk de prijzen &rarr;</a></p></div></div>`;

function vervangWeergave(html) {
  const open = '<div class="page" id="view-pricing">';
  const start = html.indexOf(open);
  if (start === -1) return html;
  const na = html.indexOf('<div class="page" id="view-', start + open.length);
  const eind = na === -1 ? html.indexOf('</main>', start) : na;
  if (eind === -1) return html;
  return html.slice(0, start) + open + '\n' + BLOK + '\n</div>\n' + html.slice(eind);
}

function knoppenNaarLink(html) {
  return html.replace(/<button([^>]*?)data-view="pricing"([^>]*?)>([\s\S]*?)<\/button>/g,
    (heel, voor, na, inhoud) => {
      const attrs = (voor + na).replace(/\s*type="button"/g, '').replace(/\s+$/, '');
      return `<a href="${DOEL}"${attrs}>${inhoud}</a>`;
    });
}

export async function bouwPrijsVerwijzing() {
  let gedaan = 0;
  for (const bestand of ['index.html', 'prototype-v18-stable.html']) {
    let html;
    try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    const nieuw = knoppenNaarLink(vervangWeergave(html));
    if (nieuw !== html) { await writeFile(bestand, nieuw, 'utf8'); gedaan++; }
  }
  console.log(`Oude prijzenweergave uit de homepage gehaald: ${gedaan} bestand(en)`);
  return gedaan;
}

export async function voerPricingShellPipelineUit(stage = 'all') {
  if (stage === 'all' || stage === 'rewrite') await bouwPrijsVerwijzing();
  if (stage === 'all' || stage === 'normalize') await normaliseerAllePaginas();
  if (stage === 'all' || stage === 'verify') await controleerSiteUi();
}

const stage = process.env.BG_PRICING_STAGE || 'all';
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await voerPricingShellPipelineUit(stage);
}
