import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function composeComponentPreview({ componentId, outputPath }) {
  const ownership = await readJson('config/component-ownership.json');
  if (!Object.hasOwn(ownership, componentId)) throw new Error(`Unknown component: ${componentId}`);

  const dir = join('components', componentId);
  const html = await readFile(join(dir, `${componentId}.html`), 'utf8');
  const shell = await readFile('preview/component-shell.html', 'utf8');

  let contract = { jsEntry: null };
  try { contract = await readJson(join(dir, 'contract.json')); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const cssTag = `<link rel="stylesheet" href="/components/${componentId}/${componentId}.css">`;
  const jsTag = contract.jsEntry
    ? `<script type="module" src="/components/${componentId}/${contract.jsEntry}"></script>`
    : '';

  const output = shell
    .replace('{{COMPONENT_CSS}}', cssTag)
    .replace('{{COMPONENT_HTML}}', html.trim())
    .replace('{{COMPONENT_JS}}', jsTag);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [componentId, outputPath] = process.argv.slice(2);
  if (!componentId || !outputPath) throw new Error('Usage: node tools/compose-component-preview.mjs <component-id> <output-path>');
  await composeComponentPreview({ componentId, outputPath });
}
