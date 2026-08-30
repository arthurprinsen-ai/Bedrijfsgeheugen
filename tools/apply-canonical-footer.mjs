import { readFile, writeFile, readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';

const contract = JSON.parse(await readFile('site/footer-contract.json', 'utf8'));
const canonicalFooter = await readFile(contract.canonicalSource, 'utf8');
const exceptionFiles = new Set(contract.exceptions.map(x => x.file));

export function normalizeFooter(html) {
  return String(html || '').replace(/\s+/g, ' ').trim();
}

export function isException(file) {
  return exceptionFiles.has(String(file).replaceAll('\\', '/')) || exceptionFiles.has(basename(file));
}

export function applyCanonicalFooter(html, file) {
  if (isException(file)) return html;
  const footers = [...String(html).matchAll(/<footer\b[\s\S]*?<\/footer>/gi)];
  if (footers.length > 1) throw new Error(`multiple footers found in ${file}`);
  if (footers.length === 1) return String(html).replace(footers[0][0], canonicalFooter);
  if (!/<\/body>/i.test(html)) throw new Error(`missing </body> in governed page ${file}`);
  return String(html).replace(/<\/body>/i, `${canonicalFooter}\n</body>`);
}

async function rootHtmlFiles() {
  return (await readdir('.', { withFileTypes: true }))
    .filter(e => e.isFile() && e.name.endsWith('.html'))
    .map(e => e.name);
}

async function blogIndexFiles() {
  const out = [];
  let dirs = [];
  try { dirs = await readdir('blog', { withFileTypes: true }); } catch { return out; }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const file = join('blog', d.name, 'index.html');
    try { await readFile(file, 'utf8'); out.push(file); } catch {}
  }
  return out;
}

export async function governedFiles() {
  const files = [...await rootHtmlFiles(), ...await blogIndexFiles()];
  return files.filter(file => !isException(relative('.', file)));
}

export async function applyCanonicalFootersToSite() {
  const files = await governedFiles();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const next = applyCanonicalFooter(html, file);
    if (next !== html) await writeFile(file, next, 'utf8');
  }
  return files;
}

if (process.argv[1] && process.argv[1].endsWith('apply-canonical-footer.mjs')) {
  const files = await applyCanonicalFootersToSite();
  console.log(`Canonical SEO footer applied to ${files.length} governed pages`);
}
