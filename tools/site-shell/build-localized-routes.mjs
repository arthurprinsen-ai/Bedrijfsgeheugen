import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize } from 'parse5';

const ROOT = process.cwd();
const MODEL = 'claude-haiku-4-5-20251001';
const SITE = 'https://www.bedrijfsgeheugen.nl';
const LOCALES = ['nl','en'];
const EXCLUDED_TOP = new Set(['.git','.github','node_modules','assets','components','email','intern','preview','site','tools','tests','docs','brain','platform','config','.netlify','dist','nl','en']);
const INCLUDED_DIRS = new Set(['blog','kennis']);
const SKIP_TAGS = new Set(['script','style','code','pre','noscript','svg','textarea']);
const ATTRS = new Set(['placeholder','title','aria-label','alt']);
const TRANSLATION_CACHE_FILE = path.join(ROOT,'config','bg-static-i18n-en.json');
const TRANSLATION_CACHE_PATCH_DIR = path.join(ROOT,'config','bg-static-i18n-en.d');
const SITEMAP_FILE = path.join(ROOT,'sitemap.xml');
const SEO_LOCALE_REVENUE_MAP_FILE = path.join(ROOT,'site','seo-locale-revenue-map.json');
const ESSENTIAL_ROUTES = new Set([
  '/', '/oplossingen', '/platform', '/prijzen', '/cases', '/kennis', '/over-ons',
  '/zelfscan', '/frisse-blik', '/inloggen', '/aanmelden', '/contact', '/privacy'
]);

function normalizedRoute(route) {
  if (!route) return '/';
  let value = String(route).replace(/\/index\.html$/,'/').replace(/\.html$/,'');
  if (!value.startsWith('/')) value = '/' + value;
  return value.length > 1 ? value.replace(/\/$/,'') : '/';
}

function publicRoutesFromSitemap() {
  const routes = new Set(ESSENTIAL_ROUTES);
  try {
    const xml = fs.readFileSync(SITEMAP_FILE,'utf8');
    for (const match of xml.matchAll(/<loc>https:\/\/www\.bedrijfsgeheugen\.nl([^<]*)<\/loc>/g)) {
      const route=normalizedRoute(match[1] || '/');
      if(route==='/en'||route.startsWith('/en/')) continue;
      routes.add(route);
    }
  } catch {}
  // SEO intent owners are authoritative public routes even when the checked-in
  // sitemap is older than the current source tree. This prevents a new money
  // page from missing its /en peer for one deployment cycle.
  try {
    const map=JSON.parse(fs.readFileSync(SEO_LOCALE_REVENUE_MAP_FILE,'utf8'));
    for(const entry of map?.pages||[]){
      const source=String(entry?.source_route||'');
      const absolute=resolveSameOriginAbsolute(source);
      if(absolute) routes.add(normalizedRoute(absolute.path));
    }
  } catch {}
  return routes;
}

function loadSeoLocaleRevenueMap() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SEO_LOCALE_REVENUE_MAP_FILE,'utf8'));
    const bySourceRoute = new Map();
    for (const entry of parsed?.pages || []) {
      const source = normalizedRoute(new URL(entry.source_route).pathname);
      bySourceRoute.set(source,entry);
    }
    return { raw: parsed, bySourceRoute };
  } catch (error) {
    throw new Error('SEO_LOCALE_REVENUE_MAP_INVALID: ' + (error?.message || String(error)));
  }
}

const SEO_LOCALE_REVENUE = loadSeoLocaleRevenueMap();

let seoLocaleRevenueMapCache = null;
function seoLocaleRevenueMap() {
  if (seoLocaleRevenueMapCache) return seoLocaleRevenueMapCache;
  try {
    const raw = JSON.parse(fs.readFileSync(SEO_LOCALE_REVENUE_MAP_FILE,'utf8'));
    const bySource = new Map();
    for (const entry of raw?.pages || []) {
      const source = String(entry?.source_route || '');
      const absolute=resolveSameOriginAbsolute(source);
      if (absolute) bySource.set(normalizedRoute(absolute.path), entry);
    }
    seoLocaleRevenueMapCache = { raw, bySource };
  } catch (error) {
    throw new Error('SEO_LOCALE_REVENUE_MAP_INVALID: ' + (error?.message || String(error)));
  }
  return seoLocaleRevenueMapCache;
}

function walk(dir, rel='') {
  const out = [];
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (EXCLUDED_TOP.has(entry.name) && rel === '') continue;
    const relPath = rel ? rel + '/' + entry.name : entry.name;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) {
      if (rel === '' && !INCLUDED_DIRS.has(entry.name)) continue;
      out.push(...walk(full,relPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(relPath.replace(/\\/g,'/'));
    }
  }
  return out;
}

function routeFor(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return '/' + file.slice(0,-'index.html'.length);
  return '/' + file.replace(/\.html$/,'');
}

function outputPath(locale,file) {
  return path.join(ROOT,locale,file);
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
}

function attr(node,name) {
  return node.attrs?.find(a=>a.name===name)?.value ?? null;
}

function setAttr(node,name,value) {
  node.attrs ||= [];
  const found = node.attrs.find(a=>a.name===name);
  if (found) found.value = value;
  else node.attrs.push({name,value});
}

function hasNoTranslate(node) {
  let cur = node;
  while (cur) {
    if (cur.attrs) {
      const names = new Map(cur.attrs.map(a=>[a.name,a.value]));
      if (names.has('data-bg-no-translate') || names.get('translate') === 'no') return true;
      const cls = names.get('class') || '';
      if (/(^|\s)notranslate(\s|$)/.test(cls)) return true;
    }
    cur = cur.parentNode;
  }
  return false;
}

function meaningful(value) {
  const s = String(value || '').replace(/\s+/g,' ').trim();
  if (s.length < 2 || s.length > 4000) return false;
  if (/^[\d\s€$£¥%+\-–—.,:/()]+$/.test(s)) return false;
  if (/^(https?:\/\/|www\.)/i.test(s)) return false;
  return /[A-Za-zÀ-ÿ]/.test(s);
}

function normalized(value) {
  return String(value || '').replace(/\s+/g,' ').trim();
}

function collectTranslatables(doc) {
  const refs = [];
  const walkNode = node => {
    if (node.nodeName === '#text') {
      const parent = node.parentNode;
      if (!parent?.tagName || SKIP_TAGS.has(parent.tagName) || hasNoTranslate(parent)) return;
      if (meaningful(node.value)) refs.push({kind:'text',node,source:normalized(node.value),original:node.value});
      return;
    }
    if (node.tagName) {
      if (SKIP_TAGS.has(node.tagName) || hasNoTranslate(node)) return;
      for (const a of node.attrs || []) {
        const isInputValue = a.name === 'value' && node.tagName === 'input' && ['submit','button','reset'].includes(String(attr(node,'type')||'').toLowerCase());
        const isMetaContent = a.name === 'content' && node.tagName === 'meta' && (
          ['description'].includes(String(attr(node,'name')||'').toLowerCase()) ||
          ['og:title','og:description'].includes(String(attr(node,'property')||'').toLowerCase())
        );
        if ((ATTRS.has(a.name) || isInputValue || isMetaContent) && meaningful(a.value)) {
          refs.push({kind:'attr',node,attr:a.name,source:normalized(a.value),original:a.value});
        }
      }
    }
    for (const child of node.childNodes || []) walkNode(child);
  };
  walkNode(doc);
  return refs;
}

function applyTranslations(refs,map,{allowMissing=false}={}) {
  const missing = [];
  for (const ref of refs) {
    const value = map.get(ref.source);
    if (typeof value !== 'string' || !value.trim()) {
      if (allowMissing) {
        missing.push(ref.source);
        continue;
      }
      throw new Error('Missing static English translation for: ' + ref.source.slice(0,120));
    }
    if (ref.kind === 'text') {
      const leading = ref.original.match(/^\s*/)?.[0] || '';
      const trailing = ref.original.match(/\s*$/)?.[0] || '';
      ref.node.value = leading + value + trailing;
    } else {
      const a = ref.node.attrs.find(x=>x.name===ref.attr);
      if (a) a.value = value;
    }
  }
  return [...new Set(missing)];
}

function findFirst(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) {
    const hit = findFirst(child,predicate);
    if (hit) return hit;
  }
  return null;
}

function removeChildrenBy(node,predicate) {
  if (!node?.childNodes) return;
  node.childNodes = node.childNodes.filter(child=>!predicate(child));
}

function canonicalRoute(locale,route) {
  if (locale === 'nl') return route === '/' ? '/' : route;
  return '/en' + (route === '/' ? '/' : route);
}

function routeAliases(files) {
  const map = new Map();
  for (const file of files) {
    const route = routeFor(file);
    map.set(route,file);
    if (route !== '/') map.set(route + '.html',file);
    if (route.endsWith('/')) map.set(route.slice(0,-1),file);
  }
  return map;
}

function resolveInternal(value,sourceFile) {
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return null;
  const match = String(value).match(/^([^?#]*)([?#].*)?$/);
  const rawPath = match?.[1] || '';
  const suffix = match?.[2] || '';
  if (!rawPath) return null;
  let resolved;
  if (rawPath.startsWith('/')) resolved = path.posix.normalize(rawPath);
  else {
    const baseDir = '/' + path.posix.dirname(sourceFile);
    resolved = path.posix.normalize(path.posix.join(baseDir,rawPath));
  }
  if (!resolved.startsWith('/')) resolved = '/' + resolved;
  return {path:resolved,suffix};
}

function resolveSameOriginAbsolute(value) {
  try {
    const url = new URL(String(value));
    if (url.origin !== SITE) return null;
    return { path: normalizedRoute(url.pathname), suffix: (url.search || '') + (url.hash || '') };
  } catch {
    return null;
  }
}

function rewriteLinks(doc,sourceFile,locale,aliases) {
  const visit = node => {
    if (node.tagName) {
      for (const a of node.attrs || []) {
        if (!['href','src','action'].includes(a.name)) continue;
        const sameOrigin = resolveSameOriginAbsolute(a.value);
        const resolved = sameOrigin || resolveInternal(a.value,sourceFile);
        if (!resolved) continue;
        const targetFile = aliases.get(resolved.path) || aliases.get(resolved.path + '.html') || aliases.get(resolved.path + '/');
        if (targetFile) {
          const targetRoute = routeFor(targetFile);
          a.value = canonicalRoute(locale,targetRoute) + resolved.suffix;
        } else if (sameOrigin && publicRoutes.has(normalizedRoute(resolved.path))) {
          a.value = canonicalRoute(locale,normalizedRoute(resolved.path)) + resolved.suffix;
        } else if (!sameOrigin && !a.value.startsWith('/')) {
          a.value = resolved.path + resolved.suffix;
        }
      }
    }
    for (const child of node.childNodes || []) visit(child);
  };
  visit(doc);
}

function rewriteLanguageSwitchers(doc,route,activeLocale) {
  const visit = node => {
    if (node.tagName === 'a') {
      const target = attr(node,'data-bg-language-option');
      if (LOCALES.includes(target)) {
        setAttr(node,'href',canonicalRoute(target,route));
        setAttr(node,'hreflang',target);
        setAttr(node,'lang',target);
        setAttr(node,'aria-current',target === activeLocale ? 'page' : 'false');
      }
    }
    for (const child of node.childNodes || []) visit(child);
  };
  visit(doc);
}

function textNode(value,parent) {
  return {nodeName:'#text',value:String(value),parentNode:parent};
}

function ensureMetaNode(head, predicate, attrs) {
  let node = findFirst(head,n=>n.tagName==='meta' && predicate(n));
  if (!node) {
    node={nodeName:'meta',tagName:'meta',namespaceURI:'http://www.w3.org/1999/xhtml',attrs:[],childNodes:[],parentNode:head};
    head.childNodes.push(node);
  }
  for (const [name,value] of Object.entries(attrs)) setAttr(node,name,value);
  return node;
}

function applyLocaleSeoMetadata(doc,locale,route,localizedUrl) {
  const head=findFirst(doc,n=>n.tagName==='head');
  const body=findFirst(doc,n=>n.tagName==='body');
  if(!head) return;
  const map=seoLocaleRevenueMap();
  const entry=map.bySource.get(normalizedRoute(route));
  const localeSeo=entry?.[locale] || null;

  // Supporting pages inherit the localized commercial intent owner. This keeps
  // EN measurement and internal-link attribution on an English keyword cluster
  // instead of leaking the Dutch cluster into /en/* routes.
  const existingOwner=body ? String(attr(body,'data-bg-intent-owner')||'').trim() : '';
  const existingOwnerAbsolute=resolveSameOriginAbsolute(existingOwner);
  const ownerPath=existingOwnerAbsolute ? normalizedRoute(existingOwnerAbsolute.path) : '';
  const ownerEntry=ownerPath ? map.bySource.get(ownerPath) : null;
  const ownerLocaleSeo=ownerEntry?.[locale] || null;

  const keyword=String(localeSeo?.primary_keyword || ownerLocaleSeo?.primary_keyword || '').trim();
  const title=String(localeSeo?.title||'').trim();
  const description=String(localeSeo?.description||'').trim();

  if(title){
    let titleNode=findFirst(head,n=>n.tagName==='title');
    if(!titleNode){
      titleNode={nodeName:'title',tagName:'title',namespaceURI:'http://www.w3.org/1999/xhtml',attrs:[],childNodes:[],parentNode:head};
      head.childNodes.push(titleNode);
    }
    titleNode.childNodes=[textNode(title,titleNode)];
  }
  if(description) {
    ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='description',{name:'description',content:description});
    ensureMetaNode(head,n=>String(attr(n,'property')||'').toLowerCase()==='og:description',{property:'og:description',content:description});
    ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='twitter:description',{name:'twitter:description',content:description});
  }
  if(title) {
    ensureMetaNode(head,n=>String(attr(n,'property')||'').toLowerCase()==='og:title',{property:'og:title',content:title});
    ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='twitter:title',{name:'twitter:title',content:title});
  }
  if(keyword) {
    ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='bg-keyword-cluster',{name:'bg-keyword-cluster',content:keyword});
    ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='bg-zoekwoord',{name:'bg-zoekwoord',content:keyword});
    if(body) setAttr(body,'data-bg-keyword-cluster',keyword);
  }
  const localizedOwner = entry
    ? localizedUrl
    : ownerEntry
      ? (locale==='en' ? ownerEntry.en.route : ownerEntry.nl.route)
      : (locale==='en' && existingOwnerAbsolute ? SITE + canonicalRoute('en',ownerPath) : existingOwner || localizedUrl);
  ensureMetaNode(head,n=>String(attr(n,'name')||'').toLowerCase()==='bg-intent-owner',{name:'bg-intent-owner',content:localizedOwner});
  if(body) {
    setAttr(body,'data-bg-intent-owner',localizedOwner);
    if(keyword) setAttr(body,'data-bg-keyword-cluster',keyword);
    setAttr(body,'data-bg-locale-seo','v1');
  }
}

function setHeadText(head,tagName,value) {
  const node=findFirst(head,n=>n.tagName===tagName);
  if(!node) return;
  node.childNodes=[{nodeName:'#text',value:String(value),parentNode:node}];
}
function upsertMeta(head,name,value) {
  let node=findFirst(head,n=>n.tagName==='meta' && String(attr(n,'name')||'').toLowerCase()===String(name).toLowerCase());
  if(!node){
    node={nodeName:'meta',tagName:'meta',namespaceURI:'http://www.w3.org/1999/xhtml',attrs:[],childNodes:[],parentNode:head};
    head.childNodes.push(node);
  }
  setAttr(node,'name',name); setAttr(node,'content',String(value||''));
}
function applyLocaleRevenueMetadata(doc,locale,route) {
  const entry=SEO_LOCALE_REVENUE.bySourceRoute.get(normalizedRoute(route));
  if(!entry) return;
  const data=locale==='en'?entry.en:entry.nl;
  const head=findFirst(doc,n=>n.tagName==='head');
  const body=findFirst(doc,n=>n.tagName==='body');
  if(!head||!body) return;
  if(locale==='en'){
    if(data?.title) setHeadText(head,'title',data.title);
    if(data?.description) upsertMeta(head,'description',data.description);
    if(data?.h1){
      const h1=findFirst(body,n=>n.tagName==='h1');
      if(h1) h1.childNodes=[{nodeName:'#text',value:String(data.h1),parentNode:h1}];
    }
  }
  upsertMeta(head,'bg-keyword-cluster',data?.primary_keyword||'');
  upsertMeta(head,'bg-zoekwoord',data?.primary_keyword||'');
  upsertMeta(head,'bg-locale-market',locale);
  setAttr(body,'data-bg-keyword-cluster',data?.primary_keyword||'');
  setAttr(body,'data-bg-locale-market',locale);
  if(entry?.source_route){
    const owner=locale==='en'?entry.en?.route:entry.nl?.route;
    if(owner) {
      upsertMeta(head,'bg-intent-owner',owner);
      setAttr(body,'data-bg-intent-owner',owner);
    }
  }
}

function localizeStructuredData(doc,locale,route,translations) {
  const localizedUrl=SITE+canonicalRoute(locale,route);
  const revenue=SEO_LOCALE_REVENUE.bySourceRoute.get(normalizedRoute(route));
  const localizeString=(value,key='')=>{
    const text=String(value||'');
    if(key==='inLanguage') return locale==='en'?'en':'nl-NL';
    const same=resolveSameOriginAbsolute(text);
    if(same && publicRoutes.has(normalizedRoute(same.path))) return SITE+canonicalRoute(locale,normalizedRoute(same.path))+same.suffix;
    if(locale==='en' && translations){
      const hit=translations.get(normalized(text));
      if(typeof hit==='string'&&hit.trim()) return hit;
    }
    return value;
  };
  const walk=(value,key='')=>{
    if(Array.isArray(value)) return value.map(v=>walk(v,key));
    if(value&&typeof value==='object'){
      const next={};
      for(const [k,v] of Object.entries(value)) next[k]=walk(v,k);
      if(locale==='en' && next.url===localizedUrl && revenue?.en){
        if(revenue.en.title && typeof next.name==='string') next.name=revenue.en.title.replace(/\s*\|\s*Bedrijfsgeheugen\s*$/,'');
        if(revenue.en.description && typeof next.description==='string') next.description=revenue.en.description;
        if('inLanguage' in next) next.inLanguage='en';
      }
      return next;
    }
    if(typeof value==='string') return localizeString(value,key);
    return value;
  };
  const visit=node=>{
    if(node.tagName==='script' && String(attr(node,'type')||'').toLowerCase()==='application/ld+json'){
      const text=(node.childNodes||[]).filter(x=>x.nodeName==='#text').map(x=>x.value||'').join('').trim();
      if(text){
        try{
          const parsed=JSON.parse(text);
          const localized=walk(parsed);
          node.childNodes=[{nodeName:'#text',value:JSON.stringify(localized).replace(/</g,'\\u003c'),parentNode:node}];
        }catch{}
      }
    }
    for(const child of node.childNodes||[]) visit(child);
  };
  visit(doc);
}

function setLocaleMetadata(doc,locale,route,translated=true) {
  const html = findFirst(doc,n=>n.tagName==='html');
  const head = findFirst(doc,n=>n.tagName==='head');
  if (!html || !head) throw new Error('HTML/head missing for route ' + route);
  setAttr(html,'lang',locale);
  setAttr(html,'data-bg-static-locale',locale);
  setAttr(html,'data-bg-static-translated',translated ? 'true' : 'false');

  const localizedUrl = SITE + canonicalRoute(locale,route);
  const other = locale === 'en' ? 'nl' : 'en';
  const otherUrl = SITE + canonicalRoute(other,route);

  let canonical = findFirst(head,n=>n.tagName==='link' && String(attr(n,'rel')||'').toLowerCase()==='canonical');
  if (canonical) setAttr(canonical,'href',localizedUrl);

  removeChildrenBy(head,n=>n.tagName==='link' && String(attr(n,'rel')||'').toLowerCase()==='alternate' && attr(n,'hreflang'));

  const makeLink = (hreflang,href) => ({
    nodeName:'link',tagName:'link',namespaceURI:'http://www.w3.org/1999/xhtml',
    attrs:[{name:'rel',value:'alternate'},{name:'hreflang',value:hreflang},{name:'href',value:href}],
    childNodes:[],parentNode:head
  });
  head.childNodes.push(makeLink('nl',SITE + canonicalRoute('nl',route)));
  head.childNodes.push(makeLink('en',SITE + canonicalRoute('en',route)));
  head.childNodes.push(makeLink('x-default',SITE + canonicalRoute('nl',route)));

  const ogUrl = findFirst(head,n=>n.tagName==='meta' && String(attr(n,'property')||'').toLowerCase()==='og:url');
  if (ogUrl) setAttr(ogUrl,'content',localizedUrl);

  applyLocaleSeoMetadata(doc,locale,route,localizedUrl);

  const staticMarker = {
    nodeName:'meta',tagName:'meta',namespaceURI:'http://www.w3.org/1999/xhtml',
    attrs:[{name:'name',value:'bg-static-locale'},{name:'content',value:locale}],
    childNodes:[],parentNode:head
  };
  head.childNodes.push(staticMarker);
}

function loadCache() {
  let cache = {};
  try {
    const json = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_FILE,'utf8'));
    if (json && typeof json === 'object') cache = { ...json };
  } catch {}
  try {
    if (fs.existsSync(TRANSLATION_CACHE_PATCH_DIR)) {
      for (const name of fs.readdirSync(TRANSLATION_CACHE_PATCH_DIR).filter(x=>x.endsWith('.json')).sort()) {
        const patch = JSON.parse(fs.readFileSync(path.join(TRANSLATION_CACHE_PATCH_DIR,name),'utf8'));
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid static i18n cache patch: ' + name);
        cache = { ...cache, ...patch };
      }
    }
  } catch (error) {
    throw new Error('STATIC_I18N_CACHE_PATCH_INVALID: ' + (error?.message || String(error)));
  }
  return cache;
}

function saveCache(cache) {
  ensureDir(TRANSLATION_CACHE_FILE);
  fs.writeFileSync(TRANSLATION_CACHE_FILE,JSON.stringify(cache,null,2)+'\n');
}

function parseTranslations(raw) {
  const text = String(raw || '').trim();
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const first = text.indexOf('['), last = text.lastIndexOf(']');
  if (first >= 0 && last > first) candidates.push(text.slice(first,last+1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  throw new Error('Translation provider returned invalid JSON');
}

async function translateBatch(strings,key) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),60000);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01'
      },
      body:JSON.stringify({
        model:MODEL,
        max_tokens:6000,
        system:'Translate Dutch website UI and marketing copy faithfully into natural English. Preserve Bedrijfsgeheugen, product names, URLs, numbers, currencies, placeholders and factual meaning. Do not add or remove claims. Return ONLY one valid JSON array of strings, same order and same length as input.',
        messages:[{role:'user',content:JSON.stringify(strings)}]
      }),
      signal:controller.signal
    });
    if (!response.ok) {
      const body = (await response.text()).slice(0,300);
      const retryAfterRaw = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfterRaw && /^\d+(?:\.\d+)?$/.test(retryAfterRaw) ? Number(retryAfterRaw) : null;
      const error = new Error('Anthropic HTTP ' + response.status + ': ' + body);
      error.status = response.status;
      error.providerBody = body;
      error.retryAfterMs = retryAfterSeconds === null ? null : Math.ceil(retryAfterSeconds * 1000);
      throw error;
    }
    const payload = await response.json();
    const raw = payload?.content?.map(x=>x?.type==='text'?x.text:'').join('') || '';
    const out = parseTranslations(raw);
    if (out.length !== strings.length || out.some(x=>typeof x!=='string')) throw new Error('Translation response shape mismatch');
    return out;
  } finally {
    clearTimeout(timer);
  }
}

async function translateAll(strings) {
  const cache = loadCache();
  const result = new Map();
  const missing = [];
  for (const source of strings) {
    const hit = cache[source];
    if (typeof hit === 'string' && hit.trim()) result.set(source,hit);
    else missing.push(source);
  }
  if (!missing.length) return result;

  const cacheRequired = String(process.env.STATIC_I18N_REQUIRE_CACHE || '').trim() === '1';
  if (cacheRequired) {
    console.error('STATIC_I18N_CACHE_MISSING', JSON.stringify(missing));
    throw new Error('STATIC_I18N_CACHE_INCOMPLETE: ' + missing.length + ' missing translation(s); first=' + missing[0].slice(0,120));
  }

  const networkAllowed = String(process.env.STATIC_I18N_NETWORK || '').trim() === '1';
  if (!networkAllowed) {
    console.warn('STATIC_I18N_PARTIAL_CACHE_FALLBACK', JSON.stringify({
      cached: result.size,
      missing: missing.length,
      first_missing: missing[0]?.slice(0,120) || null
    }));
    return result;
  }

  const key = String(process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is required when STATIC_I18N_NETWORK=1');
  }

  const batches = [];
  let batch=[], chars=0;
  for (const source of missing) {
    if (batch.length >= 18 || chars + source.length > 3200) {
      batches.push(batch); batch=[]; chars=0;
    }
    batch.push(source); chars += source.length;
  }
  if (batch.length) batches.push(batch);

  async function translateResilient(part, depth=0) {
    let lastError;
    for (let attempt=0;attempt<6;attempt++) {
      try {
        const translated = await translateBatch(part,key);
        part.forEach((source,index)=>{
          cache[source]=translated[index];
          result.set(source,translated[index]);
        });
        saveCache(cache);
        return;
      } catch (error) {
        lastError = error;
        const transient = [429,500,502,503,504,529].includes(Number(error?.status));
        const providerDelay = Number.isFinite(error?.retryAfterMs) ? error.retryAfterMs : 0;
        const exponentialDelay = Math.min(20_000, 1_500 * (2 ** attempt));
        const delay = transient ? Math.max(providerDelay, exponentialDelay) : Math.min(4_000, exponentialDelay);
        const status = Number(error?.status) || null;
        const providerBody = typeof error?.providerBody === 'string' ? error.providerBody.slice(0,300) : null;
        console.warn('STATIC_I18N_PROVIDER_ERROR', JSON.stringify({
          attempt: attempt + 1,
          max_attempts: 6,
          batch_size: part.length,
          status,
          transient,
          provider_body: providerBody,
          delay_ms: transient ? delay : 0
        }));
        if (!transient && status >= 400 && status < 500) break;
        await new Promise(r=>setTimeout(r,delay));
      }
    }
    if (part.length > 1) {
      const mid = Math.ceil(part.length/2);
      await translateResilient(part.slice(0,mid),depth+1);
      await translateResilient(part.slice(mid),depth+1);
      return;
    }
    throw new Error('Static English translation failed for "' + part[0].slice(0,120) + '": ' + (lastError?.message || 'unknown error'));
  }

  const concurrency = Math.max(1, Math.min(2, Number(process.env.STATIC_I18N_CONCURRENCY || 1)));
  let cursor = 0;
  async function worker(workerId) {
    while (true) {
      const index = cursor++;
      if (index >= batches.length) return;
      const part = batches[index];
      await translateResilient(part);
      console.log('STATIC_I18N_BATCH',index+1,'of',batches.length,'strings',part.length,'worker',workerId);
      await new Promise(r=>setTimeout(r,750));
    }
  }
  try {
    await Promise.all(Array.from({length:Math.min(concurrency,batches.length)},(_,i)=>worker(i+1)));
    return result;
  } catch (error) {
    if (networkAllowed) {
      throw new Error('STATIC_I18N_PRODUCTION_TRANSLATION_FAILED: ' + (error?.message || String(error)));
    }
    console.warn('STATIC_I18N_PROVIDER_FALLBACK', error?.message || String(error));
    return result;
  }
}

const discoveredFiles = walk(ROOT).sort();
const publicRoutes = publicRoutesFromSitemap();
const files = discoveredFiles.filter(file => publicRoutes.has(normalizedRoute(routeFor(file))));
const aliases = routeAliases(files);
if (!files.length) throw new Error('No public HTML files selected for localized build');
console.log('STATIC_I18N_SCOPE',JSON.stringify({discovered:discoveredFiles.length,public:files.length}));
const allStrings = new Set();

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT,file),'utf8');
  const doc = parse(html,{sourceCodeLocationInfo:false});
  const refs = collectTranslatables(doc);
  refs.forEach(ref=>allStrings.add(ref.source));
  // Do not retain parse5 document trees across routes: 100+ full DOM trees can exceed the Netlify build memory limit.
}

const cacheValidationOnly = process.argv.includes('--validate-cache');
if (cacheValidationOnly) {
  const cache = loadCache();
  const missing = [...allStrings].filter(source => typeof cache[source] !== 'string' || !cache[source].trim());
  if (missing.length) {
    console.error('STATIC_I18N_CACHE_MISSING', JSON.stringify(missing));
    throw new Error('STATIC_I18N_CACHE_INCOMPLETE: ' + missing.length + ' missing translation(s); first=' + missing[0].slice(0,120));
  }
  console.log('STATIC_I18N_CACHE_COMPLETE', JSON.stringify({ files: files.length, strings: allStrings.size }));
  process.exit(0);
}

const translations = await translateAll([...allStrings]);
const productionTranslationRequired = String(process.env.STATIC_I18N_REQUIRE_CACHE || '').trim() === '1' || String(process.env.STATIC_I18N_NETWORK || '').trim() === '1';
if (productionTranslationRequired && !translations) {
  throw new Error('STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED');
}
let translatedRoutes = 0;
let partialRoutes = 0;
let untranslatedRefs = 0;
for (const file of files) {
  const sourceHtml = fs.readFileSync(path.join(ROOT,file),'utf8');
  const route = routeFor(file);

  const nlDoc = parse(sourceHtml);
  rewriteLinks(nlDoc,file,'nl',aliases);
  rewriteLanguageSwitchers(nlDoc,route,'nl');
  setLocaleMetadata(nlDoc,'nl',route,true);
  applyLocaleRevenueMetadata(nlDoc,'nl',route);
  localizeStructuredData(nlDoc,'nl',route,translations);
  const nlOut = outputPath('nl',file);
  ensureDir(nlOut);
  const nlSerialized=serialize(nlDoc);
  fs.writeFileSync(nlOut,nlSerialized);
  // Dutch is canonically served on the unprefixed route. Write the finalized
  // NL locale metadata back to that public source so the actual canonical page,
  // not only the legacy /nl artifact, carries reciprocal hreflang and locale SEO.
  fs.writeFileSync(path.join(ROOT,file),nlSerialized);

  const enDoc = parse(sourceHtml);
  const enRefs = collectTranslatables(enDoc);
  const missingForRoute = translations
    ? applyTranslations(enRefs,translations,{allowMissing:!productionTranslationRequired})
    : enRefs.map(ref=>ref.source);
  untranslatedRefs += missingForRoute.length;
  if (missingForRoute.length) partialRoutes++;
  else translatedRoutes++;
  rewriteLinks(enDoc,file,'en',aliases);
  rewriteLanguageSwitchers(enDoc,route,'en');
  setLocaleMetadata(enDoc,'en',route,missingForRoute.length === 0);
  applyLocaleRevenueMetadata(enDoc,'en',route);
  localizeStructuredData(enDoc,'en',route,translations);
  const enOut = outputPath('en',file);
  ensureDir(enOut);
  fs.writeFileSync(enOut,serialize(enDoc));
}

console.log('STATIC_I18N_ROUTES',JSON.stringify({
  files:files.length,
  strings:allStrings.size,
  nl:true,
  en:true,
  staticEnglish:Boolean(translations?.size),
  translatedRoutes,
  partialRoutes,
  untranslatedRefs,
  runtimeFallback:!translations || untranslatedRefs > 0
}));
