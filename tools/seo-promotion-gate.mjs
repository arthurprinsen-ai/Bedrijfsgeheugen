import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(readFileSync('site/seo-baseline.json', 'utf8'));
if (!baseline.rules?.visibleV18BodyIsImmutable) {
  throw new Error('SEO promotion gate requires explicit immutable V18 baseline');
}

const build = spawnSync(process.execPath, ['tools/bouw-v18-production.mjs'], { encoding: 'utf8' });
process.stdout.write(build.stdout || '');
process.stderr.write(build.stderr || '');
if (build.status !== 0) throw new Error(`V18 production build failed with ${build.status}`);

const audit = spawnSync('python', ['.github/scripts/seocontrole.py'], { encoding: 'utf8' });
process.stdout.write(audit.stdout || '');
process.stderr.write(audit.stderr || '');

const report = readFileSync('seo-rapport.md', 'utf8');
const redirects = readFileSync('_redirects', 'utf8');
const prototypeProtected = /^\/prototype-v18-stable\s+\/\s+301!/m.test(redirects)
  && /^\/prototype-v18-stable\.html\s+\/\s+301!/m.test(redirects);

function section(name) {
  const re = new RegExp(`## ${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`);
  return (report.match(re) || ['', ''])[1];
}

const high = section('Hoog').split('\n').filter(line => line.startsWith('- `'));
const allowedImmutableHigh = new Set([
  '- `/` — de menubalk wijkt af van .github/canoniek/kop.html',
  '- `/` — de voettekst wijkt af van .github/canoniek/voet.html',
]);
const unexpectedHigh = high.filter(line => {
  if (allowedImmutableHigh.has(line)) return false;
  if (prototypeProtected && line.startsWith('- `/prototype-v18-stable` — ')) return false;
  return true;
});
if (unexpectedHigh.length) {
  throw new Error(`Unresolved high SEO findings:\n${unexpectedHigh.join('\n')}`);
}

const technicalMediumPatterns = [
  /titel is \d+ tekens, Google kapt rond 65/,
  /geen canonical/,
  /geen gestructureerde data/,
  /ankertekst .* zegt niets/,
  /linkt niet naar clusterpagina/,
  /linkt niet terug naar de pijler/,
];
const medium = section('Midden').split('\n').filter(line => line.startsWith('- `'));
const technicalMedium = medium.filter(line => technicalMediumPatterns.some(re => re.test(line)));
if (technicalMedium.length) {
  throw new Error(`Unresolved technical/structural SEO findings:\n${technicalMedium.join('\n')}`);
}

if (audit.status !== 0 && high.length === 0) {
  throw new Error(`SEO checker exited ${audit.status} without parseable high findings`);
}

console.log(`SEO promotion gate passed: ${high.length} accepted immutable/build-artifact high finding(s), ${medium.length} advisory medium finding(s).`);
