// Bouwt kennisbank-index.json uit alle HTML-pagina's van de site.
// Geen dependencies. Draait in de Netlify-build vóór publicatie.
//
//   node tools/bouw-kennisindex.mjs
//
// Uitvoer: kennisbank-index.json in de root.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WORTEL = process.cwd();

// Pagina's die niet in de kennisbank horen: interne tools, demo's, oude versies.
const NEGEER = [
  '404.html',
  'index-oud.html',
  'klantportaal.html',
  'klantportaal-demo.html',
  'bedankt.html',
];
const NEGEER_MAPPEN = ['assets', 'intern', '.git', '.github', 'node_modules', 'netlify', 'tools'];

function zoekHtml(map, gevonden = []) {
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) {
      if (NEGEER_MAPPEN.includes(naam)) continue;
      zoekHtml(pad, gevonden);
    } else if (naam.endsWith('.html')) {
      const rel = pad.slice(WORTEL.length + 1);
      if (NEGEER.includes(rel)) continue;
      gevonden.push(rel);
    }
  }
  return gevonden;
}

function tekstUit(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function pak(html, regex) {
  const m = html.match(regex);
  return m ? tekstUit(m[1]) : '';
}

// /over-ons.html -> /over-ons   |   /blog/x/index.html -> /blog/x/
function naarUrl(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

// Knip de tekst in stukken van ~1200 tekens op zinsgrens.
// Kleiner dan een hele pagina, groot genoeg om context te houden.
function inStukken(tekst, max = 1200) {
  const zinnen = tekst.split(/(?<=[.!?])\s+/);
  const stukken = [];
  let huidig = '';
  for (const zin of zinnen) {
    if ((huidig + ' ' + zin).length > max && huidig) {
      stukken.push(huidig.trim());
      huidig = zin;
    } else {
      huidig += ' ' + zin;
    }
  }
  if (huidig.trim()) stukken.push(huidig.trim());
  return stukken;
}

const index = [];

for (const rel of zoekHtml(WORTEL)) {
  const html = readFileSync(join(WORTEL, rel), 'utf8');

  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;

  const titel =
    pak(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s*[—|]\s*Bedrijfsgeheugen.*$/i, '') ||
    pak(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const omschrijving = pak(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);

  const body = pak(html, /<body[^>]*>([\s\S]*?)<\/body>/i) || tekstUit(html);
  if (body.length < 300) continue;

  const url = naarUrl(rel);
  inStukken(body).forEach((tekst, i) => {
    index.push({ url, titel, omschrijving, deel: i, tekst });
  });
}

writeFileSync(
  join(WORTEL, 'kennisbank-index.json'),
  JSON.stringify({ gebouwd: new Date().toISOString(), stukken: index })
);

const paginas = new Set(index.map((s) => s.url)).size;
console.log(`Kennisbank-index gebouwd: ${paginas} pagina's, ${index.length} stukken.`);
