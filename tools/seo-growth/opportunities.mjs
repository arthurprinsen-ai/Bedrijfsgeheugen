import { scoreGrowthWindow } from './score.mjs';

export function proposeOpportunities(window={},registry={}){
  const out=[];const canonical=String(window.canonical||'');const entry=(registry.pages||[]).find(e=>e.route===canonical)||null;const score=scoreGrowthWindow(window);const imp=Number(window.impressions)||0,clicks=Number(window.clicks)||0,engaged=Number(window.engaged_views)||0,cta=Number(window.cta_clicks)||0,leads=Number(window.leads)||0,orders=Number(window.orders)||0;
  const ctr=imp?clicks/imp:0;const engage=clicks?engaged/clicks:0;const ctaRate=(engaged||clicks)?cta/(engaged||clicks):0;const leadRate=cta?leads/cta:0;const orderRate=leads?orders/leads:0;
  if(imp>=100&&ctr<0.025)out.push({type:'serp-ctr',canonical,allowed_actions:['title-meta'],reason:'high-impression-low-ctr',priority:imp*(0.025-ctr),confidence:score.confidence});
  if(clicks>=30&&engage<0.35)out.push({type:'intent-content-fit',canonical,allowed_actions:['content-gap','internal-link'],reason:'traffic-low-engagement',priority:clicks*(0.35-engage),confidence:score.confidence});
  if((engaged||clicks)>=20&&ctaRate<0.05)out.push({type:'conversion',canonical,allowed_actions:['cta-copy-position','internal-link'],reason:'engagement-low-cta',priority:(engaged||clicks)*(0.05-ctaRate),confidence:score.confidence});
  if(cta>=10&&leadRate<0.2)out.push({type:'lead-friction',canonical,allowed_actions:['cta-copy-position','evidence-gap'],reason:'cta-low-lead',priority:cta*(0.2-leadRate),confidence:score.confidence});
  if(leads>=5&&orderRate<0.15)out.push({type:'commercial-fit',canonical,allowed_actions:['evidence-gap','content-gap'],reason:'lead-low-order',priority:leads*(0.15-orderRate),confidence:score.confidence});
  if(Array.isArray(window.competing_canonicals)&&window.competing_canonicals.length>1)out.push({type:'cannibalization',canonical,allowed_actions:['cannibalization-proposal','internal-link'],reason:'multiple-canonicals-same-intent',priority:window.competing_canonicals.length,confidence:score.confidence});
  if(!out.length&&entry&&imp>=100)out.push({type:'observe',canonical,allowed_actions:[],reason:'no-material-bounded-opportunity',priority:0,confidence:score.confidence});
  return out.sort((a,b)=>b.priority-a.priority);
}
