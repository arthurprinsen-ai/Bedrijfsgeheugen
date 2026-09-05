import assert from 'node:assert/strict';
import { readFile, glob } from 'node:fs/promises';

const OVERSLAAN = new Set(['index-oud.html', 'prototype-v18-stable.html', 'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']);
const TRUST = ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb'];

export async function controleerSiteUi() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!OVERSLAAN.has(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  bestanden.push('blog/index.html');

  let gecontroleerd = 0;
  for (const bestand of [...new Set(bestanden)]) {
    let html;
    try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    if (!html.includes('<body')) continue;

    for (const tekst of TRUST) assert.ok(html.includes(tekst), `${bestand}: trustbalk mist “${tekst}”`);
    assert.ok(!html.includes('bgx-gegevens'), `${bestand}: oude contactbalk staat nog bovenaan`);

    if (bestand === 'prijzen.html') {
      assert.ok(html.includes('bgx-vraagbalk'), 'prijzen.html: vraagblok ontbreekt');
      assert.ok(html.includes('bgx-rekenaar'), 'prijzen.html: rekenblok ontbreekt');
      assert.ok(html.includes('bgx-rol'), 'prijzen.html: rolblok ontbreekt');
      for (const tekst of ['ONTDEKKEN', 'KENNIS &amp; BEDRIJF', 'START', '>Home<', '>Platform<', '>Prijzen<', '>Cases<', '>Gratis zelfscan<', '>Frisse Blik Scan<']) {
        assert.ok(html.includes(tekst), `prijzen.html: juiste mobiele menu mist ${tekst}`);
      }
      const menu = html.match(/<div class="bgkop-mob" id="bgkopMob"[\s\S]*?<\/div>\s*<script id="bg-uniform-mobile-close-js">/)?.[0] || html;
      for (const m of menu.matchAll(/href="([^"]+)"/g)) {
        assert.ok(/^https:\/\/www\.bedrijfsgeheugen\.nl\//.test(m[1]), `prijzen.html: menu-href niet absoluut: ${m[1]}`);
      }
    } else {
      assert.ok(!html.includes('bgx-vraagbalk'), `${bestand}: vraagblok hoort alleen op prijzen`);
      assert.ok(!html.includes('bgx-rekenaar'), `${bestand}: rekenblok hoort alleen op prijzen`);
      assert.ok(!html.includes('bgx-rol'), `${bestand}: rolblok hoort alleen op prijzen`);
    }

    if (html.includes('<footer')) {
      assert.ok(html.includes('Bedrijfsgeheugen · Enschede'), `${bestand}: Enschede ontbreekt in footer`);
      assert.ok(html.includes('ma–vr 08:00–18:00'), `${bestand}: openingstijden ontbreken in footer`);
      assert.ok(html.includes('mailto:arthur@bedrijfsgeheugen.nl'), `${bestand}: e-mail ontbreekt in footer`);
      assert.ok(html.includes('tel:+31627483345'), `${bestand}: telefoon ontbreekt in footer`);
    }
    gecontroleerd++;
  }

  assert.ok(gecontroleerd > 20, `te weinig pagina's gecontroleerd: ${gecontroleerd}`);
  console.log(`Site-UI contract OK: ${gecontroleerd} pagina's gecontroleerd`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await controleerSiteUi();
