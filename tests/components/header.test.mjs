import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('components/header/header.html', 'utf8');
const css = await readFile('components/header/header.css', 'utf8');
const js = await readFile('components/header/header.js', 'utf8');
const contract = JSON.parse(await readFile('components/header/contract.json', 'utf8'));

test('header preserves the accepted desktop and mobile navigation surface', () => {
  assert.match(html, /data-bg-component="header"/);
  assert.match(html, /Bedrijfsgeheugen\.nl — naar de homepage/);
  for (const label of ['Oplossingen','Koppelingen','Het bedrijfsgeheugen','Kennis','Over ons']) {
    assert.ok(html.includes(label), `missing navigation label: ${label}`);
  }
  for (const href of ['/systemen-koppelen','/afas-koppeling','/product','/blog/','/over-ons','/frisse-blik']) {
    assert.ok(html.includes(`href="${href}"`), `missing navigation target: ${href}`);
  }
  assert.match(html, /id="bgkopKnop"/);
  assert.match(html, /aria-controls="bgkopMob"/);
  assert.match(html, /id="bgkopMob" hidden/);
});

test('header keeps current mobile menu behavior including Escape and scroll lock', () => {
  assert.match(js, /e\.key === 'Escape'/);
  assert.match(js, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(js, /innerWidth > 1100/);
  assert.match(js, /querySelectorAll\('\.bgkop-macc'\)/);
});

test('header styles stay component-local and retain current responsive breakpoints', () => {
  assert.doesNotMatch(css, /(^|[,{]\s*)(html|body|footer|h1)(?=[\s,{:#.[])/m);
  assert.match(css, /@media\(max-width:1120px\)/);
  assert.match(css, /@media\(min-width:1101px\)/);
  assert.match(css, /position:sticky/);
});

test('header contract declares its owned files and invariants', () => {
  assert.equal(contract.id, 'header');
  assert.equal(contract.root, '[data-bg-component="header"]');
  for (const file of ['components/header/header.html','components/header/header.css','components/header/header.js']) {
    assert.ok(contract.ownedFiles.includes(file), `contract does not own ${file}`);
  }
  assert.ok(contract.invariants.includes('navigation-links-preserved'));
  assert.ok(contract.invariants.includes('mobile-menu-keyboard-behavior-preserved'));
});
