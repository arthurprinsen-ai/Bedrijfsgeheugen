import { readFile, glob } from 'node:fs/promises';
import { loadRegistry, ORIGIN } from './registry.mjs';

const MAP_PATH='site/seo-locale-revenue-map.json';

function escRe(v){return String(v||'').replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');}
function attr(tag,name){const m=String(tag||'').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`,'i'));return m?(m[1]??m[2]??''):'';}
function headOf(html){return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';}
function canonicalOf(html){const tag=[...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||'';return attr(tag,'href');}
function meta(html,name){const tag=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>String(attr(m[0],'name')).toLowerCase()===String(name).toLowerCase())?.[0]||'';return attr(tag,'content');}
function titleOf(html){return String(headOf(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/<[^>]+>/g,'').trim();}
function hasHrefLang(html,lang,url){const re=new RegExp(`<link\\b(?=[^>]*rel=(?:"alternate"|'alternate'))(?=[^>]*hreflang=(?:"${escRe(lang)}"|'${escRe(lang)}'))(?=[^>]*href=(?:"${escRe(url)}"|'${escRe(url)}'))[^>]*>`,'i');return re.test(headOf(html));}
function hasLink(html,url){const q=escRe(url);return new RegExp(`<a\\b[^>]*href=(?:"${q}"|'${q}')`,'i').test(String(html));}
function localized(source,locale){if(locale==='nl')return source;const path=source.slice(ORIGIN.length)||'/';return ORIGIN+'/en'+(path==='/'?'/':path);}
async function estate(){
  const paths=[];
  for await(const p of glob('*.html'))paths.push(p);
  for await(const p of glob('blog/**/index.html'))paths.push(p);
  for await(const p of glob('kennis/**/index.html'))paths.push(p);
  for await(const p of glob('en/**/*.html'))paths.push(p);
  const map=new Map();
  for(const path of [...new Set(paths)]){
    let html;try{html=await readFile(path,'utf8');}catch{continue;}
    const canonical=canonicalOf(html);
    if(canonical.startsWith(ORIGIN+'/'))map.set(canonical,{path,html});
  }
  return map;
}
export function validateLocaleRevenueMap(raw,registry){
  const errors=[];
  const pages=raw?.pages||[];
  const bySource=new Map(pages.map(x=>[x.source_route,x]));
  if(pages.length!==(registry.pages||[]).length)errors.push(`locale map pages ${pages.length} != registry pages ${registry.pages.length}`);
  const enClaims=new Map();
  for(const entry of registry.pages||[]){
    const mapped=bySource.get(entry.route);
    if(!mapped){errors.push(`${entry.route}: locale revenue mapping ontbreekt`);continue;}
    if(mapped.nl?.primary_keyword!==entry.primary_keyword)errors.push(`${entry.route}: NL primary keyword wijkt af van registry owner`);
    const expectedEn=localized(entry.route,'en');
    if(mapped.en?.route!==expectedEn)errors.push(`${entry.route}: EN route moet ${expectedEn} zijn`);
    if(!String(mapped.en?.primary_keyword||'').trim())errors.push(`${entry.route}: EN primary keyword ontbreekt`);
    if(!String(mapped.en?.title||'').trim())errors.push(`${entry.route}: EN title ontbreekt`);
    if(!String(mapped.en?.description||'').trim())errors.push(`${entry.route}: EN description ontbreekt`);
    for(const kw of [mapped.en?.primary_keyword,...(mapped.en?.secondary_keywords||[])]){
      const key=String(kw||'').trim().toLowerCase();
      if(!key)continue;
      const owner=enClaims.get(key);
      if(owner&&owner!==entry.route)errors.push(`EN keyword collision "${kw}" tussen ${owner} en ${entry.route}`);
      else enClaims.set(key,entry.route);
    }
    if(entry.role==='money'&&!mapped.conversion_destination)errors.push(`${entry.route}: money page mist conversion destination`);
    if(entry.role==='money'&&!['high','medium'].includes(mapped.revenue_priority))errors.push(`${entry.route}: money page mist revenue priority`);
  }
  return [...new Set(errors)];
}
export async function validateLocalizedSeoRevenue(){
  const registry=await loadRegistry();
  const raw=JSON.parse(await readFile(MAP_PATH,'utf8'));
  const errors=[...validateLocaleRevenueMap(raw,registry)];
  const mapping=new Map((raw.pages||[]).map(x=>[x.source_route,x]));
  const pages=await estate();
  for(const entry of registry.pages||[]){
    const source=pages.get(entry.route);
    if(!source)continue;
    const mapped=mapping.get(entry.route);
    const enUrl=localized(entry.route,'en');
    const en=pages.get(enUrl);
    if(!en){errors.push(`${entry.route}: indexeerbare NL owner mist EN peer ${enUrl}`);continue;}
    if(canonicalOf(en.html)!==enUrl)errors.push(`${en.path}: EN canonical is niet self-referential`);
    if(!hasHrefLang(en.html,'nl',entry.route))errors.push(`${en.path}: hreflang nl ontbreekt`);
    if(!hasHrefLang(en.html,'en',enUrl))errors.push(`${en.path}: hreflang en ontbreekt`);
    if(!hasHrefLang(en.html,'x-default',entry.route))errors.push(`${en.path}: hreflang x-default ontbreekt`);
    if(meta(en.html,'bg-keyword-cluster')!==mapped.en.primary_keyword)errors.push(`${en.path}: EN keyword cluster wijkt af van locale revenue map`);
    if(titleOf(en.html)!==mapped.en.title)errors.push(`${en.path}: EN title wijkt af van locale revenue map`);
    if(meta(en.html,'description')!==mapped.en.description)errors.push(`${en.path}: EN description wijkt af van locale revenue map`);
    if(entry.role==='money'){
      const cta=localized(entry.primary_cta.url,'en');
      if(pages.has(cta)&&!hasLink(en.html,cta))errors.push(`${en.path}: EN money page mist conversion link naar ${cta}`);
      const supports=(entry.supporting_routes||[]).map(x=>localized(x,'en')).filter(x=>pages.has(x));
      if(supports.length&&!supports.some(url=>hasLink(pages.get(url).html,enUrl)))errors.push(`${en.path}: EN money page heeft geen revenue inbound link vanuit supporting routes`);
    }
  }
  const sitemap=await readFile('sitemap.xml','utf8');
  if(!/xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/.test(sitemap))errors.push('sitemap mist xhtml hreflang namespace');
  for(const entry of registry.pages||[]){
    if(!pages.has(entry.route))continue;
    const enUrl=localized(entry.route,'en');
    if(!sitemap.includes('<loc>'+entry.route+'</loc>'))errors.push(`sitemap mist NL owner ${entry.route}`);
    if(!sitemap.includes('<loc>'+enUrl+'</loc>'))errors.push(`sitemap mist EN owner ${enUrl}`);
  }
  if(/<loc>https:\/\/www\.bedrijfsgeheugen\.nl\/nl(?:\/|<)/.test(sitemap))errors.push('sitemap bevat legacy /nl/ canonical');
  if(errors.length)throw new Error('SEO locale/revenue gate faalt ('+errors.length+'):\n- '+[...new Set(errors)].join('\n- '));
  console.log('SEO_LOCALE_REVENUE_OK',JSON.stringify({registry_pages:registry.pages.length,indexed_pages:pages.size,measured_keywords:(raw.measured_keyword_evidence||[]).length}));
  return {registry_pages:registry.pages.length,indexed_pages:pages.size};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))) await validateLocalizedSeoRevenue();
