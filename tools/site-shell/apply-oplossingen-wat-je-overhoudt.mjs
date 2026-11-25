import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Adds one plain outcome line ("Wat je overhoudt") above the link of each solution
// card on /oplossingen. No numbers, no guarantees. Idempotent.
const OUTCOMES = Object.freeze({
  nl: {
    'systemen-koppelen': 'Je typt gegevens één keer in en ze staan overal goed. De maandagse Excel-klus verdwijnt.',
    'ai-adoptie': 'Een korte lijst met waar AI bij jullie echt helpt, en duidelijke afspraken over welke bronnen je vertrouwt.',
    'ai-marketing-mkb': 'Een vaste routine die van wat je al weet content maakt, zonder dat je er elke week voor gaat zitten.',
    'due-diligence': 'Een overzicht van wat alleen in jouw hoofd zit, en wat je eraan doet voordat iemand erom vraagt.'
  },
  en: {
    'systemen-koppelen': 'You enter data once and it is right everywhere. The Monday spreadsheet chore goes away.',
    'ai-adoptie': 'A short list of where AI really helps you, and clear rules on which sources you trust.',
    'ai-marketing-mkb': 'A steady routine that turns what you already know into content, without a weekly scramble.',
    'due-diligence': 'An overview of what only lives in your head, and what to do about it before anyone asks.'
  }
});
const LABEL = { nl: 'Wat je overhoudt:', en: 'What you are left with:' };

export function applyOplossingenWatJeOverhoudt(html, locale = 'nl') {
  const outcomes = OUTCOMES[locale];
  if (!outcomes) throw new Error('OPLOSSINGEN_OVERHOUDT_LOCALE_UNSUPPORTED');
  let output = String(html || '');
  if (output.includes('data-bg-wat-je-overhoudt')) return output;
  let added = 0;
  for (const [slug, line] of Object.entries(outcomes)) {
    const link = new RegExp('<a class="text-link" href="(?:https://www\\.bedrijfsgeheugen\\.nl)?(?:/en)?/' + slug + '">', 'i');
    output = output.replace(link, match => {
      added += 1;
      return '<p data-bg-wat-je-overhoudt="' + slug + '" style="margin:.2rem 0 .8rem"><strong>' + LABEL[locale] + '</strong> ' + line + '</p>' + match;
    });
  }
  if (!added) throw new Error('OPLOSSINGEN_OVERHOUDT_NO_ANCHOR');
  return output;
}

export async function updateOplossingenFiles(root = '.') {
  const results = [];
  for (const [locale, relative] of [['nl', 'oplossingen.html'], ['en', 'en/oplossingen.html']]) {
    const file = root + '/' + relative;
    if (!existsSync(file)) { results.push({ locale, file, skipped: true }); continue; }
    const html = await readFile(file, 'utf8');
    const next = applyOplossingenWatJeOverhoudt(html, locale);
    if (next !== html) await writeFile(file, next, 'utf8');
    results.push({ locale, file, changed: next !== html });
  }
  return results;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  console.log(JSON.stringify(await updateOplossingenFiles()));
}
