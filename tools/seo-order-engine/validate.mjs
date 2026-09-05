import { readFile, glob } from 'node:fs/promises';
import { validateRegistry, loadRegistry } from './registry.mjs';
import { validateMoneyPages } from './link-graph.mjs';
import { inspectBlog } from './blog-contract-v2.mjs';
import { inspectMoneyPage } from './money-contract-v2.mjs';
import { hasGrowthMeasurement } from './measurement.mjs';
import { PUBLIC_PAGE_EXCLUDES } from '../site-shell/contracts.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const EXCLUDES=new Set([...PUBLIC_PAGE_EXCLUDES,'404.html']);
const EXCLUDED_PREFIXES=['.git/','.github/','.netlify/','node_modules/','tests/','tools/','docs/','coverage/'];
function attr(tag,name){const m=String(tag||'').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`,'i'));return m?(m[1]??m[2]??''):'';}
function headOf(html){return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';}
function canonicalOf(html){const tag=[...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||'';return attr(tag,'href');}
function noindex(html){const robots=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>/^robots$/i.test(attr(m[0],'name')))?.[0]||'';return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attr(robots,'content'));}
function metaContent(html,name){const tag=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>String(attr(m[0],'name')).toLowerCase()===String(name).toLowerCase())?.[0]||'';return attr(tag,'content');}
function primaryPageForEntry(pages,entry){const candidates=(pages||[]).filter(page=>page.canonical===entry.route);if(!candidates.length)return null;const nonBlog=candidates.find(page=>!/^blog\//i.test(page.path||''));if(nonBlog)return nonBlog;if(entry.role==='blog-index')return candidates.find(page=>page.path==='blog/index.html')||candidates[0];return candidates[0];}
function isBlogArticle(path){return /^blog\/.+\/index\.html$/i.test(path||'')&&path!=='blog/index.html';}
function isCanonicalAliasArticle(page,registry){if(!isBlogArticle(page.path))return false;return (registry?.pages||[]).some(entry=>entry.route===page.canonical&&entry.role!=='article');}
function isExcludedPath(path){return EXCLUDES.has(path)||EXCLUDES.has(path.split('/').at(-1))||EXCLUDED_PREFIXES.some(prefix=>path.startsWith(prefix))||/(?:^|\/)shell-gate-[^/]*\.html$/i.test(path);}
function hasBodyAttr(html,name,value){const body=String(html).match(/<body\b[^>]*>/i)?.[0]||'';return attr(body,name)===value;}

function validateIntentOwnership(page,registry){
  const errors=[];
  const entry=(registry?.pages||[]).find(item=>item.route===page.canonical)||null;
  const owner=metaContent(page.html,'bg-intent-owner');
  const knownOwners=new Set((registry?.pages||[]).map(item=>item.route));
  if(entry){
    if(owner!==entry.route)errors.push(`${page.canonical}: primary intent-owner meta moet eigen canonical zijn`);
    if(!hasBodyAttr(page.html,'data-bg-intent-role','primary'))errors.push(`${page.canonical}: primary intent-role ontbreekt`);
    if(!hasBodyAttr(page.html,'data-bg-intent-owner',entry.route))errors.push(`${page.canonical}: primary intent-owner body marker ontbreekt`);
  } else {
    if(!owner||!knownOwners.has(owner))errors.push(`${page.canonical}: supporting pagina heeft geen bekende primary intent-owner`);
    if(!hasBodyAttr(page.html,'data-bg-intent-role','supporting'))errors.push(`${page.canonical}: supporting intent-role ontbreekt`);
    if(owner&&!hasBodyAttr(page.html,'data-bg-intent-owner',owner))errors.push(`${page.canonical}: supporting intent-owner body marker ontbreekt`);
  }
  return errors;
}

export function validateSeoOrderPages(pages,registry,options={}){
  const fouten=[...validateRegistry(registry),...validateMoneyPages(pages,registry)];
  for(const page of pages||[]){
    if(!hasGrowthMeasurement(page.html))fouten.push(`${page.canonical}: growth measurement contract ontbreekt`);
    fouten.push(...validateIntentOwnership(page,registry));
  }
  for(const entry of registry?.pages||[]){
    const page=primaryPageForEntry(pages,entry); if(!page)continue;
    if(!/id=["']bg-seo-order-graph["']/i.test(page.html))fouten.push(`${entry.route}: SEO order graph ontbreekt`);
    if(!new RegExp(`<meta\\b[^>]*name=["']bg-intent["'][^>]*content=["']${entry.primary_intent.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(page.html))fouten.push(`${entry.route}: intent marker ontbreekt`);
    if(entry.role==='money')fouten.push(...inspectMoneyPage(page.html,entry));
  }
  if(options.inspectBlogs!==false){for(const page of pages||[]){if(!isBlogArticle(page.path))continue;if(isCanonicalAliasArticle(page,registry))continue;fouten.push(...inspectBlog(page.html,page.path,registry));}}
  return [...new Set(fouten)];
}

async function estatePages(){
  const paths=[];
  for await(const p of glob('*.html'))if(!isExcludedPath(p))paths.push(p);
  for await(const p of glob('**/*.html'))if(!isExcludedPath(p))paths.push(p);
  const pages=[];
  for(const path of [...new Set(paths)].sort()){
    let html;try{html=await readFile(path,'utf8');}catch{continue;}
    if(!/<body\b/i.test(html)||noindex(html))continue;
    const canonical=canonicalOf(html);if(!canonical.startsWith(`${ORIGIN}/`))continue;
    pages.push({path,canonical,html});
  }
  return pages;
}
export async function validateSeoOrderEngine(){const registry=await loadRegistry();const pages=await estatePages();const fouten=validateSeoOrderPages(pages,registry);if(fouten.length)throw new Error(`SEO order gate faalt (${fouten.length}):\n- ${fouten.join('\n- ')}`);console.log(`SEO order engine OK: ${pages.length} indexeerbare pagina's; primary/supporting intent ownership, money-v2, blog-v2, growth measurement, linkgraaf, structured data en conversies gecontroleerd`);return {pages:pages.length,money:registry.pages.filter(p=>p.role==='money').length};}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/')))await validateSeoOrderEngine();
