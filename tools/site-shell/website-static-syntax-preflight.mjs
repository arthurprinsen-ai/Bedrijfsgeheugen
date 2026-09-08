import vm from 'node:vm';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const NON_JS_TYPES = new Set([
  'application/ld+json',
  'application/json',
  'application/schema+json',
  'text/template',
  'text/x-template',
]);

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1]?.trim() || '';
}

function isJavaScriptScript(attrs) {
  if (/\bsrc\s*=/i.test(attrs)) return false;
  const type = attrValue(attrs, 'type').toLowerCase();
  if (!type) return true;
  if (NON_JS_TYPES.has(type)) return false;
  return type === 'text/javascript' || type === 'application/javascript';
}

export function validateHtmlInlineScripts({ html, filePath = '<html>' } = {}) {
  if (typeof html !== 'string') throw new TypeError('html must be a string');

  const errors = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let match;
  let index = 0;

  while ((match = scriptPattern.exec(html))) {
    index += 1;
    const attrs = match[1] || '';
    if (!isJavaScriptScript(attrs)) continue;
    try {
      new vm.Script(match[2] || '', { filename: `${filePath}#inline-script-${index}` });
    } catch (error) {
      errors.push(Object.freeze({
        filePath,
        scriptIndex: index,
        message: String(error?.message || error),
      }));
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

async function collectHtmlFiles(root, relativeDir = '') {
  const absoluteDir = join(root, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.netlify') continue;
    const rel = join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(root, rel));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') files.push(rel);
  }
  return files;
}

export async function validateWebsiteHtmlTree({ root = process.cwd() } = {}) {
  const files = await collectHtmlFiles(root);
  const errors = [];
  for (const filePath of files) {
    const html = await readFile(join(root, filePath), 'utf8');
    const result = validateHtmlInlineScripts({ html, filePath });
    errors.push(...result.errors);
  }
  return Object.freeze({ ok: errors.length === 0, filesChecked: files.length, errors: Object.freeze(errors) });
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  const result = await validateWebsiteHtmlTree();
  if (!result.ok) {
    for (const error of result.errors) console.error(`${error.filePath} [script ${error.scriptIndex}]: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`Static JavaScript syntax preflight OK (${result.filesChecked} HTML files).`);
  }
}
