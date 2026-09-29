import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const moneyPages=[
  'index.html',
  'prijzen.html',
  'product.html',
  'bedrijfsprocessen-automatiseren.html',
  'afas-koppeling.html',
  'exact-online-koppeling.html',
  'api-koppeling-laten-maken.html',
  'power-bi-implementatie.html',
  'ai-automatisering-mkb.html'
];

test('priority money pages use one low-friction Frisse Blik conversion path',()=>{
  for(const path of moneyPages){
    const html=readFileSync(path,'utf8');
    assert.match(html,/data-money-primary[^>]+href=["'](?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/frisse-blik["']/i,`${path}: primary CTA must lead to Frisse Blik`);
    assert.match(html,/geen verplichting/i,`${path}: risk reversal must be explicit`);
  }
});

test('conversion copy stays evidence-safe and commercially consistent',()=>{
  const home=readFileSync('index.html','utf8');
  const product=readFileSync('product.html','utf8');
  const afas=readFileSync('afas-koppeling.html','utf8');
  const process=readFileSync('bedrijfsprocessen-automatiseren.html','utf8');

  assert.doesNotMatch(home,/Vertrouwd door organisaties in het mkb/i);
  assert.doesNotMatch(product,/ISO 27001-ready/i);
  assert.doesNotMatch(afas,/vanaf\s*&?euro;?\s*29\s*per maand/i);
  assert.doesNotMatch(process,/Frisse blik<\/a> is een dag meekijken/i);
  assert.doesNotMatch(process,/<a\b[^>]*>[^<]*<p\b/i);
});

test('paid follow-up is positioned after free qualification rather than before it',()=>{
  const process=readFileSync('bedrijfsprocessen-automatiseren.html','utf8');
  const ai=readFileSync('ai-automatisering-mkb.html','utf8');
  const pricing=readFileSync('prijzen.html','utf8');

  assert.match(process,/gratis Frisse Blik[\s\S]{0,500}Bedrijfsgeheugen Scan/i);
  assert.match(ai,/Frisse Blik \(gratis\)[\s\S]{0,250}Bedrijfsgeheugen Scan/i);
  assert.match(pricing,/Begin gratis met een Frisse Blik/i);
});
