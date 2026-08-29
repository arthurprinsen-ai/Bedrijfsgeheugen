import { readFile } from 'node:fs/promises';

// Over ons is een volledige, historisch geaccepteerde pagina. De build mag de
// inhoud niet meer vervangen door een los prototype-fragment. We valideren de
// kernankers en laten het bronbestand daarna ongemoeid.
const overOns = await readFile('over-ons.html', 'utf8');
const semanticAnchors = [
  'Eerst kijken hoe het werk écht loopt. Dan pas techniek.',
  'Bedrijfsgeheugen is opgericht door Arthur Prinsen.',
  'Gewone taal',
  'Geen big bang',
  'Van jou, niet van mij'
];
for (const anchor of semanticAnchors) {
  if (!overOns.includes(anchor)) throw new Error(`over-ons historical anchor missing: ${anchor}`);
}
console.log('Historical website baseline validated; no content rewritten');
