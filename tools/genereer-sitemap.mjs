import { readFile, writeFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from './site-shell/contracts.mjs';
import { finalizeSiteContracts } from './site-shell/finalize-site-contracts.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const LOCALE_REVENUE_MAP_FILE = 'site/seo-locale-revenue-map.json';
const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);
const AI_MODEL_SEO_PAGES = Object.freeze([
  'openai-ai-modellen/index.html',
  'claude-ai-modellen/index.html',
  'gemini-ai-modellen/index.html',
  'mistral-ai-modellen/index.html',
  'amazon-ai-modellen/index.html',
  'chatgpt-vs-claude/index.html',
  'chatgpt-vs-gemini/index.html',
  'claude-vs-gemini/index.html'
]);

const xmlEscape = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function isExclude(pad) {
  return EXCLUDES.has(pad) || /^shell-gate-.*\.html$/i.test(pad);
}

function alternatePair(url, known) {
  const value=String(url);
  if(!value.startsWith(ORIGIN + '/')) return null;
  const path=value.slice(ORIGIN.length) || '/';
  const isEn=path==='/en' || path==='/en/' || path.startsWith('/en/');
  const nlPath=isEn ? (path==='/en'||path==='/en/' ? '/' : path.slice(3)) : path;
  const nlUrl=ORIGIN + (nlPath || '/');
  const enUrl=ORIGIN + '/en' + (nlPath==='/' ? '/' : nlPath);
  if(!known.has(nlUrl) || !known.has(enUrl)) return null;
  return {nlUrl,enUrl};
}

export function maakSitemap(urls, alternates = new Map()) {
  const schoon = [...new Set((urls || []).filter(url => String(url).startsWith(`${ORIGIN}/`)))].sort((a, b) => a.localeCompare(b, 'nl'));
  const known = new Set(schoon);
  const regels = schoon.map(url => {
    let alt = alternates.get(url) || [];
    if (!alt.length) {
      const pair = alternatePair(url, known);
      if (pair) alt = [
        { hreflang:'nl', href:pair.nlUrl },
        { hreflang:'en', href:pair.enUrl },
        { hreflang:'x-default', href:pair.nlUrl }
      ];
    }
    const links = alt.map(item => `<xhtml:link rel="alternate" hreflang="${xmlEscape(item.hreflang)}" href="${xmlEscape(item.href)}"/>`).join('');
    return `  <url><loc>${xmlEscape(url)}</loc>${links}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${regels.join('\n')}\n</urlset>\n`;
}

function noindex(html) {
  const tag = String(html).match(/<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/i)?.[0] || '';
  const content = tag.match(/\bcontent=(?:"([^"]*)"|'([^']*)')/i);
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(content?.[1] ?? content?.[2] ?? '');
}

function canonical(html) {
  const tag = String(html).match(/<link\b[^>]*rel=(?:"canonical"|'canonical')[^>]*>/i)?.[0] || '';
  const href = tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
  return href?.[1] ?? href?.[2] ?? '';
}

async function htmlBestanden() {
  const bestanden = [];
  for await (const p of glob('*.html')) if (!isExclude(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  for await (const p of glob('en/**/*.html')) bestanden.push(p);
  bestanden.push('blog/index.html', 'kennis/index.html', ...AI_MODEL_SEO_PAGES);
  return [...new Set(bestanden)];
}

function alternateLinks(html) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*rel=(?:"alternate"|'alternate')[^>]*>/gi)) {
    const tag=m[0];
    const href=tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
    const lang=tag.match(/\bhreflang=(?:"([^"]*)"|'([^']*)')/i);
    const valueHref=href?.[1]??href?.[2]??'';
    const valueLang=lang?.[1]??lang?.[2]??'';
    if(valueHref.startsWith(`${ORIGIN}/`) && valueLang) out.push({hreflang:valueLang,href:valueHref});
  }
  return out;
}

function htmlEscapeAttr(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function replaceTitle(html,value){
  if(!value) return html;
  const safe=String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return /<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i,`<title>${safe}</title>`)
    : html.replace(/<\/head>/i,`<title>${safe}</title>\n</head>`);
}
function upsertNamedMetaHtml(html,name,value){
  if(!value) return html;
  const escapedName=String(name).replace(/[.*+?^$(){}|[\]\\]/g,'\\function alternateLinks(html) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*rel=(?:"alternate"|'alternate')[^>]*>/gi)) {
    const tag=m[0];
    const href=tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
    const lang=tag.match(/\bhreflang=(?:"([^"]*)"|'([^']*)')/i);
    const valueHref=href?.[1]??href?.[2]??'';
    const valueLang=lang?.[1]??lang?.[2]??'';
    if(valueHref.startsWith(`${ORIGIN}/`) && valueLang) out.push({hreflang:valueLang,href:valueHref});
  }
  return out;
}
');
  const tag=`<meta name="${htmlEscapeAttr(name)}" content="${htmlEscapeAttr(value)}">`;
  const re=new RegExp(`<meta\\b(?=[^>]*\\bname=(?:"${escapedName}"|'${escapedName}'))[^>]*>`,'i');
  return re.test(html) ? html.replace(re,tag) : html.replace(/<\/head>/i,tag+'\n</head>');
}
function upsertPropertyMetaHtml(html,property,value){
  if(!value) return html;
  const escaped=String(property).replace(/[.*+?^$(){}|[\]\\]/g,'\\function alternateLinks(html) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*rel=(?:"alternate"|'alternate')[^>]*>/gi)) {
    const tag=m[0];
    const href=tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
    const lang=tag.match(/\bhreflang=(?:"([^"]*)"|'([^']*)')/i);
    const valueHref=href?.[1]??href?.[2]??'';
    const valueLang=lang?.[1]??lang?.[2]??'';
    if(valueHref.startsWith(`${ORIGIN}/`) && valueLang) out.push({hreflang:valueLang,href:valueHref});
  }
  return out;
}
');
  const tag=`<meta property="${htmlEscapeAttr(property)}" content="${htmlEscapeAttr(value)}">`;
  const re=new RegExp(`<meta\\b(?=[^>]*\\bproperty=(?:"${escaped}"|'${escaped}'))[^>]*>`,'i');
  return re.test(html) ? html.replace(re,tag) : html.replace(/<\/head>/i,tag+'\n</head>');
}
function setBodyDataAttr(html,name,value){
  if(!value) return html;
  const escapedName=String(name).replace(/[.*+?^$(){}|[\]\\]/g,'\\function alternateLinks(html) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*rel=(?:"alternate"|'alternate')[^>]*>/gi)) {
    const tag=m[0];
    const href=tag.match(/\bhref=(?:"([^"]*)"|'([^']*)')/i);
    const lang=tag.match(/\bhreflang=(?:"([^"]*)"|'([^']*)')/i);
    const valueHref=href?.[1]??href?.[2]??'';
    const valueLang=lang?.[1]??lang?.[2]??'';
    if(valueHref.startsWith(`${ORIGIN}/`) && valueLang) out.push({hreflang:valueLang,href:valueHref});
  }
  return out;
}
');
  const attrText=`${name}="${htmlEscapeAttr(value)}"`;
  return html.replace(/<body\b([^>]*)>/i,(full,attrs)=>{
    const re=new RegExp(`\\s${escapedName}=(?:"[^"]*"|'[^']*')`,'i');
    const next=re.test(attrs) ? attrs.replace(re,' '+attrText) : attrs+' '+attrText;
    return '<body'+next+'>';
  });
}
async function enforceFinalLocalizedRevenueMetadata(){
  let map;
  try{map=JSON.parse(await readFile(LOCALE_REVENUE_MAP_FILE,'utf8'));}catch(error){
    throw new Error('SEO_LOCALE_REVENUE_MAP_FINALIZER_INVALID: '+(error?.message||String(error)));
  }
  const byEn=new Map((map.pages||[]).map(row=>[row?.en?.route,row]).filter(([url])=>Boolean(url)));
  let changed=0,checked=0;
  for await(const pad of glob('en/**/*.html')){
    let html; try{html=await readFile(pad,'utf8');}catch{continue;}
    const url=canonical(html);
    const row=byEn.get(url);
    if(!row?.en) continue;
    checked++;
    const before=html;
    html=replaceTitle(html,row.en.title);
    html=upsertNamedMetaHtml(html,'description',row.en.description);
    html=upsertPropertyMetaHtml(html,'og:title',row.en.title);
    html=upsertPropertyMetaHtml(html,'og:description',row.en.description);
    html=upsertNamedMetaHtml(html,'twitter:title',row.en.title);
    html=upsertNamedMetaHtml(html,'twitter:description',row.en.description);
    html=upsertNamedMetaHtml(html,'bg-keyword-cluster',row.en.primary_keyword);
    html=upsertNamedMetaHtml(html,'bg-zoekwoord',row.en.primary_keyword);
    html=upsertNamedMetaHtml(html,'bg-intent-owner',row.en.route);
    html=setBodyDataAttr(html,'data-bg-keyword-cluster',row.en.primary_keyword);
    html=setBodyDataAttr(html,'data-bg-intent-owner',row.en.route);
    html=setBodyDataAttr(html,'data-bg-locale-seo','v1');
    if(html!==before){await writeFile(pad,html,'utf8');changed++;}
  }
  console.log('SEO_FINAL_LOCALE_METADATA',JSON.stringify({checked,changed}));
  return {checked,changed};
}

export async function genereerSitemap(bestand = 'sitemap.xml') {
  // Dit is de eerste stap ná alle late website-writers. Dwing hier eerst het
  // definitieve outputcontract af, zodat sitemap, UI- en SEO-gates exact de
  // HTML controleren die Netlify daarna publiceert.
  await finalizeSiteContracts();
  // Some final shell/page-policy transforms legitimately rewrite generic SEO
  // metadata. Re-assert the market-specific EN owner metadata after those
  // transforms, before sitemap/readback validation. This is the terminal SEO
  // metadata authority, not a validator exception.
  await enforceFinalLocalizedRevenueMetadata();

  const urls = [];
  const alternates = new Map();
  for (const pad of await htmlBestanden()) {
    let html;
    try { html = await readFile(pad, 'utf8'); } catch { continue; }
    if (!html.includes('<body') || noindex(html)) continue;
    const url = canonical(html);
    if (!url.startsWith(`${ORIGIN}/`)) continue;
    urls.push(url);
    const links=alternateLinks(html);
    if(links.length) alternates.set(url,links);
  }
  const xml = maakSitemap(urls,alternates);
  await writeFile(bestand, xml, 'utf8');
  console.log(`Sitemap gegenereerd uit ${new Set(urls).size} actuele canonicals; geen onbewezen lastmod-datums`);
  return xml;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await genereerSitemap();
