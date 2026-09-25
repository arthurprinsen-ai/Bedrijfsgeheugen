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
      routes.add(normalizedRoute(match[1] || '/'));
    }
  } catch {}
  return routes;
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

function applyTranslations(refs,map) {
  for (const ref of refs) {
    const value = map.get(ref.source);
    if (typeof value !== 'string' || !value.trim()) throw new Error('Missing static English translation for: ' + ref.source.slice(0,120));
    if (ref.kind === 'text') {
      const leading = ref.original.match(/^\s*/)?.[0] || '';
      const trailing = ref.original.match(/\s*$/)?.[0] || '';
      ref.node.value = leading + value + trailing;
    } else {
      const a = ref.node.attrs.find(x=>x.name===ref.attr);
      if (a) a.value = value;
    }
  }
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

function rewriteLinks(doc,sourceFile,locale,aliases) {
  const visit = node => {
    if (node.tagName) {
      for (const a of node.attrs || []) {
        if (!['href','src','action'].includes(a.name)) continue;
        const resolved = resolveInternal(a.value,sourceFile);
        if (!resolved) continue;
        const targetFile = aliases.get(resolved.path);
        if (targetFile) {
          const targetRoute = routeFor(targetFile);
          a.value = canonicalRoute(locale,targetRoute) + resolved.suffix;
        } else if (!a.value.startsWith('/')) {
          a.value = resolved.path + resolved.suffix;
        }
      }
    }
    for (const child of node.childNodes || []) visit(child);
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
    console.warn('STATIC_I18N_OFFLINE_RELEASE English generation skipped: release builds never call external translation providers');
    return null;
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

  const concurrency = Math.max(1, Math.min(8, Number(process.env.STATIC_I18N_CONCURRENCY || 1)));
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
    return null;
  }
}

const discoveredFiles = walk(ROOT).sort();
const publicRoutes = publicRoutesFromSitemap();
const files = discoveredFiles.filter(file => publicRoutes.has(normalizedRoute(routeFor(file))));
const aliases = routeAliases(files);
if (!files.length) throw new Error('No public HTML files selected for localized build');
console.log('STATIC_I18N_SCOPE',JSON.stringify({discovered:discoveredFiles.length,public:files.length}));
const parsed = new Map();
const allStrings = new Set();

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT,file),'utf8');
  const doc = parse(html,{sourceCodeLocationInfo:false});
  const refs = collectTranslatables(doc);
  parsed.set(file,{doc,refs});
  refs.forEach(ref=>allStrings.add(ref.source));
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
for (const file of files) {
  const sourceHtml = fs.readFileSync(path.join(ROOT,file),'utf8');
  const route = routeFor(file);

  const nlDoc = parse(sourceHtml);
  rewriteLinks(nlDoc,file,'nl',aliases);
  setLocaleMetadata(nlDoc,'nl',route,true);
  const nlOut = outputPath('nl',file);
  ensureDir(nlOut);
  fs.writeFileSync(nlOut,serialize(nlDoc));

  const enDoc = parse(sourceHtml);
  if (translations) {
    const enRefs = collectTranslatables(enDoc);
    applyTranslations(enRefs,translations);
  }
  rewriteLinks(enDoc,file,'en',aliases);
  setLocaleMetadata(enDoc,'en',route,Boolean(translations));
  const enOut = outputPath('en',file);
  ensureDir(enOut);
  fs.writeFileSync(enOut,serialize(enDoc));
}

console.log('STATIC_I18N_ROUTES',JSON.stringify({files:files.length,strings:allStrings.size,nl:true,en:true,staticEnglish:Boolean(translations),runtimeFallback:!translations}));
