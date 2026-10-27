import { normalizeSearchMetric } from './normalize-observation.mjs';

function norm(v){return String(v||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function tokens(v){return new Set(norm(v).split(/\s+/).filter(t=>t.length>=3));}
function localeEntry(entry,localeRevenueMap){
  if(!localeRevenueMap)return null;
  const pages=Array.isArray(localeRevenueMap)?localeRevenueMap:(localeRevenueMap.pages||[]);
  return pages.find(x=>x?.source_route===entry?.route)||null;
}
function scoreQuery(query,entry,localeRevenueMap){
  const q=norm(query);
  const localized=localeEntry(entry,localeRevenueMap);
  const phrases=[
    entry.primary_keyword,...(entry.secondary_keywords||[]),
    localized?.en?.primary_keyword,...(localized?.en?.secondary_keywords||[])
  ].filter(Boolean).map(norm);
  let score=0;
  for(const p of phrases){
    if(!p)continue;
    if(q===p)score+=20;
    else if(q.includes(p)||p.includes(q))score+=10;
    const qt=tokens(q),pt=tokens(p);
    for(const t of pt)if(qt.has(t))score+=2;
  }
  return score;
}

export function mapQueryToRegistry(query,registry,localeRevenueMap=null){
  const ranked=(registry?.pages||[]).filter(e=>['money','pillar','support'].includes(e.role)).map(entry=>({entry,score:scoreQuery(query,entry,localeRevenueMap)})).sort((a,b)=>b.score-a.score||(a.entry.role==='money'?-1:1));
  if(!ranked[0]||ranked[0].score<2)return {entry:null,confidence:0,discovery_candidate:norm(query)};
  const gap=ranked[0].score-(ranked[1]?.score||0);return {entry:ranked[0].entry,confidence:Math.min(1,(ranked[0].score+Math.max(gap,0))/30),discovery_candidate:''};
}

function localeKeywordFor(entry,row,localeRevenueMap){
  const localized=localeEntry(entry,localeRevenueMap);
  const locale=String(row?.locale||row?.language||'').toLowerCase();
  if(locale.startsWith('en')&&localized?.en?.primary_keyword)return localized.en.primary_keyword;
  return entry?.primary_keyword||row?.keyword_cluster||'unmapped';
}
function localeCanonicalFor(entry,row,localeRevenueMap){
  const localized=localeEntry(entry,localeRevenueMap);
  const locale=String(row?.locale||row?.language||'').toLowerCase();
  if(locale.startsWith('en')&&localized?.en?.route)return localized.en.route;
  return entry?.route;
}

export function normalizeSearchRows(rows,source,registry,localeRevenueMap=null){
  return (rows||[]).map(row=>{
    const mapped=mapQueryToRegistry(row.query,registry,localeRevenueMap);
    const entry=mapped.entry;
    const canonical=row.canonical||localeCanonicalFor(entry,row,localeRevenueMap);
    if(!canonical)return {kind:'discovery-candidate',query:String(row.query||''),confidence:0,discovery_candidate:mapped.discovery_candidate,source};
    const observation=normalizeSearchMetric({...row,canonical,intent_id:entry?.primary_intent||row.intent_id||'unmapped',keyword_cluster:localeKeywordFor(entry,row,localeRevenueMap),period:row.period||row.date||''},source);
    return Object.freeze({...observation,mapping_confidence:mapped.confidence,discovery_candidate:mapped.discovery_candidate});
  });
}
