import { readFile, writeFile, glob } from 'node:fs/promises';
import { PUBLIC_PAGE_EXCLUDES } from '../site-shell/contracts.mjs';
import { loadRegistry, entryForCanonical, ORIGIN } from './registry.mjs';
import { classifyCanonical } from './page-policy.mjs';
import { enrichBlog } from './blog-contract-v2.mjs';
import { enrichRegisteredPage, enrichSupportHandoff, inferSeoMeta } from './enrich.mjs';
import { injectSeoGraph } from './schema.mjs';
import { markPrimaryConversions, injectConversionTracker } from './conversion.mjs';
import { injectGrowthMeasurement } from './measurement.mjs';

const EXCLUDES = new Set([...PUBLIC_PAGE_EXCLUDES, '404.html']);
const EXCLUDED_PREFIXES = ['.git/','.github/','.netlify/','node_modules/','tests/','tools/','docs/','coverage/'];

function attr(tag, name) {
  const m = String(tag || '').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}
function headOf(html) { return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''; }
function noindex(html) { const robots=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>/^robots$/i.test(attr(m[0],'name')))?.[0]||''; return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attr(robots,'content')); }
function canonicalOf(html) { const tag=[...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||''; return attr(tag,'href'); }
function metaContent(html,name){const tag=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>String(attr(m[0],'name')).toLowerCase()===String(name).toLowerCase())?.[0]||'';return attr(tag,'content');}
function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function ensureMeta(input,name,value){let html=String(input);const re=new RegExp(`<meta\\b[^>]*name=(?:"${name}"|'${name}')[^>]*>`,'i');const tag=`<meta name="${name}" content="${esc(value)}">`;return re.test(html)?html.replace(re,tag):html.replace(/<\/head>/i,`${tag}\n</head>`);}
function localIntent(meta){return String(meta?.title||meta?.canonical||'ondersteunende informatie').trim().toLocaleLowerCase('nl-NL');}
function isBlogArticle(path){return /^blog\/.+\/index\.html$/i.test(path)&&path!=='blog/index.html';}
function isExcludedPath(path){return EXCLUDES.has(path)||EXCLUDES.has(path.split('/').at(-1))||EXCLUDED_PREFIXES.some(prefix=>path.startsWith(prefix))||/(?:^|\/)shell-gate-[^/]*\.html$/i.test(path);}

function markBodyContext(input, role, funnel, intent = '', keyword = '', intentRole = 'supporting', owner = '', pageClass = role) {
  const html = String(input);
  return html.replace(/<body\b([^>]*)>/i, (_tag, attrs) => {
    const clean = attrs
      .replace(/\sdata-bg-page-role=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-page-class=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-funnel-stage=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-intent=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-keyword-cluster=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-intent-role=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/\sdata-bg-intent-owner=(?:"[^"]*"|'[^']*')/gi, '');
    return `<body${clean} data-bg-page-role="${esc(role)}" data-bg-page-class="${esc(pageClass)}" data-bg-funnel-stage="${esc(funnel)}" data-bg-intent="${esc(intent)}" data-bg-keyword-cluster="${esc(keyword)}" data-bg-intent-role="${esc(intentRole)}" data-bg-intent-owner="${esc(owner)}">`;
  });
}

function markKnownCtas(input, registry, role = 'support', funnel = 'discover') {
  let html = String(input); const seen = new Set();
  for (const entry of registry.pages || []) {
    const cta = entry.primary_cta;
    if (!cta?.url || !cta?.action || seen.has(`${cta.action}|${cta.url}`)) continue;
    seen.add(`${cta.action}|${cta.url}`);
    html = markPrimaryConversions(html, { role, funnel_stage: funnel, primary_cta: cta });
  }
  return html;
}

function enrichPolicyPage(input, registry, policy) {
  let html = String(input); const meta = inferSeoMeta(html);
  const owner=policy?.ownerEntry||entryForCanonical(policy?.owner,registry)||(registry.pages||[]).find(e=>e.role==='pillar')||null;
  const intent=localIntent(meta); const keyword=intent;
  const pageClass=policy?.page_class||'support';
  const role=pageClass==='pillar'?'pillar':'support';
  const funnel=pageClass==='conversion'?'decide':pageClass==='pillar'?'consider':'discover';
  html = markBodyContext(html, role, funnel, intent, keyword, 'supporting', owner?.route||'', pageClass);
  html = ensureMeta(html,'bg-intent',intent);
  html = ensureMeta(html,'bg-keyword-cluster',keyword);
  html = ensureMeta(html,'bg-intent-owner',owner?.route||'');
  html = ensureMeta(html,'bg-page-class',pageClass);
  if(pageClass==='support' && owner?.route && owner.route!==meta.canonical){
    const handoff={route:meta.canonical,role:'support',funnel_stage:'discover',primary_cta:{action:'commercial-handoff',url:owner.route}};
    html=enrichSupportHandoff(html,handoff);
    html=markPrimaryConversions(html,handoff);
  }
  html = markKnownCtas(html, registry, role, funnel);
  html = injectConversionTracker(html);
  html = injectSeoGraph(html, { ...meta, schema_type: meta.canonical === `${ORIGIN}/blog/` ? 'CollectionPage' : 'WebPage' });
  html = injectGrowthMeasurement(html,{canonical:meta.canonical,page_role:role,funnel_stage:funnel,intent,keyword_cluster:keyword,intent_owner:owner?.route||''});
  return html;
}

async function publicHtmlPaths() {
  const paths = [];
  for await (const p of glob('*.html')) if (!isExcludedPath(p)) paths.push(p);
  for await (const p of glob('**/*.html')) if (!isExcludedPath(p)) paths.push(p);
  return [...new Set(paths)].sort();
}

export async function applySeoOrderEngine() {
  const registry = await loadRegistry(); let changed=0,blogs=0,registered=0,classified=0;
  for (const path of await publicHtmlPaths()) {
    let html; try { html=await readFile(path,'utf8'); } catch { continue; }
    if (!/<body\b/i.test(html) || noindex(html)) continue;
    const canonical=canonicalOf(html); if(!canonical.startsWith(`${ORIGIN}/`)) continue;
    let out;
    if (isBlogArticle(path)) {
      out=enrichBlog(html,path,registry);
      out=injectConversionTracker(out);
      out=injectGrowthMeasurement(out,{canonical,page_role:'article',funnel_stage:'discover',intent:metaContent(out,'bg-intent'),keyword_cluster:metaContent(out,'bg-keyword-cluster'),intent_owner:metaContent(out,'bg-intent-owner')});
      blogs++;
    } else {
      const policy=classifyCanonical(canonical,registry);
      if(!policy) throw new Error(`Ongeclassificeerde publieke pagina: ${canonical}. Voeg expliciet intent/rol/owner toe voordat deze pagina kan publiceren.`);
      if(policy.registered){
        const entry=policy.entry;
        out=enrichRegisteredPage(html,entry);
        out=injectGrowthMeasurement(out,{canonical,page_role:entry.role,funnel_stage:entry.funnel_stage,intent:entry.primary_intent,keyword_cluster:entry.primary_keyword,intent_owner:entry.route});
        registered++;
      } else { out=enrichPolicyPage(html,registry,policy); classified++; }
    }
    if(out!==html){await writeFile(path,out,'utf8');changed++;}
  }
  console.log(`SEO order + growth enrichment toegepast: ${changed} gewijzigd; ${blogs} blogs, ${registered} registry-pages, ${classified} expliciet geclassificeerde publieke pagina's`);
  return {changed,blogs,registered,classified};
}

if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/')))await applySeoOrderEngine();
