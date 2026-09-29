import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules','.git','dist','.netlify']);
const I18N_ASSET_VERSION = 'cms-i18n-20260929-2';
const LINK = `<link rel="stylesheet" href="/assets/i18n.css?v=${I18N_ASSET_VERSION}" data-bg-i18n-asset>`;
const SCRIPT = `<script src="/assets/js/i18n.js?v=${I18N_ASSET_VERSION}" defer data-bg-i18n-asset></script>`;
const MOBILE_LANGUAGE = '<nav class="bg-mobile-language" data-bg-language-switcher="mobile" data-bg-no-translate aria-label="Language"><span class="bg-mobile-language-label" data-bg-language-label>Language</span><div class="bg-mobile-language-select-wrap"><a class="bg-mobile-language-link" href="/" data-bg-language-option="nl" hreflang="nl">Nederlands</a><a class="bg-mobile-language-link" href="/en/" data-bg-language-option="en" hreflang="en">English</a></div></nav>';

function routeForFile(file) {
  let rel = path.relative(ROOT,file).replace(/\\\\/g,'/');
  rel = rel.replace(/^(?:nl|en)\//,'');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0,-'index.html'.length);
  return '/' + rel.replace(/\.html$/,'');
}

function localeHref(locale,route) {
  if (locale === 'nl') return route === '/' ? '/' : route;
  return '/en' + (route === '/' ? '/' : route);
}

function bindLanguageRoutes(html,file) {
  const route = routeForFile(file);
  return html.replace(/<a\b[^>]*data-bg-language-option=(["'])(nl|en)\1[^>]*>/gi,(tag,_quote,locale)=>{
    const href = localeHref(locale,route);
    if (/\bhref=(["'])[^"']*\1/i.test(tag)) return tag.replace(/\bhref=(["'])[^"']*\1/i,'href="' + href + '"');
    return tag.replace(/^<a\b/i,'<a href="' + href + '"');
  });
}
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

  if (/id=(["'])bgkopMob\1/i.test(html) || /class=(["'])[^"']*\bbgkop-mob\b[^"']*\1/i.test(html)) {
    const cta = /<a\b[^>]*class=(["'])[^"']*\bbgkop-mcta\b[^"']*\1/i;
    if (cta.test(html)) return html.replace(cta, MOBILE_LANGUAGE + '$&');
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
  html = injectMobileLanguage(html);
  html = bindLanguageRoutes(html,file);
  if (html !== before) fs.writeFileSync(file,html);
}
walk(ROOT);
console.log('BG i18n assets injected site-wide');