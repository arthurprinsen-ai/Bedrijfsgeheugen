// Admin-only read model. All observations come from the existing authorized Brain
// projection; mentions of providers are NOT equivalent to direct provider health.
// No new scheduler, write authority, tenant crossing or autonomous deployment.
const SOURCES=Object.freeze([
  {id:'github',label:'GitHub · code & CI',pattern:/github|codeql|pull request|workflow|commit|merge|ci\b/i},
  {id:'supabase',label:'Supabase · data & runtime',pattern:/supabase|postgres|database|migration|edge function|cron\b/i},
  {id:'netlify',label:'Netlify · deployment',pattern:/netlify|deploy|site release|website release/i},
  {id:'notion',label:'Notion · kennis & borging',pattern:/notion|knowledge base|documentation|handboek/i}
]);
const list=value=>Array.isArray(value)?value:[];
const txt=value=>String(value??'');
const esc=value=>txt(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const at=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:0;};
const failure=e=>/fail|error|blocked|breach|drift|timeout/i.test(txt(e.status)+' '+txt(e.severity));
const learning=e=>/learning|writeback|memory|skill|prevention|regression/i.test([e.category,e.rawType,e.layer,e.title].join(' '));
const verifiedSignal=e=>/verified|proven|fulfilled|confirmed/i.test(txt(e.status));
const dateKey=value=>new Date(value).toISOString().slice(0,10);
const rate=(a,b)=>b>0?Math.round(1000*a/b)/10:null;
const fmt=n=>new Intl.NumberFormat('nl-NL').format(n);
const ago=(time,now)=>!time?'Geen observatie':now-time<0?'Tijdstempel in toekomst':now-time<=7200000?'Binnen 2 uur':'Ouder dan 2 uur';
const stableId=e=>[e.id,e.occurredAt,e.title,e.status].join('|');

export function deriveAgentImprovement(observability={},now=Date.now()){
  const seen=new Set();
  const events=list(observability.events).filter(e=>{
    if(!e||!at(e.occurredAt))return false;
    const key=stableId(e);if(seen.has(key))return false;seen.add(key);return true;
  });
  const days=Array.from({length:14},(_,i)=>{
    const day=dateKey(now-(13-i)*86400000);
    return {day,events:0,failures:0,learnings:0,verifiedSignals:0};
  });
  const lookup=new Map(days.map(d=>[d.day,d]));
  const sources=SOURCES.map(s=>({id:s.id,label:s.label,eventCount:0,proofLinks:0,lastObserved:0,kind:'Afgeleid uit Brain-events'}));
  const agents=new Map();const fingerprints=new Map();
  let totalFailure=0,totalLearnings=0,totalVerified=0;
  for(const e of events){
    const timestamp=at(e.occurredAt),d=lookup.get(dateKey(timestamp));
    const bad=failure(e),learn=learning(e),v=verifiedSignal(e);
    if(bad)totalFailure++;if(learn)totalLearnings++;if(v)totalVerified++;
    if(d){d.events++;if(bad)d.failures++;if(learn)d.learnings++;if(v)d.verifiedSignals++;}
    const origin=[e.source,e.layer,e.rawType,e.title].join(' ');
    for(let i=0;i<SOURCES.length;i++)if(SOURCES[i].pattern.test(origin)){
      const s=sources[i];s.eventCount++;s.lastObserved=Math.max(s.lastObserved,timestamp);
      if(e.referenceUrl&&/^https:\/\//.test(e.referenceUrl))s.proofLinks++;
    }
    const actor=txt(e.actor||'Onbekend').slice(0,90);
    const a=agents.get(actor)||{actor,events:0,failures:0,learnings:0,verifiedSignals:0,lastObserved:0};
    a.events++;if(bad)a.failures++;if(learn)a.learnings++;if(v)a.verifiedSignals++;
    a.lastObserved=Math.max(a.lastObserved,timestamp);agents.set(actor,a);
    if(bad&&e.fingerprint){
      const fingerprint=txt(e.fingerprint).slice(0,150);
      const item=fingerprints.get(fingerprint)||{fingerprint,count:0,lastObserved:0};
      item.count++;item.lastObserved=Math.max(item.lastObserved,timestamp);fingerprints.set(fingerprint,item);
    }
  }
  const recent=days.slice(7),previous=days.slice(0,7);
  const sum=(rows,key)=>rows.reduce((n,row)=>n+row[key],0);
  const recentCount=sum(recent,'events'),priorCount=sum(previous,'events');
  const recentFailures=sum(recent,'failures'),priorFailures=sum(previous,'failures');
  const loops=list(observability.loops);
  const economics=observability.economics||{};
  const realized=Number.isFinite(economics.realizedValue)?economics.realizedValue:null;
  return {
    days,sources,agents:[...agents.values()].sort((a,b)=>b.events-a.events).slice(0,12),
    repeatFailures:[...fingerprints.values()].filter(x=>x.count>=2).sort((a,b)=>b.count-a.count).slice(0,8),
    counts:{events:events.length,failures:totalFailure,learnings:totalLearnings,verifiedSignals:totalVerified,
      loops:loops.length,completeLoops:loops.filter(l=>l?.complete===true).length},
    comparison:{recentCount,priorCount,recentFailureRate:rate(recentFailures,recentCount),priorFailureRate:rate(priorFailures,priorCount)},
    realizedValue:realized,updatedAt:at(observability.updatedAt),
    modelVersion:'agent-improvement-observation-v1'
  };
}

function lineChart(days){
  if(!days.some(d=>d.events))return '<p class="poc-note">Geen gedateerde events in de laatste 14 UTC-dagen. Er wordt geen trend verzonnen.</p>';
  const max=Math.max(1,...days.map(d=>d.events));
  const points=key=>days.map((d,i)=>(30+i*39)+','+(126-Math.round(d[key]/max*104))).join(' ');
  return '<svg viewBox="0 0 578 170" role="img" aria-label="Dagelijkse Brain-events en foutsignalen in de laatste veertien dagen" style="width:100%;max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">'
    +'<line x1="30" y1="126" x2="545" y2="126" stroke="#8793a7" stroke-width="1"/>'
    +'<text x="5" y="24" font-size="10" fill="currentColor">'+fmt(max)+'</text>'
    +'<text x="9" y="129" font-size="10" fill="currentColor">0</text>'
    +'<polyline points="'+points('events')+'" fill="none" stroke="#2563eb" stroke-width="2.5"/>'
    +'<polyline points="'+points('failures')+'" fill="none" stroke="#bb4b26" stroke-width="2"/>'
    +'<text x="30" y="152" font-size="11" fill="currentColor">'+esc(days[0].day)+'</text>'
    +'<text x="455" y="152" font-size="11" fill="currentColor">'+esc(days[13].day)+'</text>'
    +'</svg><p class="poc-note">Blauw: gebeurtenissen · oranje: foutsignalen. Beide aantallen uit dezelfde beperkte runtimeprojectie; geen onafhankelijke providerstatus.</p>';
}
function empty(message){return '<p class="poc-note">'+esc(message)+'</p>';}
function countCard(label,value,sub){return '<article class="poc-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(sub)+'</span></article>';}
function percentage(value){return value==null?'—':value.toFixed(1)+'%';}
export function agentImprovementMarkup(observability={},now=Date.now()){
  const data=deriveAgentImprovement(observability,now),counts=data.counts;
  const sources=data.sources.map(s=>'<article class="poc-panel"><h4>'+esc(s.label)+'</h4><div class="poc-kpis compact">'
    +countCard('Brain-verwijzingen',fmt(s.eventCount),'geen directe API-controle')
    +countCard('Bewijslinks',fmt(s.proofLinks),'aan events gekoppeld')+'</div>'
    +'<p class="poc-note">Laatste vermelding: '+esc(s.lastObserved?new Date(s.lastObserved).toLocaleString('nl-NL'):'niet waargenomen')+'. '+esc(ago(s.lastObserved,now))+'. Providergezondheid niet geverifieerd.</p></article>').join('');
  const agentRows=data.agents.map(a=>'<tr><td><b>'+esc(a.actor)+'</b></td><td>'+fmt(a.events)+'</td><td>'+fmt(a.failures)+'</td><td>'+fmt(a.learnings)+'</td><td>'+fmt(a.verifiedSignals)+'</td></tr>').join('');
  const repeats=data.repeatFailures.map(e=>'<li><b>'+esc(e.fingerprint)+'</b> · '+fmt(e.count)+' foutsignalen. Actie: raadpleeg canoniek incident, verifieer oorzaak en borg regressietest.</li>').join('');
  const missing=data.sources.filter(s=>!s.eventCount).map(s=>esc(s.label)).join(', ');
  const value=data.realizedValue==null?'Niet meetbaar in deze projectie':new Intl.NumberFormat('nl-NL',{style:'currency',currency:observability.economics?.currency||'EUR'}).format(data.realizedValue);
  return '<section class="poc-panel" data-agent-improvement="v1"><div class="poc-panelhead"><h4>Agent Intelligence · collectief verbeteren</h4><span>'+esc(data.modelVersion)+'</span></div>'
    +'<p class="poc-note">Leesmodel op bestaande beveiligde Brain-evidence. Meet activiteit, afwijkingen, learning-signalen en brondekking. Een vermelding is géén onafhankelijke API-readback, geslaagde verbetering of klantresultaat.</p>'
    +'<div class="poc-kpis">'+countCard('Waargenomen events',fmt(counts.events),'met tijdstempel')+countCard('Foutsignalen',fmt(counts.failures),'geen unieke incidenten')+countCard('Leersignalen',fmt(counts.learnings),'geen bewezen effect')+countCard('Statussignalen bewezen',fmt(counts.verifiedSignals),'volgens bronrecord')+countCard('Lussen compleet',fmt(counts.completeLoops)+' / '+fmt(counts.loops),'volgens loopprojectie')+countCard('Gerealiseerde waarde',value,'alleen als bronwaarde bestaat')+'</div></section>'
    +'<div class="poc-grid2"><section class="poc-panel"><h4>14-daagse activiteit</h4>'+lineChart(data.days)+'</section><section class="poc-panel"><h4>7 dagen versus vorige 7 dagen</h4>'
    +'<div class="poc-kpis compact">'+countCard('Nu waargenomen',fmt(data.comparison.recentCount),'events')+countCard('Vorige periode',fmt(data.comparison.priorCount),'events')+countCard('Foutsignaalratio nu',percentage(data.comparison.recentFailureRate),'foutstatus / event')+countCard('Foutsignaalratio eerder',percentage(data.comparison.priorFailureRate),'bij 0 events onbekend')+'</div>'
    +'<p class="poc-note">Dit is een observatie, geen causaal of statistisch bewijs dat de agents slimmer zijn geworden.</p></section></div>'
    +'<section class="poc-panel"><h4>Vier bronperspectieven · GitHub, Supabase, Netlify en Notion</h4><div class="poc-grid2">'+sources+'</div><p class="poc-note">Echte brondekking vereist server-side provider-readbacks met tijdstempel, provider-ID, bron-SHA en autorisatie. Deze grafiek gebruikt alleen gebeurtenissen die al in Brain zijn opgeslagen.</p></section>'
    +'<div class="poc-grid2"><section class="poc-panel"><h4>Agentbijdragen (geen ranglijst van kwaliteit)</h4>'
    +(agentRows?'<div class="poc-tablewrap"><table class="poc-table"><thead><tr><th>Agent</th><th>Events</th><th>Fouten</th><th>Learning</th><th>Bevestigingssignalen</th></tr></thead><tbody>'+agentRows+'</tbody></table></div>':empty('Geen agentactiviteit vastgelegd.'))
    +'</section><section class="poc-panel"><h4>Prioritaire herstel- en leerhypothesen</h4>'
    +(repeats?'<ol>'+repeats+'</ol>':empty('Geen herhaalde fingerprint zichtbaar; dit bewijst niet dat herhalingen ontbreken.'))
    +(missing?'<p class="poc-note">Bronnen zonder melding: '+missing+'. Onderzoek de bestaande evidence-ingest; voeg geen tweede scheduler toe.</p>':'')
    +'<p class="poc-note">Bruikbare werkwijze: detecteer → groepeer op fingerprint → raadpleeg bestaande skills → maak veilig voorstel → test in preview → onafhankelijke productie-readback → registreer uitkomst. Promotie of rollback uitsluitend via bestaande bevoegdheden.</p></section></div>'
    +'<section class="poc-panel"><h4>Beslismodellen voor de bestaande agents</h4><p class="poc-note"><b>Prioriteitsmodel:</b> verwacht meetbare klantimpact × bewijsbetrouwbaarheid × urgentie ÷ kosten en risico. Zonder betrouwbare inputs géén score. <b>Leermodel:</b> kandidaat → baseline → gecontroleerde A/B of holdout → effectmeting → behouden of terugdraaien → skill/incidentwriteback. <b>Preventiemodel:</b> terugkerende root cause → regressietest → foutdaling na release. De grafieken zijn read-only en nemen geen ongeautoriseerde besluiten.</p></section>';
}
