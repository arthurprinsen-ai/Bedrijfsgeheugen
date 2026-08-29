import { readFile, writeFile } from 'node:fs/promises';

const OVER_ONS_FILE = 'over-ons.html';
const OVER_ONS_FRAGMENT = 'site/accepted-pages/over-ons-main.html';

function replaceSingle(input, pattern, replacement, label) {
  const matches = input.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')) || [];
  if (matches.length !== 1) throw new Error(`${label}: expected exactly one match, got ${matches.length}`);
  return input.replace(pattern, replacement);
}

let overOns = await readFile(OVER_ONS_FILE, 'utf8');
const acceptedMain = (await readFile(OVER_ONS_FRAGMENT, 'utf8')).trim();

overOns = replaceSingle(overOns, /<main>[\s\S]*?<\/main>/i, acceptedMain, 'over-ons main');
overOns = replaceSingle(overOns, /<title>[\s\S]*?<\/title>/i, '<title>Over ons — missie, ambitie en geloof | Bedrijfsgeheugen</title>', 'over-ons title');
overOns = replaceSingle(overOns, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="Waarom Bedrijfsgeheugen bestaat, wat onze missie en ambitie zijn en waar we in geloven: kennis van je bedrijf moet van het bedrijf zijn.">', 'over-ons meta description');

const semanticAnchors = [
  'Eerst kijken hoe het werk écht loopt. Dan pas techniek.',
  'Onze missie',
  'Onze ambitie',
  'Ons geloof',
  'praktiseren wat je preekt',
  'Gewone taal',
  'Geen big bang',
  'Van jou, niet van mij'
];
for (const anchor of semanticAnchors) {
  if (!overOns.includes(anchor)) throw new Error(`over-ons accepted semantic anchor missing after restore: ${anchor}`);
}
if (overOns.includes('Geen callcenter.</span><span>Je krijgt Arthur.')) {
  throw new Error('over-ons replacement hero survived accepted baseline restore');
}
if (!overOns.includes('class="bgkop"') || !overOns.includes('/assets/js/menu.js')) {
  throw new Error('over-ons technical/navigation shell was lost during accepted baseline restore');
}

await writeFile(OVER_ONS_FILE, overOns, 'utf8');

const moreButton = '      <button class="bg-mobile-row" type="button" data-bg-mobile-target="meer">Meer <span class="bg-mobile-arrow" aria-hidden="true">→</span></button>';
const moreView = `
    <div class="bg-mobile-view" data-bg-mobile-view="meer" hidden>
      <div class="bg-mobile-subtitle"><button class="bg-mobile-back" type="button" data-bg-mobile-back aria-label="Terug">← Terug</button><h2>Meer</h2></div>
      <a class="bg-mobile-link" href="/expertises">Alle expertises <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/over-ons">Over ons <span aria-hidden="true">→</span></a>
    </div>
`;

async function alignHomepageNavigation(path) {
  let homepage = await readFile(path, 'utf8');
  homepage = replaceSingle(
    homepage,
    /\s*<a class="bg-mobile-row" href="\/over-ons">Over ons <span class="bg-mobile-arrow" aria-hidden="true">→<\/span><\/a>\s*<a class="bg-mobile-row" href="\/expertises">Alle expertises <span class="bg-mobile-arrow" aria-hidden="true">→<\/span><\/a>/,
    `\n${moreButton}`,
    `${path} legacy direct mobile links`
  );
  homepage = replaceSingle(
    homepage,
    /\n  <\/div>\n<\/div>\n<script src="\/assets\/js\/v18-menu-state\.js\?v=1" defer><\/script>/,
    `\n${moreView}  </div>\n</div>\n<script src="/assets/js/v18-menu-state.js?v=1" defer></script>`,
    `${path} mobile navigation shell close`
  );
  if (!homepage.includes('data-bg-mobile-target="meer"') || !homepage.includes('data-bg-mobile-view="meer"')) {
    throw new Error(`${path}: Meer drilldown missing after accepted navigation alignment`);
  }
  await writeFile(path, homepage, 'utf8');
}

await alignHomepageNavigation('index.html');
await alignHomepageNavigation('prototype-v18-stable.html');

console.log('Accepted site baseline applied: /over-ons + navigation route catalog');
