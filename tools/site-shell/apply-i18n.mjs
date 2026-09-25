import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules','.git','dist','.netlify']);
const LINK = '<link rel="stylesheet" href="/assets/i18n.css" data-bg-i18n-asset>';
const SCRIPT = '<script src="/assets/js/i18n.js" defer data-bg-i18n-asset></script>';
const MOBILE_LANGUAGE = '<div class="bg-mobile-language" data-bg-language-switcher="mobile" data-bg-no-translate><span class="bg-mobile-language-label" data-bg-language-label>Language</span><div class="bg-mobile-language-select-wrap"><select class="bg-mobile-language-select" data-bg-language-select aria-label="Language"><option value="nl">Dutch</option><option value="en">English</option></select><span class="bg-mobile-language-chevron" aria-hidden="true">⌄</span></div><span class="bg-language-error" data-bg-language-error hidden>Switching language failed. Try again.</span></div>';

function injectMobileLanguage(html) {
  if (/data-bg-language-switcher="mobile"/.test(html)) return html;

  const drawer = html.match(/<aside\b[^>]*class="[^"]*\bv18-mobile-drawer\b[^"]*"[^>]*>[\s\S]*?<\/aside>/i);
  if (drawer && drawer.index !== undefined) {
    let block = drawer[0];
    const login = block.search(/<a\b[^>]*href=(["'])\/inloggen\1/i);
    if (login >= 0) block = block.slice(0, login) + MOBILE_LANGUAGE + block.slice(login);
    else block = block.replace(/<\/aside>$/i, MOBILE_LANGUAGE + '</aside>');
    return html.slice(0, drawer.index) + block + html.slice(drawer.index + drawer[0].length);
  }

  // Pricing and a small set of public pages use the compact bgkop mobile drawer.
  // Insert before its CTA so the visible language control participates in the same drawer.
  const compactHost = /id=(["'])bgkopMob\1/i.test(html) || /class=(["'])[^"']*\bbgkop-mob\b[^"']*\1/i.test(html);
  if (compactHost) {
    const cta = /<a\b[^>]*class=(["'])[^"']*\bbgkop-mcta\b[^"']*\1/i;
    if (cta.test(html)) return html.replace(cta, match => MOBILE_LANGUAGE + match);
  }

  return html;
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
  if (!/<html\b/i.test(html)) return;
  if (!/data-bg-i18n-asset/.test(html)) {
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, LINK + '\n' + SCRIPT + '\n</head>');
    else return;
  }
  html = injectMobileLanguage(html);
  fs.writeFileSync(file,html);
}
walk(ROOT);
console.log('BG i18n assets injected site-wide');
