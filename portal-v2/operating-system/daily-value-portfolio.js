/**
 * Evidence-first Daily Value Portfolio presenter.
 * Decisions and values must originate from the tenant-scoped Brain runtime.
 * This layer neither invents value scores nor authorizes provider dispatch.
 */
const arr=x=>Array.isArray(x)?x:[];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x);
const finite=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const rank=x=>finite(x)?Number(x):Number.MAX_SAFE_INTEGER;
export function selectDailyValuePortfolio(runtime={}){
  const candidate=arr(runtime?.decisions?.items).filter(x=>x&&['NOW','NEXT'].includes(x.portfolioBucket));
  const unique=new Set();
  const items=candidate.filter(x=>{
    const id=String(x.id||'').trim();
    if(!id||unique.has(id))return false;
    unique.add(id);return true;
  }).sort((a,b)=>rank(a.rank)-rank(b.rank)||String(a.id).localeCompare(String(b.id)));
  const top=items.slice(0,3).map(x=>{
    const blocked=Boolean(x.blockedBy)||String(x.dependencyState||'').startsWith('BLOCKED')||x.dependencyState==='WAITING_FOR_DEPENDENCIES';
    const approval=['PROPOSED','PENDING_APPROVAL','AWAITING_DECISION'].includes(String(x.status||'').toUpperCase())||x.approval?.state==='PENDING';
    return Object.freeze({id:String(x.id),title:String(x.title||'Besluit zonder titel'),rank:finite(x.rank)?Number(x.rank):null,
      reasons:arr(x.reasons).map(String),expectedValue:finite(x.expectedValue)?Number(x.expectedValue):null,
      confidence:finite(x.confidence)?Number(x.confidence):null,
      evidenceIds:arr(x.evidenceIds||x.evidence_refs||x.sourceRefs),
      state:blocked?'BLOCKED':approval?'APPROVAL_REQUIRED':'READY',blockedBy:String(x.blockedBy||x.dependencyState||'')});
  });
  return Object.freeze({items:top,remaining:Math.max(0,items.length-top.length),source:'brain-operating-loop'});
}
export function renderDailyValuePortfolio(runtime={}){
  const portfolio=selectDailyValuePortfolio(runtime);
  const cards=portfolio.items.map((x,i)=>`<article class="company-decision-card" data-daily-priority="${esc(x.id)}"><div class="company-decision-head"><span class="company-bucket">${i+1}</span><strong>${esc(x.title)}</strong></div>
    <p>${esc(x.reasons.join(' · ')||'Onderbouwing beschikbaar in het besluit')}</p>
    <div class="company-decision-grid"><span><small>Verwachte waarde</small><b>${x.expectedValue===null?'Nog niet gekwantificeerd':money(x.expectedValue)}</b></span><span><small>Vertrouwen</small><b>${x.confidence===null?'Niet vastgesteld':Math.round(x.confidence*100)+'%'}</b></span><span><small>Uitvoerbaarheid</small><b>${x.state==='BLOCKED'?'Geblokkeerd':x.state==='APPROVAL_REQUIRED'?'Goedkeuring vereist':'Controleer actie'}</b></span></div>
    <p><small>${x.evidenceIds.length?'Bewijsreferenties: '+x.evidenceIds.length:'Bewijsstatus: raadpleeg gekoppeld besluit'}${x.blockedBy?' · '+esc(x.blockedBy):''}</small></p>
  </article>`).join('');
  return `<section class="company-daily-portfolio" aria-label="Wat verdient vandaag aandacht?" data-portfolio-source="brain-operating-loop">
    <div class="company-cockpit-head"><div><h3>Wat verdient vandaag aandacht?</h3><p>De drie hoogste prioriteiten uit het bestaande Brein. Geen voorbeeldscores of fictieve eurobedragen.</p></div></div>
    ${cards||'<p class="company-empty">Nog geen onderbouwde prioriteiten beschikbaar voor deze onderneming.</p>'}
    <p><small>${portfolio.remaining?portfolio.remaining+' aanvullende prioriteiten in de volledige besluitenlijst.':'Verwachtingen zijn geen gerealiseerde omzet.'} Scenariovergelijking vraagt gevalideerde aannames en bedrijfsdata.</small></p>
  </section>`;
}
