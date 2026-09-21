import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules','.git','dist','.netlify']);
const LINK = '<link rel="stylesheet" href="/assets/i18n.css" data-bg-i18n-asset>';
const SCRIPT = '<script src="/assets/js/i18n.js" defer data-bg-i18n-asset></script>';

function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) patch(full);
  }
}
function patch(file) {
  let html = fs.readFileSync(file,'utf8');
  if (!/<html\b/i.test(html) || /data-bg-i18n-asset/.test(html)) return;
  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, LINK + '\n' + SCRIPT + '\n</head>');
  else return;
  fs.writeFileSync(file,html);
}
walk(ROOT);
console.log('BG i18n assets injected site-wide');