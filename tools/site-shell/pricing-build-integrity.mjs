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

  const rescueSrc = '/assets/js/pricing-interactions-rescue-v1.js?v=20260924-0750';
  const rescueTag = `<script src="${rescueSrc}" defer></script>`;
  const rescueRe = new RegExp(`<script\\b[^>]*src=["']\\/assets\\/js\\/pricing-interactions-rescue-v1\\.js(?:\\?[^"']*)?["'][^>]*><\\/script>`, 'i');
  if (rescueRe.test(next)) next = next.replace(rescueRe, rescueTag);
  else next = next.replace(new RegExp('</body>', 'i'), rescueTag + '\n</body>');
  return next;
}

function assertCanonical(html) {
  const required = [
    '€ 2.950',
    '€ 1.495',
    '€ 2.495',
    'vanaf € 4.995',
    'Run &amp; Grow · SaaS + advies',
    'Wat betekent ‘actueel’?',
    'Niet elke databron kán realtime zijn',
    'Je bedrijfsfase is niet je abonnement.',
    'Primaire bedrijfsfase',
    'Wat speelt daarnaast?',
    'Belangrijkste doel nu',
    'Dit is wat er daadwerkelijk in het portaal zit.',
    'Trusted Advisor assurance',
    'Resource & Sustainability Intelligence'
  ];
  const missing = required.filter(token => !html.includes(token));
  if (missing.length) throw new Error(`pricing integrity: missing canonical tokens: ${missing.join(' | ')}`);
  if (/€\s?(?:99|299|749)\b/.test(html)) throw new Error('pricing integrity: legacy package price returned');
  if (/class=["'][^"']*\bjr\b/i.test(html)) throw new Error('pricing integrity: legacy hidden annual pricing residue returned');
  const interactionRequired = [
    'data-bg-stage="grow"',
    'data-bg-stage="loss"',
    'data-bg-stage-panel="grow"',
    'data-bg-stage-panel="loss"',
    'data-bg-price-tab="start"',
    'data-bg-price-tab="run"'
  ];
  const missingInteractions = interactionRequired.filter(token => !html.includes(token));
  if (missingInteractions.length) throw new Error(`pricing integrity: missing interaction controls: ${missingInteractions.join(' | ')}`);
  const billingRequired = [
    'data-bg-billing="monthly"',
    'data-bg-billing="yearly"',
    '2 maanden voordeel',
    'data-yearly="€ 14.950"',
    'data-yearly="€ 24.950"',
    'data-yearly="vanaf € 49.950"'
  ];
  const missingBilling = billingRequired.filter(token => !html.includes(token));
  if (missingBilling.length) throw new Error(`pricing integrity: missing billing controls: ${missingBilling.join(' | ')}`);
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
  if (!restored.includes('/assets/js/pricing-interactions-rescue-v1.js?v=20260924-0750')) {
    throw new Error('pricing integrity: rescue runtime missing after restore');
  }
  await writeFile(PAGE, restored, 'utf8');
  console.log('Restored and verified canonical pricing section after build transforms');
} else {
  throw new Error('usage: node tools/pricing-build-integrity.mjs capture|restore');
}
