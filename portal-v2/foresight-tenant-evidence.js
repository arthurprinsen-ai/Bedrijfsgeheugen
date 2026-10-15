// Read-only Powerhouse source overlay: independent company evidence, never a forecast.
const list=v=>Array.isArray(v)?v:[];
const clean=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const age=(v,now)=>{const t=Date.parse(v||'');return Number.isFinite(t)?now-t:Infinity};
const MATCH={
  revenue_growth:/commerc|sales|klant|marketing|omzet|markt|vraag|pricing|convers/i,
  profit:/financ|marge|kosten|inkoop|operati|efficien/i,
  cash:/cash|financ|debiteur|liquid|werkkapitaal|betaal/i,
  automate:/proces|automat|capaciteit|productiv|data|workflow|systemen/i,
  valuation:/waarde|finance|strategie|groei|overnam|invest/i,
  exit:/kennis|overdr|organisatie|juridisch|governance|document/i,
  resilience:/risico|continu|wet|security|cyber|privacy|compliance|leverancier/i
};
const stringFields=x=>[x?.domain_key,x?.signal_type,x?.title,x?.target_label,...list(x?.impact_dimensions)].filter(Boolean).join(' ');
const relevant=(x,metric)=>(MATCH[metric]||/$^/).test(stringFields(x));
const evidencePresent=v=>v!==null&&v!==undefined&&((typeof v==='string'&&v.trim().length>0)||(typeof v==='object'&&Object.keys(v).length>0));
const riskType=/RISK|CYBER|THREAT|DISRUPTION|FRAUD|LOSS|NEGATIVE/i;
const opportunityType=/OPPORTUNITY|DEMAND|GROWTH|POSITIVE|TECH_CHANGE|IP_CHANGE/i;
export function classifyTenantForesightSignal(signal={}){
 const raw=String(signal.signal_type||'')+' '+String(signal.direction||'');
 return riskType.test(raw)?'risk':opportunityType.test(raw)?'opportunity':'development';
}
const normalizeFilter=filter=>['all','risk','opportunity','development'].includes(filter)?filter:'all';

export function buildTenantForesightEvidence(packet,{metric='revenue_growth',kind='all',now=Date.now()}={}){
 const tenant=String(packet?.scope?.authenticatedTenant||'').trim();
 const intelligence=packet?.intelligence||{};
 if(!tenant||tenant!==String(intelligence.tenantId||'').trim())
   return {state:'TENANT_PROOF_MISSING',impacts:[],actions:[],external:[],sourceStats:null,heartbeat:'NOT_EVIDENCED'};
 const signals=list(intelligence.signals).filter(s=>s?.signal_key&&s.status!=='DISMISSED');
 const bySignal=new Map(signals.map(s=>[String(s.signal_key),s]));
 const selectedKind=normalizeFilter(kind);
 const impacts=list(intelligence.companyImpacts).filter(x=>
   x?.tenant_id===tenant&&x?.status==='SCORED'&&num(x.impact_score)!==null&&
   age(x.observed_at,now)>=0&&age(x.observed_at,now)<=90*86400000&&bySignal.has(String(x.signal_key))&&
   (selectedKind==='all'||classifyTenantForesightSignal(bySignal.get(String(x.signal_key)))===selectedKind)
 ).map(x=>{
   const signal=bySignal.get(String(x.signal_key));
   const signalAge=age(signal.observed_at||signal.published_at,now);
   return {
     id:String(x.impact_key||x.signal_key),
     kind:classifyTenantForesightSignal(signal),
     title:String(signal.title||'Extern signaal'),
     target:String(x.target_label||'Bedrijfssituatie'),
     rationale:String(x.rationale||'Bedrijfsspecifieke impact gescoord, toelichting ontbreekt'),
     score:Math.max(0,Math.min(100,num(x.impact_score))),
     observedAt:String(x.observed_at||''),
     source:String(signal.source_key||signal.source_observation_id||'Bron niet gespecificeerd'),
     sourceUrl:/^https:\/\//.test(String(signal.external_url||''))?String(signal.external_url):null,
     evidenceLinked:evidencePresent(x.evidence)&&evidencePresent(signal.evidence)&&signalAge>=0&&signalAge<=90*86400000,
     matched:relevant({...signal,...x},metric)
   };
 }).sort((a,b)=>Number(b.matched)-Number(a.matched)||b.score-a.score).slice(0,5);
 const actions=list(intelligence.actionCandidates).filter(x=>
   x?.tenant_id===tenant&&x?.tenant_specific===true&&['READY','MATERIALIZED','CANDIDATE'].includes(x.status)&&
   x?.title&&x?.signal_key&&bySignal.has(String(x.signal_key))
 ).map(x=>({title:String(x.title),state:String(x.status),evidence:evidencePresent(x.evidence),metricMatch:relevant({...bySignal.get(String(x.signal_key)),...x},metric)}))
   .sort((a,b)=>Number(b.metricMatch)-Number(a.metricMatch)).slice(0,3);
 const signalWithNoCompanyImpact=signals.filter(x=>
   x.impact_status!=='SCORED'&&(selectedKind==='all'||classifyTenantForesightSignal(x)===selectedKind)&&age(x.observed_at||x.published_at,now)>=0&&
   age(x.observed_at||x.published_at,now)<=30*86400000&&relevant(x,metric)
 ).slice(0,3).map(x=>({title:String(x.title||'Extern signaal'),source:String(x.source_key||'Externe bron')}));
 const catalog=list(intelligence.sourceCatalog);
 const observed=catalog.filter(x=>['CONNECTED','OBSERVED','LIVE'].includes(x?.availability_state)).length;
 return {
   state:'TENANT_AUTHENTICATED',
   tenant,kind:selectedKind,impacts,actions,external:signalWithNoCompanyImpact,
   sourceStats:{known:catalog.length,observed},
   heartbeat:'NOT_EVIDENCED',
   note:'Bron-signalen zijn geen causale invoer in de grafiek; alleen de klantgebonden historie bepaalt het rekenkundige trendpad.'
 };
}
export function renderTenantForesightEvidence(context,{status='loading',kind='all'}={}){
 const selected=normalizeFilter(kind);
 const options=[['all','Alle ontwikkelingen'],['risk','Risico’s'],['opportunity','Kansen'],['development','Overig']]
   .map(([id,label])=>'<option value="'+id+'"'+(id===selected?' selected':'')+'>'+label+'</option>').join('');
 const controls='<div class="pfs-source-controls"><label>Filter bedrijfsimpact <select data-pfs-evidence-filter>'+options+'</select></label>'+
   '<button type="button" data-pfs-evidence-refresh>Bronnen verversen</button></div>';
 if(status==='loading')return '<div class="pfs-sourcebox" role="status">'+controls+'Powerhouse-bronnen in de klantcontext worden gecontroleerd…</div>';
 if(!context||context.state!=='TENANT_AUTHENTICATED')return '<div class="pfs-sourcebox">'+controls+'De beveiligde Powerhouse-broncontext is niet beschikbaar. Er worden geen bedrijfsspecifieke signalen overgenomen.</div>';
 const item=x=>'<article class="pfs-sourceitem"><b>'+clean(x.title)+'</b><p>Bedrijfsonderdeel: '+clean(x.target)+' · impactscore '+clean(x.score)+'/100</p><p>'+clean(x.rationale).slice(0,300)+'</p><small>Bron '+clean(x.source)+' · '+clean(x.observedAt.slice(0,10))+' · '+(x.evidenceLinked?'Bronverwijzingen aanwezig (niet onafhankelijk gevalideerd)':'Bronbewijs onvoldoende voor een harde claim')+'</small></article>';
 const impact=context.impacts.length?context.impacts.map(item).join(''):'<p>Nog geen actuele, klantgebonden gescoorde signalen in deze context.</p>';
 const actions=context.actions.length?'<div class="pfs-sourceactions"><h5>Voorgestelde acties (niet uitgevoerd)</h5>'+context.actions.map(a=>'<p>'+clean(a.title)+' · '+clean(a.state)+'</p>').join('')+'</div>':'';
 const outside=context.external.length?'<details><summary>Extern relevant, bedrijfseffect nog onbekend ('+context.external.length+')</summary>'+context.external.map(s=>'<p>'+clean(s.title)+' · '+clean(s.source)+'</p>').join('')+'</details>':'';
 return '<section class="pfs-sourcebox" aria-label="Powerhouse bronbewijs">'+
  '<h4>Powerhouse-signalen die jouw bedrijf kunnen raken</h4>'+controls+'<p>'+context.sourceStats.observed+' van '+context.sourceStats.known+' bronmogelijkheden verbonden, waargenomen of live in de broncatalogus. Dit is geen claim dat ze voor deze klant allemaal actief zijn.</p>'+
  '<div class="pfs-sourcegrid">'+impact+'</div>'+actions+outside+
  '<p class="pfs-source-disclaimer">'+clean(context.note)+' Heartbeat-SLA en voorspelnauwkeurigheid zijn hier nog niet geverifieerd.</p></section>';
}
