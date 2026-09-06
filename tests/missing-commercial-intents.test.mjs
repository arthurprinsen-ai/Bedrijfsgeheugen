import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const newRoutes = [
  ['ai-implementatie-mkb.html','/ai-implementatie-mkb'],
  ['kennis-borgen-bedrijf.html','/kennis-borgen-bedrijf'],
  ['microsoft-365-koppeling.html','/microsoft-365-koppeling'],
  ['power-bi-implementatie-mkb.html','/power-bi-implementatie-mkb'],
  ['bedrijf-overdraagbaar-maken.html','/bedrijf-overdraagbaar-maken']
];
const consolidatedRoutes = [
  '/api-koppeling-laten-maken',
  '/ai-governance',
  '/data-soevereiniteit'
];

test('all new canonical commercial-intent pages exist and satisfy the conversion contract', () => {
  for (const [file, route] of newRoutes) {
    assert.equal(fs.existsSync(file), true, `${file} must exist`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.bedrijfsgeheugen\\.nl${route.replaceAll('/','\\/')}"`));
    assert.match(html, /<h1[^>]*>[\s\S]*?<\/h1>/);
    assert.match(html, /<meta name="description" content="[^"]{70,}/);
    assert.match(html, /(vaste prijs|prijs vooraf|prijs en scope|investering|vanaf €|€)/i);
    assert.match(html, /(bewijs|praktijk|controle|nulmeting|meetbaar|bron)/i);
    assert.match(html, /(bezwaar|niet nodig|hoeft niet|geen big-bang|zonder vervangen|wanneer niet|wanneer dit niet)/i);
    assert.match(html, /(eigendom|van jou|jouw omgeving|geen lock-in|sleutels|overdraagbaar)/i);
    assert.match(html, /(Plan|Bespreek|Vraag|Start|Laat).{0,60}(gesprek|scan|prijs|sessie|implementatie|koppeling|analyse|vraag|risico)/i);
    assert.match(html, /<script src="\/assets\/stijl\.js" defer><\/script>/);
  }
});

test('shared loader and extension register all new and consolidated commercial routes', () => {
  const shared = fs.readFileSync('assets/stijl.js','utf8');
  const ext = fs.readFileSync('assets/money-page-intents-v2.js','utf8');
  assert.match(shared, /\/assets\/money-page-intents-v2\.js/);
  for (const [, route] of newRoutes) {
    assert.match(shared, new RegExp(`'${route}'`));
    assert.match(ext, new RegExp(`'${route}'\\s*:`));
  }
  for (const route of consolidatedRoutes) {
    assert.match(shared, new RegExp(`'${route}'`));
    assert.match(ext, new RegExp(`'${route}'\\s*:`));
  }
  assert.match(ext, /document\.readyState/);
});

test('AI automation sub-intent is consolidated instead of creating a thin competing page', () => {
  assert.equal(fs.existsSync('ai-automatisering-mkb.html'), false);
});