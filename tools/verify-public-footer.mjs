import { readFile } from 'node:fs/promises';
import { normalizeFooter } from './apply-canonical-footer.mjs';
import { extractFooterLinks } from './validate-footer-seo.mjs';

const base = String(process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) throw new Error('usage: node tools/verify-public-footer.mjs https://deployment.example');

const canonical = await readFile('.github/canoniek/voet.html', 'utf8');
const contract = JSON.parse(await readFile('site/footer-contract.json', 'utf8'));
const expected = normalizeFooter(canonical);
const routes = ['/', '/over-ons', '/bedrijfsgeheugen', '/blog/'];

function footerFrom(html) {
  const matches = [...html.matchAll(/<footer\b[\s\S]*?<\/footer>/gi)];
  if (matches.length !== 1) throw new Error(`expected exactly one footer, found ${matches.length}`);
  if (!/class=["'][^"']*\bbgvoet\b/i.test(matches[0][0])) throw new Error('canonical bgvoet footer missing');
  return matches[0][0];
}

for (const route of routes) {
  const response = await fetch(`${base}${route}`, { redirect: 'follow' });
  if (!response.ok) throw new Error(`public footer route failed route=${route} status=${response.status}`);
  const html = await response.text();
  if (normalizeFooter(footerFrom(html)) !== expected) throw new Error(`footer drift route=${route}`);
}

const links = extractFooterLinks(canonical).filter(x => x.href.startsWith('/'));
const required = new Set(contract.strategicDestinations.map(x => x.replace(/\/$/, '') || '/'));
for (const route of required) {
  if (!links.some(x => (x.href.replace(/\/$/, '') || '/') === route)) throw new Error(`strategic footer destination missing ${route}`);
}
for (const { href } of links) {
  const response = await fetch(`${base}${href}`, { redirect: 'follow' });
  if (response.status >= 400) throw new Error(`dead public footer link href=${href} status=${response.status}`);
}
console.log(`PUBLIC_FOOTER_GREEN base=${base} routes=${routes.length} links=${links.length}`);
