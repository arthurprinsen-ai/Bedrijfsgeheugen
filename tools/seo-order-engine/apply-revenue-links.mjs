import { readFile, writeFile, glob } from 'node:fs/promises';
import { loadRegistry, ORIGIN } from './registry.mjs';

const LOCALE_MAP_PATH='site/seo-locale-revenue-map.json';

function attr(tag,name){
  const m=String(tag||'').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`,'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}
function headOf(html){return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';}
function canonicalOf(html){
  const tag=[...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||'';
  return attr(tag,'href');
}
function noindex(html){
  const tag=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>String(attr(m[0],'name')).toLowerCase()==='robots')?.[0]||'';
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(attr(tag,'content'));
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function reEsc(v){return String(v||'').replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');}
function hasLink(html,url){const q=reEsc(url);return new RegExp(`<a\\b[^>]*href=(?:"${q}"|'${q}')`,'i').test(String(html));}
function localizedUrl(source,locale){
  if(locale==='nl') return source;
  const path=source.slice(ORIGIN.length)||'/';
  return ORIGIN + '/en' + (path==='/'?'/':path);
}
function insertBeforeMainClose(html,block){
  if(/<\/main>/i.test(html)) return html.replace(/<\/main>/i,block+'\n</main>');
  return html.replace(/<\/body>/i,block+'\n</body>');
}
function ensureStyle(html){
  if(/id=["']bg-revenue-links-style["']/i.test(html)) return html;
  const style='<style id="bg-revenue-links-style">.bg-revenue-links{max-width:1120px;margin:2rem auto 3rem;padding:1.2rem 1.35rem;border:1px solid #dcdfe6;border-radius:16px;background:#fff}.bg-revenue-links h2{margin:0 0 .35rem;font-size:clamp(1.15rem,3vw,1.55rem)}.bg-revenue-links p{margin:.15rem 0 .9rem;color:#5c646e}.bg-revenue-links__items{display:flex;gap:.65rem;flex-wrap:wrap}.bg-revenue-links a{display:inline-flex;min-height:44px;align-items:center;padding:.65rem .9rem;border-radius:10px;border:1px solid #2742d6;color:#2742d6!important;font-weight:700;text-decoration:none}.bg-revenue-links a[data-bg-revenue-cta]{background:#2742d6;color:#fff!important}</style>';
  return html.replace(/<\/head>/i,style+'\n</head>');
}
async function htmlPaths(){
  const out=[];
  for await(const p of glob('*.html')) out.push(p);
  for await(const p of glob('blog/**/index.html')) out.push(p);
  for await(const p of glob('kennis/**/index.html')) out.push(p);
  for await(const p of glob('en/**/*.html')) out.push(p);
  return [...new Set(out)].sort();
}
function localeKeyword(entry,locale,localeMap){
  const mapped=localeMap.get(entry.route);
  return String(mapped?.[locale]?.primary_keyword || entry.primary_keyword || entry.primary_intent || '').trim();
}
export async function applyRevenueLinks(){
  const registry=await loadRegistry();
  const localeRaw=JSON.parse(await readFile(LOCALE_MAP_PATH,'utf8'));
  const localeMap=new Map((localeRaw.pages||[]).map(x=>[x.source_route,x]));
  const pages=new Map();
  for(const path of await htmlPaths()){
    let html; try{html=await readFile(path,'utf8');}catch{continue;}
    if(!/<body\b/i.test(html)||noindex(html)) continue;
    const canonical=canonicalOf(html);
    if(canonical.startsWith(ORIGIN+'/')) pages.set(canonical,{path,html});
  }
  let changed=0,linksAdded=0;
  for(const entry of registry.pages||[]){
    if(entry.role!=='money') continue;
    for(const locale of ['nl','en']){
      const ownerUrl=localizedUrl(entry.route,locale);
      const owner=pages.get(ownerUrl);
      const supportUrls=(entry.supporting_routes||[]).map(x=>localizedUrl(x,locale)).filter(x=>pages.has(x));
      if(owner){
        const links=[];
        for(const supportUrl of supportUrls){
          if(!hasLink(owner.html,supportUrl)){
            const sourceRoute=locale==='en'?ORIGIN+(supportUrl.slice((ORIGIN+'/en').length)||'/'):supportUrl;
            const targetEntry=(registry.pages||[]).find(x=>x.route===sourceRoute);
            const mapped=localeMap.get(sourceRoute);
            const label=locale==='en'
              ? (mapped?.en?.primary_keyword || targetEntry?.primary_keyword || 'related guidance')
              : (targetEntry?.primary_keyword || 'gerelateerde uitleg');
            links.push('<a href="'+esc(supportUrl)+'" data-bg-revenue-link="cluster">'+esc(locale==='en'?'Explore '+label:'Bekijk '+label)+' →</a>');
          }
        }
        const ctaUrl=localizedUrl(entry.primary_cta?.url||'',locale);
        if(entry.primary_cta?.url && pages.has(ctaUrl) && !hasLink(owner.html,ctaUrl)){
          links.push('<a href="'+esc(ctaUrl)+'" data-bg-revenue-link="conversion" data-bg-revenue-cta="'+esc(entry.primary_cta.action||'next-step')+'">'+esc(locale==='en'?'Take the next step':'Ga naar de volgende stap')+' →</a>');
        }
        if(links.length){
          const heading=locale==='en'?'From comparison to business value':'Van vergelijken naar bedrijfswaarde';
          const intro=locale==='en'?'Continue with the implementation, governance or commercial step that fits this topic.':'Ga door naar de implementatie, governance of commerciële vervolgstap die bij dit onderwerp past.';
          const block='<section class="bg-revenue-links" data-bg-revenue-links="v1"><h2>'+heading+'</h2><p>'+intro+'</p><div class="bg-revenue-links__items">'+links.join('')+'</div></section>';
          owner.html=insertBeforeMainClose(ensureStyle(owner.html),block);
          linksAdded+=links.length;
        }
      }
      for(const supportSource of entry.supporting_routes||[]){
        const supportUrl=localizedUrl(supportSource,locale);
        const support=pages.get(supportUrl);
        if(!support||hasLink(support.html,ownerUrl)) continue;
        const label=localeKeyword(entry,locale,localeMap);
        const heading=locale==='en'?'Related solution':'Gerelateerde oplossing';
        const intro=locale==='en'?'This page supports a concrete next step.':'Deze pagina ondersteunt een concrete vervolgstap.';
        const linkLabel=locale==='en'?'View '+label:'Bekijk '+label;
        const block='<section class="bg-revenue-links" data-bg-revenue-links="v1"><h2>'+heading+'</h2><p>'+intro+'</p><div class="bg-revenue-links__items"><a href="'+esc(ownerUrl)+'" data-bg-money-route="'+esc(ownerUrl)+'" data-bg-revenue-link="owner">'+esc(linkLabel)+' →</a></div></section>';
        support.html=insertBeforeMainClose(ensureStyle(support.html),block);
        linksAdded++;
      }
    }
  }
  for(const page of pages.values()){
    const original=await readFile(page.path,'utf8');
    if(page.html!==original){await writeFile(page.path,page.html,'utf8');changed++;}
  }
  console.log('SEO_REVENUE_LINKS_APPLIED',JSON.stringify({changed,linksAdded,pages:pages.size}));
  return {changed,linksAdded,pages:pages.size};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))) await applyRevenueLinks();
