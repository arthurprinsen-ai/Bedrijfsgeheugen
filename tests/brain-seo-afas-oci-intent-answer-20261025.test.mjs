import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('AFAS commercial intent owner answers observed OCI buying question with official source', async () => {
  const page = await read('../afas-koppeling.html');
  assert.match(page, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/afas-koppeling">/);
  assert.match(page, /AFAS OCI-koppeling voor inkoop bij leveranciers/);
  assert.match(page, /InSite zijn ingericht/);
  assert.match(page, /AFAS Help Center over OCI/);
  assert.match(page, /href="https:\/\/www\.afas\.help\/vraagantwoordafas\/NL\/SE\/Ord_Purch_Config_Req_OCI_All\.htm"/);
  assert.match(page, /href="\/#contact">Bespreek je AFAS-koppeling/);
  assert.doesNotMatch(page, /OCI-koppeling.{0,120}(?:gegarandeerd|altijd gratis)/i);
});

test('existing price explainer supports AFAS money owner without duplicate landing page', async () => {
  const page = await read('../blog/wat-kost-een-afas-koppeling/index.html');
  assert.match(page, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/wat-kost-een-afas-koppeling\/">/);
  assert.match(page, /AFAS OCI-koppeling/);
  assert.match(page, /href="\/afas-koppeling">AFAS-koppelingspagina<\/a>/);
});

test('OCI translation cache preserves English answer without provider translation dependency', async () => {
  const translations = JSON.parse(await read('../config/bg-static-i18n-en.d/2026-10-25-afas-oci-intent.json'));
  for (const phrase of ['AFAS OCI-koppeling voor inkoop bij leveranciers','AFAS Help Center over OCI','AFAS-koppelingspagina']) {
    assert.ok(translations[phrase] && translations[phrase] !== phrase);
  }
});
