import assert from 'node:assert/strict';
import { readFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES, verifyGlobalComponentHashes, verifyPageShell } from './site-shell/contracts.mjs';

const TRUST = ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb'];
const heeftElement = (html, klasse) => new RegExp(`<div\\b[^>]*class="[^"]*\\b${klasse.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b[^"]*"`, 'i').test(html);

export async function controleerSiteUi() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!PUBLIC_PAGE_EXCLUDES.has(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  bestanden.push('blog/index.html');

  const paginas = [];
  for (const bestand of [...new Set(bestanden)]) {
    let html; try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    if (!html.includes('<body')) continue;

    for (const tekst of TRUST) assert.ok(html.includes(tekst), `${bestand}: trustbalk mist “${tekst}”`);
    assert.ok(!heeftElement(html, 'bgx-gegevens'), `${bestand}: oude contactbalk staat nog bovenaan`);

    if (bestand === 'prijzen.html') {
      assert.ok(heeftElement(html, 'bgx-vraagbalk'), 'prijzen.html: vraagblok ontbreekt');
      assert.ok(heeftElement(html, 'bgx-rekenaar'), 'prijzen.html: rekenblok ontbreekt');
      assert.ok(heeftElement(html, 'bgx-rol'), 'prijzen.html: rolblok ontbreekt');
      assert.ok(!html.includes('id="bgkopMob"'), 'prijzen.html: legacy eigen mobiel menu is teruggekomen');
      assert.ok(!/class="[^"]*\bbgkop\b/.test(html), 'prijzen.html: legacy eigen header is teruggekomen');
    } else {
      assert.ok(!heeftElement(html, 'bgx-vraagbalk'), `${bestand}: vraagblok hoort alleen op prijzen`);
      assert.ok(!heeftElement(html, 'bgx-rekenaar'), `${bestand}: rekenblok hoort alleen op prijzen`);
      assert.ok(!heeftElement(html, 'bgx-rol'), `${bestand}: rolblok hoort alleen op prijzen`);
    }

    assert.ok(html.includes('Bedrijfsgeheugen · Enschede'), `${bestand}: Enschede ontbreekt in footer`);
    assert.ok(html.includes('ma–vr 08:00–18:00'), `${bestand}: openingstijden ontbreken in footer`);
    assert.ok(html.includes('mailto:arthur@bedrijfsgeheugen.nl'), `${bestand}: e-mail ontbreekt in footer`);
    assert.ok(html.includes('tel:+31627483345'), `${bestand}: telefoon ontbreekt in footer`);

    verifyPageShell(html, bestand);
    paginas.push({ path: bestand, html });
  }

  assert.ok(paginas.length > 20, `te weinig pagina's gecontroleerd: ${paginas.length}`);
  const hashes = verifyGlobalComponentHashes(paginas);
  console.log(`Canonical brand shell OK: ${paginas.length} pagina's; componenthashes ${JSON.stringify(hashes)}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await controleerSiteUi();
