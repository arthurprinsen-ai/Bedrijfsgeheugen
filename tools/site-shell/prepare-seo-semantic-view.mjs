import { readFile, writeFile, glob } from 'node:fs/promises';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

export function maakSeoSemantischeMainView(input) {
  const html = String(input);
  const start = html.search(/<main\b/i);
  const endStart = html.search(/<\/main\s*>/i);
  if (start < 0 || endStart < start) return html;
  const endMatch = html.slice(endStart).match(/^<\/main\s*>/i);
  const end = endStart + (endMatch?.[0].length || 7);
  const main = html.slice(start, end).replace(
    new RegExp(`href=(['"])${ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'gi'),
    (_heel, quote) => `href=${quote}/`
  );
  return html.slice(0, start) + main + html.slice(end);
}

export async function bereidSeoSemantischeViewVoor() {
  const bestanden = [];
  for await (const p of glob('*.html')) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  let gewijzigd = 0;
  for (const bestand of [...new Set(bestanden)]) {
    const html = await readFile(bestand, 'utf8');
    const nieuw = maakSeoSemantischeMainView(html);
    if (nieuw !== html) {
      await writeFile(bestand, nieuw, 'utf8');
      gewijzigd++;
    }
  }
  console.log(`SEO semantic view prepared for ${gewijzigd} pagina's; canonical header/footer blijven absoluut`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await bereidSeoSemantischeViewVoor();
}
