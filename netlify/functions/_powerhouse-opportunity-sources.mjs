const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
const decode=value=>clean(String(value??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
const tag=(xml,name)=>{const match=String(xml).match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'));return match?decode(match[1]):'';};
const atomLink=xml=>{const match=String(xml).match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);return match?decode(match[1]):'';};

export function parseExternalFeed(body='',contentType=''){
  const text=String(body??'').trim(); if(!text)return[];
  if(/json/i.test(contentType)||text.startsWith('{')||text.startsWith('[')){
    try{
      const data=JSON.parse(text); const items=Array.isArray(data)?data:Array.isArray(data?.items)?data.items:Array.isArray(data?.results)?data.results:[];
      return items.map(item=>({title:clean(item.title||item.name||item.query),url:clean(item.url||item.link||item.canonical),summary:clean(item.summary||item.description||item.snippet||item.text),publishedAt:item.publishedAt||item.published_at||item.date||item.createdAt||null})).filter(item=>item.title||item.url);
    }catch{return[]}
  }
  const blocks=[...text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match=>match[1]);
  if(!blocks.length)blocks.push(...[...text.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(match=>match[1]));
  return blocks.map(xml=>({title:tag(xml,'title'),url:tag(xml,'link')||atomLink(xml)||tag(xml,'guid')||tag(xml,'id'),summary:tag(xml,'description')||tag(xml,'summary')||tag(xml,'content'),publishedAt:tag(xml,'pubDate')||tag(xml,'published')||tag(xml,'updated')||null})).filter(item=>item.title||item.url);
}

function freshness(publishedAt,now){const time=Date.parse(clean(publishedAt));if(!Number.isFinite(time))return .55;const hours=Math.max(0,(now.getTime()-time)/36e5);return clamp(1-hours/168);}
function containsAny(text,terms){return terms.some(term=>text.includes(term));}

export function externalSignalFromItem(item={},source={},now=new Date()){
  const title=clean(item.title); const summary=clean(item.summary); const text=`${title} ${summary}`.toLowerCase();
  const keywords=(source.keywords||[]).map(value=>clean(value).toLowerCase()).filter(Boolean);
  const hits=keywords.filter(keyword=>text.includes(keyword)).length;
  const hitRatio=keywords.length?Math.min(1,hits/Math.min(4,keywords.length)):.45;
  const intentTerms=['hoe ','implement','kosten','kiezen','strategie','oplossing','advies','business case','investering','verplicht','moeten','risico','compliance','deadline'];
  const urgencyTerms=['deadline','verplicht','wet','regelgeving','regulation','boete','vanaf','wijziging','nieuwe regels','incident','tekort','crisis','stijgt','daalt'];
  const depthTerms=['wet','regelgeving','governance','strategie','architectuur','transformatie','implementatie','business case','compliance','onderzoek'];
  const intent=clamp(.38+hitRatio*.28+(containsAny(text,intentTerms)?.22:0));
  const urgency=clamp(.32+hitRatio*.22+(containsAny(text,urgencyTerms)?.36:0)+(source.type==='regulation'?.12:0));
  const relevance=clamp(.42+hitRatio*.5);
  const customerFit=clamp(.4+hitRatio*.5+(text.includes('mkb')?.1:0));
  const commercialValue=clamp(Number(source.commercialWeight??.62)+intent*.18+customerFit*.12);
  const evidenceStrength=clamp(Number(source.evidenceStrength??.72));
  const fresh=freshness(item.publishedAt,now);
  const depthNeed=clamp(.42+(containsAny(text,depthTerms)?.3:0)+(source.type==='regulation'?.18:0));
  const searchDemand=clamp(source.type==='search'?.76:Number(source.searchDemand??.38));
  const conversationVelocity=clamp(Number(source.conversationVelocity??(source.type==='news'?.62:.42))+urgency*.15);
  const engagementPotential=clamp(.38+urgency*.3+relevance*.2);
  return {
    source:clean(source.id)||'external-feed', sourceUrl:clean(item.url), topic:title||summary.slice(0,180), audience:clean(source.audience)||'directie', observedAt:item.publishedAt||now.toISOString(),
    intent,relevance,urgency,commercialValue,evidenceStrength,engagementPotential,freshness:fresh,customerFit,searchDemand,conversationVelocity,depthNeed,
    context:{market:clean(source.market)||'NL',trigger:'external-feed',sourceId:clean(source.id),sourceType:clean(source.type)||'news',sourceTitle:clean(source.title),problem:summary.slice(0,320),angle:clean(source.angle)},
    evidence:{title,summary:summary.slice(0,1000),publishedAt:item.publishedAt||null,sourceId:clean(source.id),sourceType:clean(source.type)}
  };
}

const googleNews=query=>`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=nl&gl=NL&ceid=NL:nl`;

export function defaultOpportunitySources(){
  return [
    {id:'nl-ai-mkb-news',type:'news',title:'AI en MKB nieuws',url:googleNews('AI MKB digitalisering OR automatisering'),audience:'directie',market:'NL',keywords:['ai','mkb','digitalisering','automatisering','productiviteit'],commercialWeight:.72,evidenceStrength:.72},
    {id:'nl-ai-regulation',type:'regulation',title:'AI Act en digitale regelgeving',url:googleNews('AI Act MKB regelgeving Nederland OR Europa'),audience:'directie',market:'NL',keywords:['ai act','mkb','regelgeving','governance','compliance'],commercialWeight:.86,evidenceStrength:.82},
    {id:'nl-search-intent',type:'search',title:'Zoek- en vraagintentie',url:googleNews('"kennis borgen" OR "bedrijfskennis" OR "AI implementeren" MKB'),audience:'directie',market:'NL',keywords:['kennis','bedrijfskennis','ai','implementeren','mkb'],commercialWeight:.82,evidenceStrength:.68,searchDemand:.82},
    {id:'nl-market-shifts',type:'market',title:'MKB markt- en groeisignalen',url:googleNews('MKB groei personeel productiviteit digitalisering Nederland'),audience:'directie',market:'NL',keywords:['mkb','groei','personeel','productiviteit','digitalisering'],commercialWeight:.74,evidenceStrength:.74},
    {id:'competitor-positioning',type:'competitor',title:'Concurrent- en aanbodsignalen',url:googleNews('consultancy AI MKB digitalisering Nederland advies'),audience:'directie',market:'NL',keywords:['consultancy','advies','ai','mkb','digitalisering'],commercialWeight:.65,evidenceStrength:.65},
    {id:'customer-conversation',type:'customer',title:'Klantvragen, CRM en gesprekken',url:null,audience:'directie',market:'NL',keywords:['vraag','probleem','offerte','implementatie','groei'],commercialWeight:.95,evidenceStrength:.92,ingestMode:'native-event'},
    {id:'website-behaviour',type:'customer',title:'Websitegedrag en conversie',url:null,audience:'directie',market:'NL',keywords:['bezoek','klik','lead','conversie'],commercialWeight:.9,evidenceStrength:.88,ingestMode:'growth-datahub'}
  ];
}

export function opportunitySourcesFromEnv(raw=''){
  const base=defaultOpportunitySources(); if(!clean(raw))return base;
  try{const extra=JSON.parse(raw);if(!Array.isArray(extra))return base;const byId=new Map(base.map(item=>[item.id,item]));for(const item of extra)if(clean(item?.id))byId.set(clean(item.id),{...byId.get(clean(item.id)),...item,id:clean(item.id)});return [...byId.values()];}catch{return base}
}
