import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Adds one concrete block to the V18 Frisse blik page: what you get, what it costs,
// how long it takes and what happens next. It fills the empty body section of the
// view, never creates a second hero and is idempotent.
const COPY = Object.freeze({
  nl: {
    title: 'Wat je krijgt, wat het kost en hoe lang het duurt',
    lead: 'Je begint gratis en beslist pas daarna of je verder wilt. Nu niet kopen is ook een geldige uitkomst.',
    steps: [
      '<strong>Gratis zelfscan, 3 minuten online.</strong> Een eerste score, je grootste risico’s en drie concrete acties. <a href="/zelfscan">Start de zelfscan</a>',
      '<strong>Bedrijfsgeheugen Scan: een dag meekijken, € 2.950 excl. btw, vaste prijs vooraf.</strong> Je krijgt een rapport waar je zelf mee verder kunt.',
      '<strong>Concrete bedragen per verbetering.</strong> Het rapport laat de grootste verbeterkansen zien en in welke volgorde je ze oppakt.',
      '<strong>Daarna kies jij.</strong> Laat je ons bouwen, dan wordt de scan verrekend. Ga je zelf verder, dan houd je het rapport.'
    ],
    demo: 'Hieronder zie je in een demo hoe de twaalf dimensies samen een score en een eerste prioriteit geven.'
  },
  en: {
    title: 'What you get, what it costs and how long it takes',
    lead: 'You start free and only then decide whether to continue. Not buying is a valid outcome too.',
    steps: [
      '<strong>Free self-scan, 3 minutes online.</strong> A first score, your biggest risks and three concrete actions. <a href="/en/zelfscan">Start the self-scan</a>',
      '<strong>Bedrijfsgeheugen Scan: a day of observation, € 2,950 excl. VAT, fixed price up front.</strong> You get a report you can continue with on your own.',
      '<strong>Concrete amounts per improvement.</strong> The report shows the biggest opportunities and the order to tackle them in.',
      '<strong>Then you choose.</strong> If you have us build, the scan is credited. If you continue on your own, you keep the report.'
    ],
    demo: 'Below, a demo shows how the twelve dimensions add up to a score and a first priority.'
  }
});

function block(copy) {
  return '<div class="frisse-concreet" data-bg-frisse-concreet="v1" style="max-width:860px;margin:0 0 1.5rem">'
    + '<h2 style="margin:0 0 .5rem">' + copy.title + '</h2>'
    + '<p>' + copy.lead + '</p>'
    + '<ol style="margin:.8rem 0 .8rem 1.2rem;padding:0;line-height:1.55">'
    + copy.steps.map(step => '<li style="margin:0 0 .5rem">' + step + '</li>').join('')
    + '</ol><p>' + copy.demo + '</p></div>';
}

export function applyFrisseBlikConcreet(html, locale = 'nl') {
  const copy = COPY[locale];
  if (!copy) throw new Error('FRISSE_BLIK_CONCREET_LOCALE_UNSUPPORTED');
  const input = String(html || '');
  if (input.includes('data-bg-frisse-concreet="v1"')) return input;
  const emptyBody = /(<section class="inhoud-body"[^>]*>\s*<div class="wrap">)(\s*)(<\/div>\s*<\/section>)/i.exec(input);
  if (emptyBody) {
    return input.slice(0, emptyBody.index) + emptyBody[1] + block(copy) + emptyBody[3] + input.slice(emptyBody.index + emptyBody[0].length);
  }
  const scan = input.search(/<section class="v17-scan-page/i);
  if (scan < 0) throw new Error('FRISSE_BLIK_CONCREET_NO_ANCHOR');
  return input.slice(0, scan) + '<section class="inhoud-body" style="padding:34px 0 6px"><div class="wrap">' + block(copy) + '</div></section>' + input.slice(scan);
}

export async function updateFrisseBlikFiles(root = '.') {
  const results = [];
  for (const [locale, relative] of [['nl', 'frisse-blik.html'], ['en', 'en/frisse-blik.html']]) {
    const file = root + '/' + relative;
    if (!existsSync(file)) {
      if (locale === 'nl') throw new Error('FRISSE_BLIK_CONCREET_NL_PAGE_MISSING');
      results.push({ locale, file, changed: false, skipped: true });
      continue;
    }
    const html = await readFile(file, 'utf8');
    const next = applyFrisseBlikConcreet(html, locale);
    if (next !== html) await writeFile(file, next, 'utf8');
    results.push({ locale, file, changed: next !== html });
  }
  return results;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  console.log(JSON.stringify(await updateFrisseBlikFiles()));
}
