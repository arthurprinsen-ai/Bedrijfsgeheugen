import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SNAPSHOT = '.artifacts/pricing-source.html';
const PAGE = 'prijzen.html';

function extractSection(html, id) {
  const startToken = `<section id="${id}"`;
  const start = html.indexOf(startToken);
  if (start < 0) throw new Error(`pricing integrity: missing ${startToken}`);
  const tags = /<section\b[^>]*>|<\/section\s*>/gi;
  tags.lastIndex = start;
  let depth = 0, m;
  while ((m = tags.exec(html))) {
    if (/^<section\b/i.test(m[0])) depth += 1; else depth -= 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw new Error(`pricing integrity: unclosed #${id}`);
}

function assertCanonical(html) {
  const required = [
    '€ 2.950',
    '€ 1.495',
    '€ 2.495',
    'vanaf € 4.995',
    'Run &amp; Grow · SaaS + advies',
    'Wat betekent ‘actueel’?',
    'Niet elke databron kán realtime zijn'
  ];
  const missing = required.filter(token => !html.includes(token));
  if (missing.length) throw new Error(`pricing integrity: missing canonical tokens: ${missing.join(' | ')}`);
  if (/€\s?(?:99|299|749)\b/.test(html)) throw new Error('pricing integrity: legacy package price returned');
}

const mode = process.argv[2] || '';
if (mode === 'capture') {
  const source = await readFile(PAGE, 'utf8');
  assertCanonical(source);
  await mkdir('.artifacts', { recursive: true });
  await writeFile(SNAPSHOT, source, 'utf8');
  console.log('Captured canonical pricing source before build transforms');
} else if (mode === 'restore') {
  const [source, built] = await Promise.all([readFile(SNAPSHOT, 'utf8'), readFile(PAGE, 'utf8')]);
  const canonical = extractSection(source, 'pakketten');
  const current = extractSection(built, 'pakketten');
  const restored = built.replace(current, canonical);
  assertCanonical(restored);
  await writeFile(PAGE, restored, 'utf8');
  console.log('Restored and verified canonical pricing section after build transforms');
} else {
  throw new Error('usage: node tools/pricing-build-integrity.mjs capture|restore');
}
