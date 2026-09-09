import test from 'node:test';
import assert from 'node:assert/strict';
import { scoopCss, zonderPaginaKleur } from '../tools/bouw-v18-chrome.mjs';

// De inhoudskolom van een standalone pagina moet op desktop zijn eigen breedte
// houden. De scoper sloeg `html::-webkit-scrollbar{width:12px}` plat tot
// `.inhoud-body{width:12px}`, binnen @media(min-width:1025px). Daardoor kromp de
// hele kolom op elk desktopscherm tot 12px en oogde de pagina wit, terwijl de
// tekst in de DOM stond en op mobiel gewoon zichtbaar was.
test('scrollbarpseudo\'s worden nooit tot de kale scope platgeslagen', () => {
  const bron = `@media(min-width:1025px){
html{overflow-y:scroll;scrollbar-gutter:stable}
html::-webkit-scrollbar{width:12px}
html::-webkit-scrollbar-track{background:#EFEDE8}
html::-webkit-scrollbar-thumb{background:#C2C7CF;border-radius:8px}
}`;
  const uit = zonderPaginaKleur(scoopCss(bron));

  const metBreedte = uit
    .split('}')
    .map(stuk => stuk.split('{'))
    .filter(delen => delen.length === 2 && delen[0].split(/[{,]/).pop().trim() === '.inhoud-body')
    .map(delen => delen[1])
    .filter(lijf => lijf.split(';').some(d => /^\s*width\s*:/.test(d)));
  assert.deepEqual(
    metBreedte,
    [],
    'Een paginabrede width op .inhoud-body laat de inhoudskolom dichtklappen; de pagina oogt dan wit op desktop.'
  );
  assert.doesNotMatch(uit, /webkit-scrollbar/, 'Scrollbarpseudo\'s horen bij het venster, niet bij een blok.');
  assert.doesNotMatch(uit, /(^|\})\s*\{/, 'Een regel zonder selector eet de volgende regel op.');
  assert.match(uit, /\.inhoud-body\{overflow-y:scroll;scrollbar-gutter:stable\}/, 'De gewone html-regel hoort wel gescoopt te blijven.');
});

test('html of :root met een pseudo houdt die pseudo', () => {
  const uit = scoopCss('html::selection{background:#FFE86B}');
  assert.match(uit, /\.inhoud-body::selection\{background:#FFE86B\}/);
});
