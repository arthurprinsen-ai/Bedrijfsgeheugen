// Bouwt sitemap.xml uit de daadwerkelijke pagina's, bij elke build.
//
// Waarom gegenereerd en niet met de hand: de handmatige sitemap liep zeven
// pagina's achter. Nieuwe pagina's stonden er niet in, dus Google wist niet
// dat ze bestonden. Een bestand dat je moet onthouden bij te werken, vergeet
// je een keer.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASIS = 'https://www.bedrijfsgeheugen.nl';
// pagina's die bewust niet in Google horen
const OVERSLAAN = new Set(['404.html', 'index-oud.html', 'klantportaal.html',
                           'klantportaal-demo.html', 'bedankt.html']);

function paginas(map = '.', diep = 0) {
  const uit = [];
  for (const naam of readdirSync(map)) {
    if (naam.startsWith('.') || naam === 'node_modules' || naam === 'assets' || naam === 'intern' ||
        naam === 'tools' || naam === 'netlify' || naam === 'components') continue;
    const pad = join(map, naam);
    const st = statSync(pad);
    if (st.isDirectory() && diep < 2) uit.push(...paginas(pad, diep + 1));
    else if (naam.endsWith('.html')) uit.push({ pad, tijd: st.mtime });
  }
  return uit;
}

const rijen = [];
for (const { pad, tijd } of paginas()) {
  const naam = pad.split('/').pop();
  if (OVERSLAAN.has(naam)) continue;
  const html = readFileSync(pad, 'utf8');
  // een pagina met noindex hoort er bewust niet in
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) continue;

  // wijst de pagina canoniek naar een ander adres, dan is dat adres de pagina
  // die Google moet indexeren. Beide aanmelden is een tegenstrijdig signaal.
  const eigenCanon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);

  let url;
  if (pad === 'index.html') url = '/';
  else if (naam === 'index.html') url = '/' + pad.slice(0, -'index.html'.length);
  else url = '/' + pad.slice(0, -'.html'.length);
  url = url.replace(/^\.\//, '/').replace(/\/{2,}/g, '/');
  if (eigenCanon && eigenCanon[1].replace(BASIS, '').replace(/\/$/, '') !== url.replace(/\/$/, '')) continue;

  rijen.push(
    `  <url><loc>${BASIS}${url}</loc><lastmod>${tijd.toISOString().slice(0, 10)}</lastmod></url>`
  );
}

rijen.sort();
writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  rijen.join('\n') + '\n</urlset>\n');
console.log('sitemap.xml: ' + rijen.length + " pagina's");
