import { normalizeSearchMetric } from './normalize-observation.mjs';

function norm(v){return String(v||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function tokens(v){return new Set(norm(v).split(/\s+/).filter(t=>t.length>=3));}
function scoreQuery(query,entry){const q=norm(query);const phrases=[entry.primary_keyword,...(entry.secondary_keywords||[])].filter(Boolean).map(norm);let score=0;for(const p of phrases){if(!p)continue;if(q===p)score+=20;else if(q.includes(p)||p.includes(q))score+=10;const qt=tokens(q),pt=tokens(p);for(const t of pt)if(qt.has(t))score+=2;}return score;}

export function mapQueryToRegistry(query,registry){
  const ranked=(registry?.pages||[]).filter(e=>['money','pillar','support'].includes(e.role)).map(entry=>({entry,score:scoreQuery(query,entry)})).sort((a,b)=>b.score-a.score||(a.entry.role==='money'?-1:1));
  if(!ranked[0]||ranked[0].score<2)return {entry:null,confidence:0,discovery_candidate:norm(query)};
  const gap=ranked[0].score-(ranked[1]?.score||0);return {entry:ranked[0].entry,confidence:Math.min(1,(ranked[0].score+Math.max(gap,0))/30),discovery_candidate:''};
}

export function normalizeSearchRows(rows,source,registry){
  return (rows||[]).map(row=>{
    const mapped=mapQueryToRegistry(row.query,registry);
    const entry=mapped.entry;
    const canonical=row.canonical||entry?.route;
    if(!canonical)return {kind:'discovery-candidate',query:String(row.query||''),confidence:0,discovery_candidate:mapped.discovery_candidate,source};
    const observation=normalizeSearchMetric({...row,canonical,intent_id:entry?.primary_intent||row.intent_id||'unmapped',keyword_cluster:entry?.primary_keyword||row.keyword_cluster||'unmapped',period:row.period||row.date||''},source);
    return Object.freeze({...observation,mapping_confidence:mapped.confidence,discovery_candidate:mapped.discovery_candidate});
  });
}
