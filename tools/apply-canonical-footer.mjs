import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contract = JSON.parse(await readFile(join(repoRoot, 'site/footer-contract.json'), 'utf8'));
const canonicalFooter = (await readFile(join(repoRoot, contract.canonicalSource), 'utf8')).trim();
const exceptionFiles = new Set(contract.exceptions.map(x => x.file));

export function normalizeFooter(html) {
  const footer = (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0];
  return footer.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

export function applyCanonicalFooter(html, file) {
  const normalizedFile = file.split(sep).join('/');
  if (exceptionFiles.has(normalizedFile)) return html;
  const footers = html.match(/<footer\b[\s\S]*?<\/footer>/gi) || [];
  if (footers.length > 1) throw new Error(`multiple footers in ${normalizedFile}`);
  if (footers.length === 1) return html.replace(footers[0], canonicalFooter);
  if (!/<\/body>/i.test(html)) throw new Error(`missing </body> in ${normalizedFile}`);
  return html.replace(/<\/body>/i, `${canonicalFooter}\n</body>`);
}

async function governedFiles(root) {
  const files = (await readdir(root)).filter(name => name.endsWith('.html')).map(name => join(root, name));
  const blog = join(root, 'blog');
  try {
    const blogLanding = join(blog, 'index.html');
    try { if ((await stat(blogLanding)).isFile()) files.push(blogLanding); } catch {}
    for (const entry of await readdir(blog)) {
      const dir = join(blog, entry);
      try { if (!(await stat(dir)).isDirectory()) continue; } catch { continue; }
      const index = join(dir, 'index.html');
      try { if ((await stat(index)).isFile()) files.push(index); } catch {}
    }
  } catch {}
  return [...new Set(files)];
}

export async function applyCanonicalFootersToSite(root = repoRoot) {
  const changed = [];
  for (const path of await governedFiles(root)) {
    const file = relative(root, path).split(sep).join('/');
    const before = await readFile(path, 'utf8');
    const after = applyCanonicalFooter(before, file);
    if (after !== before) {
      await writeFile(path, after);
      changed.push(file);
    }
  }
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const changed = await applyCanonicalFootersToSite();
  console.log(`Canonical footer applied to ${changed.length} governed pages`);
}
