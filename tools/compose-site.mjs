import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadComponent(id) {
  const dir = join('components', id);
  const htmlPath = join(dir, `${id}.html`);
  const contractPath = join(dir, 'contract.json');
  const html = await readFile(htmlPath, 'utf8');
  let contract = { id, jsEntry: null };
  try { contract = await readJson(contractPath); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return { id, html, contract };
}

export async function composeSite({ pageManifest, outputPath }) {
  const manifest = await readJson(pageManifest);
  if (!Array.isArray(manifest.components)) throw new Error('Page manifest components must be an array');

  const components = [];
  for (const id of manifest.components) components.push(await loadComponent(id));

  const css = components
    .map(({ id }) => `<link rel="stylesheet" href="/components/${id}/${id}.css">`)
    .join('\n');
  const js = components
    .filter(({ contract }) => contract.jsEntry)
    .map(({ contract }) => `<script type="module" src="/${String(contract.jsEntry).replace(/^\/+/, '')}"></script>`)
    .join('\n');
  const body = components.map(({ html }) => html.trim()).join('\n');

  const output = `<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n${css}\n</head>\n<body>\n${body}\n${js}\n</body>\n</html>\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pageManifest, outputPath] = process.argv.slice(2);
  if (!pageManifest || !outputPath) throw new Error('Usage: node tools/compose-site.mjs <page-manifest> <output-path>');
  await composeSite({ pageManifest, outputPath });
}
