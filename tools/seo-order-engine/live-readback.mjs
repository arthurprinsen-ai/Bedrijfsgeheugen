import { readFile } from 'node:fs/promises';
import { loadRegistry } from './registry.mjs';
import { inspectBlog } from './blog-contract-v2.mjs';
import { inspectMoneyPage } from './money-contract-v2.mjs';
import { hasGrowthMeasurement } from './measurement.mjs';

function attr(tag,name){const m=String(tag||'').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`,'i'));return m?(m[1]??m[2]??''):'';}
function canonicalOf(html){const head=String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';const tag=[...head.matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||'';return attr(tag,'href');}

function registeredPageErrors(page,entry){
  const fouten=[];const html=String(page.html||'');
  if(!/id=["']bg-seo-order-graph["']/i.test(html))fouten.push(`${page.path}: SEO order graph ontbreekt`);
  if(!hasGrowthMeasurement(html))fouten.push(`${page.path}: growth measurement contract ontbreekt`);
  const body=html.match(/<body\b[^>]*>/i)?.[0]||'';const role=attr(body,'data-bg-page-role');const stage=attr(body,'data-bg-funnel-stage');const intent=attr(body,'data-bg-intent');
  if(role!==entry.role)fouten.push(`${page.path}: live page role ${role||'(leeg)'} moet ${entry.role} zijn`);
  if(stage!==entry.funnel_stage)fouten.push(`${page.path}: live funnel stage ${stage||'(leeg)'} moet ${entry.funnel_stage} zijn`);
  if(intent!==entry.primary_intent)fouten.push(`${page.path}: live intent ${intent||'(leeg)'} moet ${entry.primary_intent} zijn`);
  if(entry.role==='money')fouten.push(...inspectMoneyPage(html,entry).map(e=>`${page.path}: ${e.split(': ').slice(1).join(': ')}`));
  return fouten;
}

export function validateLiveSeoOrderSet(pages,registry){const fouten=[];for(const page of pages||[]){if(!hasGrowthMeasurement(page.html))fouten.push(`${page.path}: growth measurement contract ontbreekt`);const entry=(registry?.pages||[]).find(item=>item.route===page.canonical);if(entry)fouten.push(...registeredPageErrors(page,entry));if(/^blog\/[^/]+\/index\.html$/i.test(page.path||'')&&!entry)fouten.push(...inspectBlog(page.html,page.path,registry));}return [...new Set(fouten)];}

async function readLivePages(){const files=[['live-home.html','live-home.html'],['live-prijzen.html','live-prijzen.html'],['live-afas.html','live-afas.html'],['live-blog-index.html','live-blog-index.html'],['live-blog-afas-api.html','blog/afas-api/index.html'],['live-blog-kennis-borgen.html','blog/kennis-borgen-in-je-bedrijf/index.html']];const pages=[];for(const [file,path] of files){const html=await readFile(file,'utf8');pages.push({path,canonical:canonicalOf(html),html});}return pages;}
export async function checkLiveSeoOrder(){const registry=await loadRegistry();const pages=await readLivePages();const fouten=validateLiveSeoOrderSet(pages,registry);if(fouten.length)throw new Error(`Live SEO order/growth readback faalt (${fouten.length}):\n- ${fouten.join('\n- ')}`);console.log(`Live SEO order + growth readback OK: ${pages.length} representatieve productiepagina's`);return {pages:pages.length};}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/')))await checkLiveSeoOrder();
