import {loadEntrepreneurData} from './modules/entrepreneur-intelligence.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const asList=x=>Array.isArray(x)?x:[];
const finite=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
const GOAL_DOMAIN_HINTS=Object.freeze({
  revenue_growth:['customer-market-behavior','public-procurement','international-trade','reputation-trust'],
  profit:['commodities','energy','supply-chain-logistics','labor-market','subsidies-tax'],
  cash:['subsidies-tax','commodities','public-procurement','energy'],
  automate:['ai-technology','labor-market','skills-capabilities'],
  valuation:['ma-investment','business-registers','reputation-trust'],
  exit:['ma-investment','standards','legal-regulation','skills-capabilities'],
  resilience:['cyber-threats','legal-regulation','geopolitics','supply-chain-logistics']
});
const risks=/RISK|CYBER|FRAUD|DISRUPTION|PHYSICAL|SUPPLY_RISK|THREAT/i;
const opportunities=/OPPORTUNITY|SEARCH_DEMAND|DEMAND_CHANGE|TECH_CHANGE|IP_CHANGE/i;
function signalKind(value){
  const s=String(value||'');
  return risks.test(s)?'risk':opportunities.test(s)?'opportunity':'development';
}
function safeDate(text){const ms=Date.parse(text||'');return Number.isFinite(ms)?ms:null;}
function trustworthyScope(packet){
  const expected=packet?.scope?.authenticatedTenant;
  return typeof expected==='string'&&expected.length>0&&expected!=='canonical'&&
    packet?.intelligence?.tenantId===expected&&
    packet?.scope?.tenantExposureApplied===true&&
    packet?.intelligence?.projectionScope==='canonical external baseline + authenticated tenant impact overlay';
}
export function selectTenantForesightSignals(packet,{metric='revenue_growth',mode='all',now=Date.now()}={}){
  if(!trustworthyScope(packet))return {status:'SCOPE_UNVERIFIED',items:[],total:0,source:'unverified'};
  const contextDomains=GOAL_DOMAIN_HINTS[metric]||[];
  const data=asList(packet.intelligence.signals);
  const included=data.filter(raw=>{
    if(raw?.tenant_specific_impact!==true||raw?.impact_status!=='SCORED')return false;
    const impacts=asList(raw.company_impacts);
    if(!impacts.some(x=>x?.status==='SCORED'&&finite(x?.impact_score)!==null))return false;
    const at=safeDate(raw.observed_at||raw.published_at);
    if(at===null||now-at>45*86400000||at>now+86400000)return false;
    const impact=finite(raw.impact_score);
    return impact!==null&&impact>=0&&impact<=100;
  }).map(item=>({
    key:String(item.signal_key||'').slice(0,100),
    label:String(item.title||'Ontwikkeling').slice(0,220),
    domain:String(item.domain_key||'').slice(0,100),
    kind:signalKind(item.signal_type),
    impact:finite(item.impact_score),
    observedAt:String(item.observed_at||item.published_at),
    deadline:String(item.deadline||''),
    source:String(item.source_key||'Externe bron').slice(0,100),
    impactCount:asList(item.company_impacts).filter(x=>x?.status==='SCORED').length,
    contextualHint:contextDomains.includes(item.domain_key),
    note:'Bedrijfsspecifiek beoordeelde impact; geen causale of kwantitatieve forecast'
  }));
  const matched=included.filter(x=>mode==='all'||x.kind===mode);
  matched.sort((a,b)=>Number(b.contextualHint)-Number(a.contextualHint)||b.impact-a.impact||Date.parse(b.observedAt)-Date.parse(a.observedAt));
  return {status:'TENANT_SCOPED',items:matched.slice(0,8),total:matched.length,source:'authenticated-entrepreneur-intelligence',selection:metric};
}
const fmtDate=value=>{
  const d=safeDate(value);return d===null?'—':new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d));
};
function markup({model,mode,status,error,metric}){
  const options=[['all','Alle ontwikkelingen'],['risk','Risico’s'],['opportunity','Kansen'],['development','Overig']].map(([id,label])=>'<option value="'+id+'"'+(mode===id?' selected':'')+'>'+label+'</option>').join('');
  const intro='<div class="pfs-driver-head"><div><span class="pfs-eyebrow">POWERHOUSE · CONTEXTUELE SIGNALEN</span><h4>Welke ontwikkelingen kunnen dit scenario beïnvloeden?</h4><p>Alleen reeds bedrijfsspecifiek gescoorde signalen uit de geauthenticeerde Powerhouse-projectie. Een impactscore is geen kanspercentage of prognose.</p></div>';
  const actions='<div class="pfs-driver-actions"><select data-pfs-driver-filter aria-label="Filter signalen">'+options+'</select><button type="button" data-pfs-driver-reload>'+(status==='idle'?'Laad signalen':'Vernieuwen')+'</button></div></div>';
  if(status==='idle')return intro+actions+'<p class="pfs-driver-state">Selecteer ‘Laad signalen’ voor actuele, tenantgebonden Powerhouse-context. Er wordt geen externe brondata als klantimpact aangenomen.</p>';
  if(status==='loading')return intro+actions+'<p class="pfs-driver-state" role="status">Geauthenticeerde signalen ophalen…</p>';
  if(status==='error')return intro+actions+'<p class="pfs-driver-state" role="alert">'+esc(error||'Bron niet beschikbaar; geen signalen weergegeven.')+'</p>';
  if(model.status==='SCOPE_UNVERIFIED')return intro+actions+'<p class="pfs-driver-state">Klantidentiteit of impactscope niet bevestigd. Er worden geen Powerhouse-signalen getoond.</p>';
  if(!model.items.length)return intro+actions+'<p class="pfs-driver-state">Geen recente bedrijfsspecifiek gescoorde signalen voor dit filter. Algemene marktontwikkelingen blijven beschikbaar in de Omgevingsradar.</p>';
  return intro+actions+'<div class="pfs-driver-cards">'+model.items.map(x=>
    '<article class="pfs-driver-card"><div><small>'+esc(x.domain)+' · '+esc(x.kind)+' · '+esc(fmtDate(x.observedAt))+'</small><strong>'+esc(x.label)+'</strong>'+
    '<p>'+esc(x.contextualHint?'Mogelijk relevant voor het gekozen doel; relatie nog beoordelen':'Ander bedrijfsdomein: mogelijke indirecte invloed')+'</p>'+
    '<span>Bron: '+esc(x.source)+' · '+x.impactCount+' bedrijfsspecifieke impactbeoordeling(en)</span></div>'+
    '<div class="pfs-driver-score"><b>'+x.impact+'/100</b><small>impactscore</small></div></article>').join('')+
    '</div><p class="pfs-driver-state">Status: '+model.total+' relevante impactbeoordelingen na bron- en versheidsfilter. Niet gebruikt als numerieke forecast-input.</p>'+
    '<button class="pfs-driver-radar" type="button" data-pfs-driver-radar>Onderbouwing in Omgevingsradar →</button>';
}
export function createForesightSignalDriverController({load=loadEntrepreneurData,openPage}={}){
  let packet=null,status='idle',error='',mode='all',activeHost=null,activeMetric='revenue_growth',generation=0;
  const render=(host=activeHost,metric=activeMetric)=>{
    if(!host)return null;activeHost=host;activeMetric=metric;
    const model=packet?selectTenantForesightSignals(packet,{metric,mode}):{status:'EMPTY',items:[],total:0};
    host.innerHTML=markup({model,mode,status,error,metric});
    host.querySelector('[data-pfs-driver-filter]')?.addEventListener('change',ev=>{mode=ev.target.value;render()});
    host.querySelector('[data-pfs-driver-radar]')?.addEventListener('click',()=>openPage?.('omgevingsradar'));
    host.querySelector('[data-pfs-driver-reload]')?.addEventListener('click',async()=>{
      if(status==='loading')return;
      const ticket=++generation;status='loading';error='';render();
      try{
        const result=await load();
        if(ticket!==generation)return;
        packet=result;status='loaded';render();
      }catch(err){
        if(ticket!==generation)return;
        packet=null;error=String(err?.message||'Geauthenticeerde bron tijdelijk niet beschikbaar.').slice(0,220);status='error';render();
      }
    });
    return model;
  };
  return Object.freeze({render});
}
