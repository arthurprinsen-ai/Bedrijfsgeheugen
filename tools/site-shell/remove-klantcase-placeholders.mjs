import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Removes the homepage review section while it only holds invented example quotes
// with five stars. A section is removed only when every review card in it is a
// reserved placeholder; one real review keeps the section untouched. Idempotent.
const SECTION = /<section class="reviews-section">[\s\S]*?<\/section>/gi;
const CARD = /<article class="review-card[\s\S]*?<\/article>/gi;
const PLACEHOLDER = /(GERESERVEERD VOOR KLANTCASE|RESERVED FOR CUSTOMER CASE|Voorbeeldplaatsing|Example placement)/i;

export function removeKlantcasePlaceholders(html) {
  return String(html || '').replace(SECTION, section => {
    const cards = section.match(CARD) || [];
    if (!cards.length) return section;
    return cards.every(card => PLACEHOLDER.test(card)) ? '' : section;
  });
}

export async function updateHomepages(root = '.') {
  const results = [];
  for (const relative of ['index.html', 'en/index.html']) {
    const file = root + '/' + relative;
    if (!existsSync(file)) { results.push({ file, skipped: true }); continue; }
    const html = await readFile(file, 'utf8');
    const next = removeKlantcasePlaceholders(html);
    if (next !== html) await writeFile(file, next, 'utf8');
    results.push({ file, changed: next !== html });
  }
  return results;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  console.log(JSON.stringify(await updateHomepages()));
}
