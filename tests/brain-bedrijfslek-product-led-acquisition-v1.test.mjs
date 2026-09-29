import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('Bedrijfslek delivers full value before PII capture',()=>{
  const scan=read('zelfscan.html');
  assert.match(scan,/Gratis Bedrijfslek · 12 vragen · 3 minuten/i);
  assert.match(scan,/Waar lekt tijd, geld en kennis uit jouw bedrijf\?/i);
  assert.match(scan,/Twaalf klikvragen/i);
  assert.match(scan,/Geen formulier, geen e-mailmuur, geen verkoopgesprek nodig/i);
  assert.match(scan,/Drie acties die je morgen kunt nemen/i);
  assert.doesNotMatch(scan,/Beantwoord zes vragen/i);
  assert.doesNotMatch(scan,/id="scanform"/i);
  assert.match(scan,/Start met het portaal/i);
  assert.match(scan,/https:\/\/www\.bedrijfsgeheugen\.nl\/product/i);
});

test('homepage and build authority preserve Bedrijfslek as primary acquisition path',()=>{
  const home=read('index.html');
  const build=read('tools/site-shell/apply-money-page-order-conversion.mjs');
  assert.match(home,/data-money-primary[^>]+href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/i);
  assert.match(home,/Geen formulier\. Geen e-mail\. Geen verplichting\. Meteen resultaat\./i);
  assert.match(home,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\//i);
  assert.match(build,/https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan/);
  assert.match(build,/Ontdek gratis waar je bedrijf lekt/i);
  assert.match(build,/Geen verplichting/i);
});


test('V18 generator cannot overwrite the standalone Bedrijfslek route',()=>{
  const views=read('tools/v18-views-lijst.mjs');
  const integrity=read('tools/site-shell/bedrijfslek-build-integrity.mjs');
  const netlify=read('netlify.toml');
  assert.doesNotMatch(views,/view:\s*['"]selfscan['"]/i);
  assert.match(views,/Bedrijfslek-productroute/i);
  assert.match(views,/V18-generator mag die standalone acquisitieroute niet overschrijven/i);
  assert.match(integrity,/BEDRIJFSLEK_INTEGRITY_LEGACY_SIX_QUESTIONS/);
  assert.match(netlify,/bedrijfslek-build-integrity\.mjs capture/);
  assert.match(netlify,/bedrijfslek-build-integrity\.mjs restore/);
  assert.match(netlify,/bedrijfslek-build-integrity\.mjs restore[^\n]*normaliseer-site-ui\.mjs/);
});


test('Bedrijfslek turns one result into a privacy-safe team challenge loop',()=>{
  const scan=read('zelfscan.html');
  assert.match(scan,/Daag mijn MT \/ collega uit/i);
  assert.match(scan,/challenge_score/);
  assert.match(scan,/challenge_risk/);
  assert.match(scan,/bedrijfslek-teamchallenge-share/);
  assert.match(scan,/bedrijfslek-teamchallenge-complete/);
  assert.match(scan,/zonder account of e-mailadres/i);
  assert.match(scan,/verschil met jouw score/i);
});


test('Bedrijfsgeheugen Mini converts diagnosis into action before paid conversion',()=>{
  const scan=read('zelfscan.html');
  assert.match(scan,/Gratis Bedrijfsgeheugen Mini · 7 dagen/i);
  assert.match(scan,/renderMini\(laagste\)/);
  assert.match(scan,/bg_bedrijfsgeheugen_mini/);
  assert.match(scan,/bedrijfsgeheugen-mini-action-done/);
  assert.match(scan,/bedrijfsgeheugen-mini-complete/);
  assert.match(scan,/voortgang blijft alleen in deze browser bewaard/i);
  assert.match(scan,/borg dit structureel in het portaal/i);
});
