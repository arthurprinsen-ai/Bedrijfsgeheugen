import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SOURCE = {
  deploy: '6a918685f3737c0008ee981a',
  commit: '195d30e411a327553f81be40815d4c0d8da4e98d',
  pr: 96,
  prototype: 'prototype-v18-6.html'
};

const contracts = [
  ['problemen.html', ['Waar organisaties tijd, kennis en controle verliezen.', 'Versnippering', 'Afhankelijkheid', 'Handwerk', 'AI zonder houvast']],
  ['oplossingen.html', ['Organisatie, automatisering, data en AI in samenhang.', 'Organisatie', 'Automatiseren', 'Verbinden', 'AI & data']],
  ['bedrijfsgeheugen.html', ['Managementoverzicht', 'Strategie & OKR', 'Processen', 'AI-assistent']],
  ['prijzen.html', ['Meer regie naarmate je groeit.', 'Start', 'Scale', 'Control', 'Enterprise']],
  ['cases.html', ['Van vastlopen naar werkend.', 'Order-to-cash', 'Kennisborging', 'Managementinformatie']],
  ['kennis.html', ['Vraag, lees en vertaal kennis naar je eigen bedrijf.', 'Kennisverlies', 'AI governance', 'Procesautomatisering', 'Benchmark']],
  ['over-ons.html', ['Een bedrijf hoort niet afhankelijk te zijn van wat mensen toevallig onthouden.', 'Ons verhaal', 'De kennis was er wel. Alleen niet als één geheel.', 'Onze missie', 'Van chaos naar grip en controle.', 'Samenhang', 'Continuïteit', 'Ruimte', 'Betrouwbare AI']],
  ['frisse-blik.html', ['Waar laat je organisatie vandaag waarde liggen?', 'Prioriteiten']],
  ['inloggen.html', ['Open je Bedrijfsgeheugen.', 'Portal-preview']],
  ['aanmelden.html', ['Start met je bedrijfscontext.', 'Bedrijf', 'Prioriteit', 'Bronnen']]
];

test('accepted V18.6 deploy is documented as the reconstruction source', async () => {
  const design = await readFile('docs/superpowers/specs/2026-08-29-complete-website-reconstruction-design.md', 'utf8');
  for (const value of [SOURCE.deploy, SOURCE.commit, `PR #${SOURCE.pr}`, SOURCE.prototype]) {
    assert.match(design, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing accepted source evidence: ${value}`);
  }
});

test('standalone primary routes preserve all accepted V18.6 page semantics', async () => {
  for (const [file, anchors] of contracts) {
    const html = await readFile(file, 'utf8');
    for (const anchor of anchors) assert.ok(html.includes(anchor), `${file} lost accepted V18.6 anchor: ${anchor}`);
  }
});

test('over-ons keeps the accepted source and the subsequently approved ambition extension', async () => {
  const html = await readFile('over-ons.html', 'utf8');
  assert.ok(html.includes('Onze ambitie'));
  assert.ok(html.includes('Bedrijfskennis moet net zo bestuurbaar worden als geld, mensen en systemen.'));
});
