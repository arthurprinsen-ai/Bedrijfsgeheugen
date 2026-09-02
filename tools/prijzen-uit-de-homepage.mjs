import { readFile, writeFile } from 'node:fs/promises';

// De homepage-app had een eigen prijzenweergave met verouderde bedragen.
// /prijzen is sinds 2 september 2026 een eigen, handgemaakte pagina.
// Deze stap haalt de oude weergave uit de app en laat de knoppen naar die
// pagina wijzen, zodat er nooit twee prijsverhalen naast elkaar staan.
// Draait als laatste, na alle stappen die index.html schrijven.

const DOEL = '/prijzen';

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

let gedaan = 0;
for (const bestand of ['index.html', 'prototype-v18-stable.html']) {
  let html;
  try { html = await readFile(bestand, 'utf8'); } catch { continue; }
  const nieuw = knoppenNaarLink(vervangWeergave(html));
  if (nieuw !== html) { await writeFile(bestand, nieuw, 'utf8'); gedaan++; }
}
console.log(`Oude prijzenweergave uit de homepage gehaald: ${gedaan} bestand(en)`);
