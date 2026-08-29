import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENTS = ['header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer'];

function replaceBounded(source, startMarker, endMarker, replacement, { includeEnd = false } = {}) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Start marker not found: ${startMarker}`);
  const endStart = source.indexOf(endMarker, start + startMarker.length);
  if (endStart < 0) throw new Error(`End marker not found after ${startMarker}: ${endMarker}`);
  const end = includeEnd ? endStart + endMarker.length : endStart;
  return source.slice(0, start) + replacement + source.slice(end);
}

function indent(text, spaces = 2) {
  const prefix = ' '.repeat(spaces);
  return text.trim().split('\n').map(line => prefix + line).join('\n');
}

export async function composeHomeMigration({ sourcePath = 'index.html', outputPath }) {
  if (!outputPath) throw new Error('outputPath is required');

  let source = await readFile(sourcePath, 'utf8');
  const html = {};
  const css = {};

  for (const id of COMPONENTS) {
    html[id] = await readFile(`components/${id}/${id}.html`, 'utf8');
    css[id] = await readFile(`components/${id}/${id}.css`, 'utf8');
  }

  const headerStart = '<div class="bgtop"><div class="bgtop-in">';
  source = replaceBounded(source, headerStart, '</nav>', html.header.trim(), { includeEnd: true });

  const videoSlot = '<div data-bg-slot="hero-video"></div>';
  if (!html['hero-demo'].includes(videoSlot)) throw new Error('hero-demo video slot missing');
  const heroDemo = html['hero-demo'].replace(videoSlot, html['hero-video'].trim());
  const hero = [
    '<div class="wrap hero" data-bg-composition="hero">',
    '  <div>',
    indent(html['hero-copy'], 4),
    indent(html['social-proof'], 4),
    '  </div>',
    indent(heroDemo, 2),
    '</div>'
  ].join('\n');
  source = replaceBounded(source, '<div class="wrap hero">', '\n\n<section style="padding-top:1rem">', hero);

  source = replaceBounded(source, '<div class="aanbod">', '\n  <div class="memo rechts"', html.pricing.trim());

  source = replaceBounded(source, '<footer class="bgvoet">', '</footer>', html.footer.trim(), { includeEnd: true });

  const styleBlocks = COMPONENTS.map(id =>
    `<style data-bg-component-styles="${id}">\n${css[id].trim()}\n</style>`
  ).join('\n');
  if (!source.includes('</head>')) throw new Error('Missing </head>');
  source = source.replace('</head>', `${styleBlocks}\n</head>`);

  const scriptIds = ['header','hero-video'];
  const scriptBlocks = [];
  for (const id of scriptIds) {
    const js = await readFile(`components/${id}/${id}.js`, 'utf8');
    scriptBlocks.push(`<script data-bg-component-script="${id}">\n${js.trim()}\n</script>`);
  }
  if (!source.includes('</body>')) throw new Error('Missing </body>');
  source = source.replace('</body>', `${scriptBlocks.join('\n')}\n</body>`);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, source, 'utf8');
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  const outputPath = process.argv[2] || 'dist/index.html';
  await composeHomeMigration({ sourcePath: 'index.html', outputPath });
  process.stdout.write(`${outputPath}\n`);
}
