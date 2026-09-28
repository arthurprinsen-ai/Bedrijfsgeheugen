import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('pages/groei.html','utf8');
const redirects=fs.readFileSync('_redirects','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');

test('Growth Lab has canonical public route and safe calculators',()=>{
  assert.match(page,/https:\/\/www\.bedrijfsgeheugen\.nl\/groei/);
  assert.match(page,/powerhouse-growth-tools/);
  assert.match(page,/lost-knowledge/);
  assert.match(page,/ma-risk/);
  assert.match(page,/friction-index/);
  assert.match(redirects,/\/groei\s+\/pages\/groei\.html\s+200/);
  assert.match(sitemap,/https:\/\/www\.bedrijfsgeheugen\.nl\/groei<\/loc>/);
});

test('Growth Lab preserves truth boundaries',()=>{
  assert.match(page,/Scenario-inschatting/);
  assert.match(page,/geen geobserveerde financiële schade/i);
  assert.match(page,/Risico-inschatting/);
  assert.match(page,/Geen verzonnen benchmark/i);
  assert.match(page,/minimaal 5 waarnemingen/i);
});

test('Growth Lab connects to Frisse Blik',()=>{
  assert.match(page,/href="\/frisse-blik"/);
  assert.match(page,/Doe de Frisse Blik/);
});
