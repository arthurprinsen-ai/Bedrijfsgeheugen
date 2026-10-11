import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const article = readFileSync(new URL('../blog/wat-kost-digitalisering-mkb/index.html', import.meta.url), 'utf8');
const pricing = readFileSync(new URL('../prijzen.html', import.meta.url), 'utf8');
const cache = JSON.parse(readFileSync(new URL('../config/bg-static-i18n-en.d/2026-10-11-pricing-article-trust.json', import.meta.url), 'utf8'));
const graph = JSON.parse(article.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/)[1])['@graph'];
const post = graph.find(x => x['@type'] === 'BlogPosting');
const faq = graph.find(x => x['@type'] === 'FAQPage');

test('pricing article uses the same published commercial prices as canonical pricing owner', () => {
  for (const price of ['99', '2.950', '14.500']) {
    assert.match(pricing, new RegExp(price.replace('.', '\\\\.')));
    assert.match(article, new RegExp(price.replace('.', '\\\\.')));
  }
  for (const stale of ['2.900', '29 per maand', 'verkoopt geen software', '348 beheer']) assert.equal(article.includes(stale), false, stale);
  assert.match(article, /href="https:\\/\\/www\\.bedrijfsgeheugen\\.nl\\/prijzen"/);
  assert.match(article, /href="https:\\/\\/www\\.bedrijfsgeheugen\\.nl\\/zelfscan"/);
});

test('schema, visible FAQ and freshness remain consistent', () => {
  assert.equal(post.dateModified, '2026-10-11');
  assert.match(article, /Bijgewerkt 11 oktober 2026/);
  for (const item of faq.mainEntity) {
    assert.ok(article.includes('<h3>' + item.name + '</h3><p>' + item.acceptedAnswer.text + '</p>'), item.name);
  }
});

test('new article content has explicit English translation cache coverage', () => {
  for (const text of ["Digitalisering in het mkb heeft geen vaste prijs: de kosten hangen af van het proces, de scope en de gekozen aanpak. Bij Bedrijfsgeheugen is de Frisse Blik van 30 minuten gratis, kost de verdiepende Bedrijfsgeheugen Scan € 2.950, begint Powerhouse SaaS vanaf € 99 per maand en een Build Sprint vanaf € 14.500. Hieronder staan de actuele startprijzen en het onderscheid tussen vaste prijzen en offertes.","Rekenvoorbeeld: Powerhouse Starter kost € 99 per maand, oftewel € 1.188 bij twaalf maanden, exclusief eventuele implementatie. De Bedrijfsgeheugen Scan kost € 2.950 eenmalig en een Build Sprint begint vanaf € 14.500. Volgens de actuele prijsafspraken wordt de betaalde Scan verrekend met een aansluitende Build Sprint die binnen 30 dagen start. Niet iedere organisatie heeft al deze onderdelen nodig.","In dit rekenvoorbeeld is een eenmalige investering van € 6.000 bij € 12.420 tot € 18.630 aan jaarlijkse tijdsbesparing in circa vier tot zes maanden terugverdiend, vóór eventuele aanvullende software-, beheer- of implementatiekosten. Dit is een rekensom op aannames, geen vastgesteld klantresultaat of garantie."]) assert.equal(typeof cache[text], 'string');
});
