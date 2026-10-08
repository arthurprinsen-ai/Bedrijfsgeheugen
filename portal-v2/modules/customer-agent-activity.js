// Customer-only read model: one authenticated tenant projection, no operator telemetry.
// This module never queries the admin observability endpoint or an unscoped table.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const array = value => Array.isArray(value) ? value : [];
const dateOf = value => { const n=Date.parse(value || ''); return Number.isFinite(n) ? n : 0; };
const short = (value, max=110) => String(value ?? '').slice(0,max);
const stamp = value => { if(!dateOf(value))return 'Geen tijd geregistreerd'; try{return new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}catch{return 'Onbekend';} };
const errorStatus = value => /fail|error|block|denied|drift|expired/i.test(String(value ?? ''));
const verifiedStatus = value => /verified|proven|fulfilled|delivered|confirmed/i.test(String(value ?? ''));
const tone = value => errorStatus(value) ? 'bad' : verifiedStatus(value) ? 'good' : /open|pending|queue|waiting|retry|running|in.progress/i.test(String(value ?? '')) ? 'warn' : 'neutral';

// Pure, side-effect-free projection so fixture tests can verify that untrusted data
// is never mistaken for verified delivery and no admin fields pass to the browser view.
export function projectCustomerActivity(projection={}) {
  const raw=[...array(projection.records),...array(projection.executiveCockpit?.activityTimeline)];
  const seen=new Set();
  const events=raw.map((r,index)=>{
    const status=short(r.status || r.state || r.conclusion || 'UNKNOWN',42);
    const time=short(r.occurredAt || r.observedAt || r.recordedAt || r.updatedAt || r.storedAt,50);
    const id=short(r.recordId || r.record_id || r.id || r.correlationId || r.subjectId || index,120);
    return {
      id,time,status,
      title:short(r.title || r.type || r.record_type || r.eventType || r.subjectId || 'Activiteit'),
      actor:short((typeof r.actor==='string' ? r.actor : r.actor?.name) || r.actorId || r.ownerId || 'AI / Bedrijfsgeheugen',70),
      source:short(r.source || r.component || r.platform || 'Bedrijfsgeheugen',70),
      verified:r.verified===true || (verifiedStatus(status) && r.verified!==false),
      type:short(r.type || r.record_type || r.eventType || ''),
      result:short(r.result?.status || '',42)
    };
  }).filter(e=>{const key=[e.id,e.time,e.status].join('|');if(seen.has(key))return false;seen.add(key);return true;})
    .sort((a,b)=>dateOf(b.time)-dateOf(a.time)).slice(0,80);
  const components=array(projection.integrationHealth?.components).map(c=>({
    label:short(c.label || c.name || c.component || c.platform || 'Gegevensbron',90),
    state:c.healthy===true?'connected':c.healthy===false?'attention':'unknown',
    seen:short(c.lastSeenAt || c.observedAt || '',50)
  })).slice(0,30);
  const loops=array(projection.wholeBrainLoops);
  const evidenceTime=events.find(e=>dateOf(e.time))?.time || '';
  return {
    events,components, evidenceTime,
    verified:events.filter(e=>e.verified).length,
    blocked:events.filter(e=>errorStatus(e.status)).length,
    loops:{observed:loops.length,complete:loops.filter(l=>l.complete===true).length}
  };
}

let activeCustomerTimer=null;
export function mountCustomerAgentActivity(container,{stateClient,fetchImpl=globalThis.fetch}={}) {
  if(activeCustomerTimer!==null){clearInterval(activeCustomerTimer);activeCustomerTimer=null;}
  const root=document.createElement('section');root.className='poc bg-customer-activity';container.replaceChildren(root);
  let working=false;let last=null;let lastSuccess=0;
  const isVisible=()=>root.isConnected && root.closest('#portalView')?.classList.contains('open') && root.closest('#portalView')?.dataset.pageId==='agentstatus';
  const notice=(heading,body)=>{root.innerHTML=`<section class="poc-panel" role="status"><h3>${esc(heading)}</h3><p>${esc(body)}</p></section>`;};
  const card=(label,value,caption)=>`<article class="poc-kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(caption)}</span></article>`;
  const render=()=>{
    if(!last){notice('Nog geen controleerbare AI-activiteiten','Zodra de beveiligde bedrijfskoppeling gegevens teruggeeft, verschijnen de activiteiten hier. Er worden geen voorbeeldresultaten getoond.');return;}
    const stale=Date.now()-lastSuccess>120000 || !dateOf(last.evidenceTime) || Date.now()-dateOf(last.evidenceTime)>3600000;
    root.innerHTML=`<header class="poc-head"><div><span>Agenta · jouw bedrijf</span><h3>Wat Bedrijfsgeheugen met jouw data doet</h3><p>Bekijk welke bronnen zijn waargenomen, wat de AI onderzoekt en welke acties daadwerkelijk zijn bewezen. Alleen gegevens uit jouw beveiligde bedrijfsomgeving.</p></div><div class="poc-live"><i style="background:${stale?'#d69a28':'#13a66b'}"></i><b>${stale?'Bewijs niet actueel':'Recent bewijs aanwezig'}</b><small>Laatste activiteit: ${esc(stamp(last.evidenceTime))}</small></div></header>
    <div class="poc-kpis">${card('Vastgelegde activiteiten',last.events.length,'maximaal 80 recente')}${card('Met uitvoeringsbewijs',last.verified,'geen concepten meegeteld')}${card('Blokkades',last.blocked,'op basis van bronstatus')}${card('Geobserveerde bronnen',last.components.length,'niet per definitie verbonden')}${card('Gevolgde AI-lussen',last.loops.observed,'vastgelegd')}${card('Voltooide AI-lussen',last.loops.complete,'bronstatus complete')}</div>
    <section class="poc-panel"><div class="poc-panelhead"><h4>Jouw gegevensbronnen</h4><span>Controle op basis van bronobservaties</span></div>
      ${last.components.length?last.components.map(c=>`<article class="poc-component"><div><b>${esc(c.label)}</b><small>Laatst gezien: ${esc(stamp(c.seen))}</small></div><span class="poc-badge ${c.state==='attention'?'bad':c.state==='connected'&&dateOf(c.seen)&&Date.now()-dateOf(c.seen)<3600000?'good':'neutral'}">${c.state==='attention'?'Aandacht':c.state==='connected'?'Geregistreerd':'Onbekend'}</span></article>`).join(''):'<p>Er zijn nog geen geverifieerde bronobservaties beschikbaar.</p>'}
    </section>
    <section class="poc-panel"><div class="poc-panelhead"><h4>Wat de agents hebben gedaan</h4><span>Automatische controle circa iedere 30 seconden</span></div>
      ${last.events.length?`<div class="poc-tablewrap"><table class="poc-table"><thead><tr><th>Tijd</th><th>Stap</th><th>Uitvoerder</th><th>Bron</th><th>Bewijsstatus</th></tr></thead><tbody>${last.events.map(e=>`<tr><td>${esc(stamp(e.time))}</td><td><b>${esc(e.title)}</b></td><td>${esc(e.actor)}</td><td>${esc(e.source)}</td><td><span class="poc-badge ${tone(e.status)}">${esc(e.verified?'Uitvoering bewezen':e.status)}</span></td></tr>`).join('')}</tbody></table></div>`:'<p>Geen activiteiten beschikbaar voor deze bedrijfsomgeving.</p>'}
    </section>
    <p class="poc-note">Een advies, concept of uitgevoerde interne stap is niet hetzelfde als een verzonden bericht of gerealiseerd resultaat. Ontbreekt onafhankelijk bewijs, dan wordt geen succesvolle uitvoering geclaimd. Dit scherm bevat geen interne ontwikkel- of marketingadministratie.</p>`;
  };
  async function refresh(){
    if(working)return;
    const snapshot=stateClient?.getSnapshot?.();
    if(snapshot?.mode!=='authenticated'||stateClient?.isDemo?.()){
      last=null;notice('Beveiligd klantoverzicht','Log in met je eigen bedrijfsaccount. In de demo worden geen echte AI-activiteiten weergegeven.');return;
    }
    working=true;
    try{
      const auth=await stateClient.authHeaders?.();
      if(!auth?.authorization){last=null;notice('Inloggen vereist','Een geldige sessie is nodig voor het bekijken van jouw activiteiten.');return;}
      const response=await fetchImpl('/api/brain-operating-loop',{headers:{...auth,accept:'application/json'},credentials:'same-origin',cache:'no-store'});
      if(response.status===401||response.status===403){last=null;notice('Geen toegang','Je sessie is verlopen of heeft geen toegang tot deze bedrijfsgegevens.');return;}
      if(!response.ok)throw new Error('RUNTIME_NOT_AVAILABLE');
      last=projectCustomerActivity(await response.json());lastSuccess=Date.now();render();
    }catch{if(last){render();root.insertAdjacentHTML('afterbegin','<p class="poc-note" role="alert">Vernieuwen mislukt. Laatst ontvangen gegevens worden getoond als historische informatie.</p>');}else notice('Live gegevens tijdelijk niet beschikbaar','De beveiligde runtime kon niet worden gelezen. Er worden geen resultaten verzonnen.');}
    finally{working=false;}
  }
  notice('Beveiligde activiteiten laden','Gegevens worden uitsluitend uit je eigen bedrijfsomgeving opgehaald.');
  refresh();
  activeCustomerTimer=setInterval(()=>{if(!root.isConnected){clearInterval(activeCustomerTimer);activeCustomerTimer=null;return;}if(isVisible()&&document.visibilityState!=='hidden')refresh();},30000);
  return {refresh,destroy(){if(activeCustomerTimer!==null)clearInterval(activeCustomerTimer);activeCustomerTimer=null;}};
}
