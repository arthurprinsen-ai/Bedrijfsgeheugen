import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules','.git','dist','.netlify']);
const LINK = '<link rel="stylesheet" href="/assets/i18n.css" data-bg-i18n-asset>';
const SCRIPT = '<script src="/assets/js/i18n.js" defer data-bg-i18n-asset></script>';
const MOBILE_LANGUAGE = '<div class="bg-mobile-language" data-bg-language-switcher="mobile" data-bg-no-translate><span class="bg-mobile-language-label" data-bg-language-label>Taal</span><div class="bg-mobile-language-options" role="group" aria-label="Taal kiezen"><button type="button" data-bg-language-option="nl">Nederlands</button><button type="button" data-bg-language-option="en">English</button></div><span class="bg-language-error" data-bg-language-error hidden>Wisselen mislukt. Probeer opnieuw.</span></div>';

function injectMobileLanguage(html) {
  if (/data-bg-language-switcher="mobile"/.test(html)) return html;
  const drawer = html.match(/<aside\b[^>]*class="[^"]*\bv18-mobile-drawer\b[^"]*"[^>]*>[\s\S]*?<\/aside>/i);
  if (!drawer || drawer.index === undefined) return html;
  let block = drawer[0];
  const login = block.search(/<a\b[^>]*href=(["'])\/inloggen\1/i);
  if (login >= 0) block = block.slice(0, login) + MOBILE_LANGUAGE + block.slice(login);
  else block = block.replace(/<\/aside>$/i, MOBILE_LANGUAGE + '</aside>');
  return html.slice(0, drawer.index) + block + html.slice(drawer.index + drawer[0].length);
}

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
  html = injectMobileLanguage(html);
  fs.writeFileSync(file,html);
}
walk(ROOT);
console.log('BG i18n assets injected site-wide');