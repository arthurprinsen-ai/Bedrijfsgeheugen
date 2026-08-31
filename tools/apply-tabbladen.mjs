// Zet op elke gepubliceerde pagina het favicon en, waar een pagina met panelen
// werkt, een tabtitel die meebeweegt met het paneel dat open staat.
// Draait in de Netlify-build NA bouw-v18-production.mjs, want die schrijft
// index.html elke build opnieuw uit de vastgezette v18-payload.
// Bron van waarheid: site/tabtitels.json. Idempotent: twee keer draaien geeft
// hetzelfde bestand.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CONFIG = 'site/tabtitels.json';
const MAPPEN_OVERSLAAN = new Set([
  '.git', '.github', 'node_modules', 'tools', 'tests', 'brain', 'docs',
  'components', 'config', 'email', 'data', 'netlify', 'v18-full',
]);

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
const overslaan = new Set(config.overslaan || []);

export async function zoekPaginas(wortel = '.') {
  const gevonden = [];
  async function loop(map) {
    for (const item of await readdir(map, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const p = path.join(map, item.name);
      if (item.isDirectory()) {
        if (MAPPEN_OVERSLAAN.has(item.name)) continue;
        await loop(p);
      } else if (item.name.endsWith('.html')) {
        gevonden.push(path.relative(wortel, p).split(path.sep).join('/'));
      }
    }
  }
  await loop(wortel);
  return gevonden.sort();
}

export function heeftTitel(html) {
  return /<title\b[^>]*>\s*\S[\s\S]*?<\/title>/i.test(html);
}

export function zetPictogrammen(html, { icoon, appleTouch }) {
  const regels = `<link rel="icon" type="image/png" href="${icoon}">\n<link rel="apple-touch-icon" href="${appleTouch}">`;
  const kop = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!kop) return html;
  const heeftIcoon = /<link\b[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/i.test(kop[0]);
  const heeftApple = /<link\b[^>]*rel=["']apple-touch-icon["'][^>]*>/i.test(kop[0]);
  if (heeftIcoon && heeftApple) return html;
  let nieuw = kop[0]
    .replace(/<link\b[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>\s*/gi, '');
  nieuw = /<\/title>/i.test(nieuw)
    ? nieuw.replace(/<\/title>\s*/i, `</title>\n${regels}\n`)
    : nieuw.replace(/<\/head>/i, `${regels}\n</head>`);
  return html.replace(kop[0], nieuw);
}

export function tabtitelScript(regel) {
  const R = JSON.stringify({
    panelen: regel.panelen,
    actief: regel.actief,
    voorvoegsel: regel.voorvoegsel,
    basis: regel.basis,
    knop: regel.knop || '',
    achtervoegsel: regel.achtervoegsel || '',
    titels: regel.titels || {},
  }).replaceAll('<', '\\u003c');
  return `<script id="bg-tabtitel">
(function(){
  var R=${R};
  function tekstVan(sleutel){
    if(!R.knop||!sleutel){return '';}
    var knop=document.querySelector(R.knop.replace('{sleutel}',sleutel));
    if(!knop){return '';}
    var tekst=(knop.textContent||'').replace(/\\s+/g,' ').trim();
    return tekst?tekst.slice(0,60)+R.achtervoegsel:'';
  }
  function zet(){
    var open=document.querySelector(R.actief);
    var sleutel=open&&open.id?open.id.slice(R.voorvoegsel.length):'';
    var titel=R.titels[sleutel]||tekstVan(sleutel)||R.basis;
    if(document.title!==titel){document.title=titel;}
  }
  function start(){
    zet();
    var kijker=new MutationObserver(zet);
    document.querySelectorAll(R.panelen).forEach(function(paneel){
      kijker.observe(paneel,{attributes:true,attributeFilter:['class']});
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}
})();
</script>`;
}

export function zetTabtitel(html, regel) {
  const kop = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!kop) return html;
  const schoon = kop[0].replace(/<script\b[^>]*id=["']bg-tabtitel["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  const nieuw = schoon.replace(/<\/head>/i, `${tabtitelScript(regel)}\n</head>`);
  return html.replace(kop[0], nieuw);
}

function regelVoor(bestand) {
  return (config.panelen || []).find(r => r.bestanden.includes(bestand));
}

export async function pasToe(wortel = '.') {
  const paginas = await zoekPaginas(wortel);
  const verslag = { bekeken: 0, pictogram: 0, tabtitel: 0, overgeslagen: [] };
  for (const pagina of paginas) {
    if (overslaan.has(pagina)) { verslag.overgeslagen.push(pagina); continue; }
    const pad = path.join(wortel, pagina);
    const oud = await readFile(pad, 'utf8');
    if (!heeftTitel(oud)) { verslag.overgeslagen.push(pagina); continue; }
    verslag.bekeken += 1;
    let nieuw = zetPictogrammen(oud, config.pictogrammen);
    const regel = regelVoor(pagina);
    if (regel) nieuw = zetTabtitel(nieuw, regel);
    if (nieuw !== oud) {
      await writeFile(pad, nieuw, 'utf8');
      verslag.pictogram += 1;
      if (regel) verslag.tabtitel += 1;
    }
  }
  return verslag;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const verslag = await pasToe('.');
  console.log(`Tabbladen bijgewerkt: ${verslag.bekeken} pagina's gecontroleerd, ${verslag.pictogram} aangepast, ${verslag.tabtitel} met meebewegende titel, ${verslag.overgeslagen.length} overgeslagen (fragment of zonder titel)`);
}
