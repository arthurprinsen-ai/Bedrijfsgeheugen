import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SNAPSHOT = '.artifacts/pricing-source.html';
const PAGE = 'prijzen.html';

function extractSection(html, id) {
  const escapedId = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRe = new RegExp("<section\\b[^>]*\\bid=[\"']" + escapedId + "[\"'][^>]*>", "i");
  const match = startRe.exec(String(html));
  const start = match?.index ?? -1;
  if (start < 0) throw new Error('pricing integrity: missing section#' + id);
  const tags = /<section\b[^>]*>|<\/section\s*>/gi;
  tags.lastIndex = start;
  let depth = 0, m;
  while ((m = tags.exec(html))) {
    if (/^<section\b/i.test(m[0])) depth += 1; else depth -= 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw new Error('pricing integrity: unclosed #' + id);
}

function extractScriptById(html, id) {
  const re = new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
  const match = String(html).match(re);
  if (!match) throw new Error(`pricing integrity: missing script #${id}`);
  return match[0];
}

function ensurePricingRuntime(html, source) {
  const inlineId = 'bg-pricing-neno-v1-js';
  const inline = extractScriptById(source, inlineId);
  const inlineRe = new RegExp(`<script\\b[^>]*\\bid=["']${inlineId}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
  let next = String(html);
  if (inlineRe.test(next)) next = next.replace(inlineRe, inline);
  else next = next.replace(new RegExp('</body>', 'i'), inline + '\n</body>');

  const rescueSrc = '/assets/js/pricing-interactions-rescue-v1.js?v=3de3592ac866';
  const rescueTag = `<script src="${rescueSrc}" defer></script>`;
  const rescueRe = new RegExp(`<script\\b[^>]*src=["']\\/assets\\/js\\/pricing-interactions-rescue-v1\\.js(?:\\?[^"']*)?["'][^>]*><\\/script>`, 'i');
  if (rescueRe.test(next)) next = next.replace(rescueRe, rescueTag);
  else next = next.replace(new RegExp('</body>', 'i'), rescueTag + '\n</body>');
  return next;
}

function assertCanonical(html) {
  const required = [
    '€ 99',
    '€ 299',
    '€ 749',
    'Powerhouse SaaS',
    'Directie & AI Workshop',
    'Bedrijfsgeheugen Scan',
    'Build Sprint',
    'Transformation / Fractional Lead',
    'Combineer zonder dubbel te betalen',
    'Wat groeit mee met je abonnement?',
    'data-tab="saas"',
    'data-tab="consulting"',
    'data-panel="saas"',
    'data-panel="consulting"'
  ];
  const missing = required.filter(token => !html.includes(token));
  if (missing.length) throw new Error(`pricing integrity: missing canonical tokens: ${missing.join(' | ')}`);
  if (/class=["'][^"']*\bjr\b/i.test(html)) throw new Error('pricing integrity: legacy hidden annual pricing residue returned');
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
  const canonicalIntro = extractSection(source, 'prijzen-pakketten');
  const currentIntro = extractSection(built, 'prijzen-pakketten');
  const canonicalPackages = extractSection(source, 'pakketten');
  const currentPackages = extractSection(built, 'pakketten');
  let restoredSections = built.replace(currentIntro, canonicalIntro);
  restoredSections = restoredSections.replace(currentPackages, canonicalPackages);
  const restored = ensurePricingRuntime(restoredSections, source);
  assertCanonical(restored);
  extractScriptById(restored, 'bg-pricing-neno-v1-js');
  if (!restored.includes('/assets/js/pricing-interactions-rescue-v1.js?v=3de3592ac866')) {
    throw new Error('pricing integrity: rescue runtime missing after restore');
  }
  await writeFile(PAGE, restored, 'utf8');
  console.log('Restored and verified canonical pricing section after build transforms');
} else {
  throw new Error('usage: node tools/pricing-build-integrity.mjs capture|restore');
}
