import assert from 'node:assert/strict';
import { readFile, glob } from 'node:fs/promises';

const OVERSLAAN = new Set(['index-oud.html', 'prototype-v18-stable.html', 'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']);
const TRUST = ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb'];
const heeftElement = (html, klasse) => new RegExp(`<div\\b[^>]*class="[^"]*\\b${klasse.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b[^"]*"`, 'i').test(html);

const PRIJZEN_MENU_LINKS = [
  ['https://www.bedrijfsgeheugen.nl/', 'Home'],
  ['https://www.bedrijfsgeheugen.nl/oplossingen', 'Oplossingen'],
  ['https://www.bedrijfsgeheugen.nl/product', 'Platform'],
  ['https://www.bedrijfsgeheugen.nl/prijzen', 'Prijzen'],
  ['https://www.bedrijfsgeheugen.nl/cases', 'Cases'],
  ['https://www.bedrijfsgeheugen.nl/kennis', 'Kennis'],
  ['https://www.bedrijfsgeheugen.nl/over-ons', 'Over ons'],
  ['https://www.bedrijfsgeheugen.nl/meer', 'Meer'],
  ['https://www.bedrijfsgeheugen.nl/zelfscan', 'Gratis zelfscan'],
  ['https://www.bedrijfsgeheugen.nl/frisse-blik', 'Frisse Blik Scan'],
  ['https://www.bedrijfsgeheugen.nl/inloggen', 'Inloggen'],
  ['https://www.bedrijfsgeheugen.nl/aanmelden', 'Aanmelden →']
];

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
    assert.ok(!heeftElement(html, 'bgx-gegevens'), `${bestand}: oude contactbalk staat nog bovenaan`);

    if (bestand === 'prijzen.html') {
      assert.ok(heeftElement(html, 'bgx-vraagbalk'), 'prijzen.html: vraagblok ontbreekt');
      assert.ok(heeftElement(html, 'bgx-rekenaar'), 'prijzen.html: rekenblok ontbreekt');
      assert.ok(heeftElement(html, 'bgx-rol'), 'prijzen.html: rolblok ontbreekt');
      for (const tekst of ['ONTDEKKEN', 'KENNIS &amp; BEDRIJF', 'START']) {
        assert.ok(html.includes(tekst), `prijzen.html: juiste mobiele menu mist ${tekst}`);
      }
      for (const [href, label] of PRIJZEN_MENU_LINKS) {
        assert.ok(html.includes(`href="${href}"`), `prijzen.html: absolute menu-link ontbreekt: ${href}`);
        assert.ok(html.includes(`>${label}</a>`), `prijzen.html: menu-item ontbreekt: ${label}`);
      }
    } else {
      assert.ok(!heeftElement(html, 'bgx-vraagbalk'), `${bestand}: vraagblok hoort alleen op prijzen`);
      assert.ok(!heeftElement(html, 'bgx-rekenaar'), `${bestand}: rekenblok hoort alleen op prijzen`);
      assert.ok(!heeftElement(html, 'bgx-rol'), `${bestand}: rolblok hoort alleen op prijzen`);
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
