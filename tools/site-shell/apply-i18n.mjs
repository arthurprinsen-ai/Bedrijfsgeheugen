import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules','.git','dist','.netlify']);
const I18N_ASSET_VERSION = 'cms-i18n-20260930-1';
const LINK = `<link rel="stylesheet" href="/assets/i18n.css?v=${I18N_ASSET_VERSION}" data-bg-i18n-asset>`;
const SCRIPT = `<script src="/assets/js/i18n.js?v=${I18N_ASSET_VERSION}" defer data-bg-i18n-asset></script>`;

function canonicalRoute(locale,route) {
  if (locale === 'nl') return route === '/' ? '/' : route;
  return '/en' + (route === '/' ? '/' : route);
}

function routeContext(file) {
  let rel = path.relative(ROOT,file).replace(/\\/g,'/');
  let locale = 'nl';
  if (rel.startsWith('en/')) {
    locale = 'en';
    rel = rel.slice(3);
  } else if (rel.startsWith('nl/')) {
    rel = rel.slice(3);
  }
  let route;
  if (rel === 'index.html') route = '/';
  else if (rel.endsWith('/index.html')) route = '/' + rel.slice(0,-'/index.html'.length);
  else route = '/' + rel.replace(/\.html$/,'');
  route = route.length > 1 ? route.replace(/\/$/,'') : '/';
  return { locale, route };
}

function mobileLanguageFor(file) {
  const {locale,route} = routeContext(file);
  const nl = canonicalRoute('nl',route);
  const en = canonicalRoute('en',route);
  return '<nav class="bg-mobile-language" data-bg-language-switcher="mobile" data-bg-no-translate aria-label="Language"><span class="bg-mobile-language-label" data-bg-language-label>Language</span><div class="bg-mobile-language-select-wrap"><a class="bg-mobile-language-link" href="' + nl + '" data-bg-language-option="nl" hreflang="nl" lang="nl" aria-current="' + (locale === 'nl' ? 'page' : 'false') + '">Nederlands</a><a class="bg-mobile-language-link" href="' + en + '" data-bg-language-option="en" hreflang="en" lang="en" aria-current="' + (locale === 'en' ? 'page' : 'false') + '">English</a></div></nav>';
}

function injectMobileLanguage(html,file) {
  const mobileLanguage = mobileLanguageFor(file);
  const existing = /<nav\b[^>]*data-bg-language-switcher=(["'])mobile\1[^>]*>[\s\S]*?<\/nav>/gi;
  let replacedExisting = false;
  html = html.replace(existing, () => {
    replacedExisting = true;
    return mobileLanguage;
  });
  if (replacedExisting) return html;

  const drawer = html.match(/<aside\b[^>]*class="[^"]*\bv18-mobile-drawer\b[^"]*"[^>]*>[\s\S]*?<\/aside>/i);
  if (drawer && drawer.index !== undefined) {
    let block = drawer[0];
    const login = block.search(/<a\b[^>]*href=(["'])\/inloggen\1/i);
    if (login >= 0) block = block.slice(0, login) + mobileLanguage + block.slice(login);
    else block = block.replace(/<\/aside>$/i, mobileLanguage + '</aside>');
    return html.slice(0, drawer.index) + block + html.slice(drawer.index + drawer[0].length);
  }

  if (/id=(["'])bgkopMob\1/i.test(html) || /class=(["'])[^"']*\bbgkop-mob\b[^"']*\1/i.test(html)) {
    const cta = /<a\b[^>]*class=(["'])[^"']*\bbgkop-mcta\b[^"']*\1/i;
    if (cta.test(html)) return html.replace(cta, mobileLanguage + '$&');
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
  const before = html;
  const cssPattern = /<link\b[^>]*href=(["'])[^"']*\/assets\/i18n\.css(?:\?[^"']*)?\1[^>]*>/i;
  const scriptPattern = /<script\b[^>]*src=(["'])[^"']*\/assets\/js\/i18n\.js(?:\?[^"']*)?\1[^>]*><\/script>/i;
  const hasI18nCss = cssPattern.test(html);
  const hasI18nScript = scriptPattern.test(html);
  if (hasI18nCss) html = html.replace(cssPattern, LINK);
  if (hasI18nScript) html = html.replace(scriptPattern, SCRIPT);
  if (!hasI18nCss || !hasI18nScript) {
    if (!/<\/head>/i.test(html)) return;
    const missing = [!hasI18nCss ? LINK : '', !hasI18nScript ? SCRIPT : ''].filter(Boolean).join('\n');
    html = html.replace(/<\/head>/i, missing + '\n</head>');
  }
  html = injectMobileLanguage(html,file);
  if (html !== before) fs.writeFileSync(file,html);
}
walk(ROOT);
console.log('BG i18n assets injected site-wide');