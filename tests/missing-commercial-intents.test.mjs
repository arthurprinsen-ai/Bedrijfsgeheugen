import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routes = [
  ['ai-implementatie-mkb.html','/ai-implementatie-mkb'],
  ['kennis-borgen-bedrijf.html','/kennis-borgen-bedrijf'],
  ['microsoft-365-koppeling.html','/microsoft-365-koppeling'],
  ['power-bi-implementatie-mkb.html','/power-bi-implementatie-mkb'],
  ['bedrijf-overdraagbaar-maken.html','/bedrijf-overdraagbaar-maken']
];

test('all canonical commercial-intent pages exist and satisfy the conversion contract', () => {
  for (const [file, route] of routes) {
    assert.equal(fs.existsSync(file), true, `${file} must exist`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.bedrijfsgeheugen\\.nl${route.replaceAll('/','\\/')}"`));
    assert.match(html, /<h1[^>]*>[^<]*|<h1[^>]*>[\s\S]*?<\/h1>/);
    assert.match(html, /<meta name="description" content="[^"]{70,}/);
    assert.match(html, /(vaste prijs|prijs vooraf|prijs en scope|investering|vanaf €|€)/i);
    assert.match(html, /(bewijs|praktijk|controle|nulmeting|meetbaar|bron)/i);
    assert.match(html, /(bezwaar|niet nodig|hoeft niet|geen big-bang|zonder vervangen|wanneer niet)/i);
    assert.match(html, /(eigendom|van jou|jouw omgeving|geen lock-in|sleutels|overdraagbaar)/i);
    assert.match(html, /(Plan|Bespreek|Vraag|Start|Laat).{0,45}(gesprek|scan|prijs|sessie|implementatie|koppeling|analyse)/i);
    assert.match(html, /<script src="\/assets\/stijl\.js" defer><\/script>/);
  }
});

test('shared conversion runtime registers every new commercial route', () => {
  const js = fs.readFileSync('assets/stijl.js','utf8');
  for (const [, route] of routes) assert.match(js, new RegExp(`'${route}'\\s*:`));
});

test('AI automation sub-intent is consolidated instead of creating a thin competing page', () => {
  assert.equal(fs.existsSync('ai-automatisering-mkb.html'), false);
});