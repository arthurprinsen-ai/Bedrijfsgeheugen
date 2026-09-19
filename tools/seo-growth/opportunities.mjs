import { scoreGrowthWindow } from './score.mjs';

function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}
function intentWeight(v){
  const x=String(v||'').toLowerCase();
  if(x==='transactional')return 1;
  if(x==='commercial')return .85;
  if(x==='navigational')return .45;
  return .3;
}

export function proposeOpportunities(window={},registry={}){
  const out=[];const canonical=String(window.canonical||'');const entry=(registry.pages||[]).find(e=>e.route===canonical)||null;const score=scoreGrowthWindow(window);const imp=Number(window.impressions)||0,clicks=Number(window.clicks)||0,engaged=Number(window.engaged_views)||0,cta=Number(window.cta_clicks)||0,leads=Number(window.leads)||0,orders=Number(window.orders)||0;
  const ctr=imp?clicks/imp:0;const engage=clicks?engaged/clicks:0;const ctaRate=(engaged||clicks)?cta/(engaged||clicks):0;const leadRate=cta?leads/cta:0;const orderRate=leads?orders/leads:0;
  const position=Number(window.position??window.avg_position);const lowRank=Number.isFinite(position)&&position>10;
  if(imp>=100&&ctr<0.025){if(lowRank)out.push({type:'ranking',canonical,allowed_actions:['content-gap','internal-link','keyword-cluster-expansion'],reason:'high-impression-low-position',priority:imp*(0.025-ctr),confidence:score.confidence,position});else out.push({type:'serp-ctr',canonical,allowed_actions:['title-meta'],reason:'high-impression-low-ctr',priority:imp*(0.025-ctr),confidence:score.confidence});}
  if(clicks>=30&&engage<0.35)out.push({type:'intent-content-fit',canonical,allowed_actions:['content-gap','internal-link'],reason:'traffic-low-engagement',priority:clicks*(0.35-engage),confidence:score.confidence});
  if((engaged||clicks)>=20&&ctaRate<0.05)out.push({type:'conversion',canonical,allowed_actions:['cta-copy-position','internal-link'],reason:'engagement-low-cta',priority:(engaged||clicks)*(0.05-ctaRate),confidence:score.confidence});
  if(cta>=10&&leadRate<0.2)out.push({type:'lead-friction',canonical,allowed_actions:['cta-copy-position','evidence-gap'],reason:'cta-low-lead',priority:cta*(0.2-leadRate),confidence:score.confidence});
  if(leads>=5&&orderRate<0.15)out.push({type:'commercial-fit',canonical,allowed_actions:['evidence-gap','content-gap'],reason:'lead-low-order',priority:leads*(0.15-orderRate),confidence:score.confidence});
  if(Array.isArray(window.competing_canonicals)&&window.competing_canonicals.length>1)out.push({type:'cannibalization',canonical,allowed_actions:['cannibalization-proposal','internal-link'],reason:'multiple-canonicals-same-intent',priority:window.competing_canonicals.length,confidence:score.confidence});

  const volume=n(window.search_volume);const cpc=n(window.cpc);const trend=n(window.search_trend);const marketIntent=window.search_intent||window.intent;
  if(volume>0||cpc>0||trend>0){
    const commercial=intentWeight(marketIntent);
    const marketPriority=(Math.log10(volume+1)*25)+(Math.log10(cpc+1)*18)+(Math.max(-100,Math.min(300,trend))/20)+(commercial*25);
    if(entry){
      const owned=entry.role==='money'||entry.role==='pillar';
      out.push({
        type:owned?'commercial-search-demand':'search-demand',
        canonical,
        allowed_actions:owned?['internal-link','content-gap','evidence-gap']:['internal-link','supporting-blog-opportunity'],
        reason:owned?'existing-intent-owner-first':'mapped-search-demand',
        priority:marketPriority,
        confidence:Math.max(score.confidence,Number(window.market_confidence)||0),
        search_volume:volume,
        cpc,
        search_trend:trend,
        search_intent:marketIntent||'unknown',
        content_creation:owned?'blocked-unless-distinct-intent-gap':'support-only'
      });
    }else if(window.query){
      out.push({
        type:'discovery-search-demand',
        canonical,
        allowed_actions:['supporting-blog-opportunity'],
        reason:'unowned-search-intent-requires-mapping-before-content',
        priority:marketPriority,
        confidence:Number(window.market_confidence)||0,
        query:String(window.query),
        search_volume:volume,
        cpc,
        search_trend:trend,
        search_intent:marketIntent||'unknown',
        content_creation:'candidate-only-after-cannibalization-check'
      });
    }
  }

  if(!out.length&&entry&&imp>=100)out.push({type:'observe',canonical,allowed_actions:[],reason:'no-material-bounded-opportunity',priority:0,confidence:score.confidence});
  return out.sort((a,b)=>b.priority-a.priority);
}
