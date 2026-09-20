const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));

export const TRUST_STATES = Object.freeze({
  verified:{label:'Geverifieerd',description:'Deze uitkomst heeft aantoonbaar verificatie- of outcomebewijs.'},
  grounded:{label:'Brongebonden',description:'Deze uitkomst is gebaseerd op herleidbare klant- of brondata.'},
  derived:{label:'Afgeleid',description:'Deze uitkomst is berekend of afgeleid uit beschikbare gegevens.'},
  insufficient_evidence:{label:'Onvoldoende bewijs',description:'Powerhouse heeft te weinig bewijs om dit betrouwbaar als conclusie te presenteren.'},
  unverified:{label:'Niet onafhankelijk geverifieerd',description:'De broncontext is bekend, maar de inhoud is nog niet onafhankelijk geverifieerd.'}
});

const arr = value => Array.isArray(value) ? value : [];
const fmtDate = value => { if(!value) return 'Onbekend'; const d=new Date(value); return Number.isNaN(d.valueOf()) ? String(value) : d.toLocaleString('nl-NL',{dateStyle:'medium',timeStyle:'short'}); };

export function buildPageAssurance({pageId,state={}}={}){
  const runtime=state?.portal?.runtime||{};
  const sources=arr(runtime?.sources?.items);
  const healthy=sources.filter(item=>item?.healthy!==false);
  const updatedAt=runtime?.sources?.updatedAt||runtime?.observability?.updatedAt||'';
  const outcomes=arr(runtime?.outcomes?.items);
  const verified=outcomes.some(item=>item?.healthy===true||String(item?.status).toLowerCase()==='ok');
  const hasCustomerState=Boolean(state?.portal&&Object.keys(state.portal).some(key=>key!=='runtime'));
  const hasRuntime=Boolean(sources.length||arr(runtime?.audit?.items).length||arr(runtime?.brain?.items).length);
  let status='insufficient_evidence';
  if(pageId==='outcomes-evidence'&&verified) status='verified';
  else if(hasRuntime&&healthy.length) status='grounded';
  else if(hasCustomerState) status='derived';
  const uncertainty=[];
  if(!sources.length) uncertainty.push('Geen actuele bronstatus beschikbaar.');
  if(sources.length&&healthy.length<sources.length) uncertainty.push(String(sources.length-healthy.length)+' bron(nen) vraagt aandacht.');
  if(!updatedAt) uncertainty.push('Actualiteit van runtime-bewijs is niet vastgesteld.');
  if(!hasCustomerState&&!hasRuntime) uncertainty.push('Nog onvoldoende klant- of runtimegegevens voor een onderbouwde conclusie.');
  return {pageId,status,statusLabel:TRUST_STATES[status].label,description:TRUST_STATES[status].description,sourceCount:sources.length,healthySourceCount:healthy.length,updatedAt,provenance:hasRuntime?'Canonieke Powerhouse runtime/evidence-projectie':hasCustomerState?'Tenantgebonden klantstate':'Geen bewezen broncontext',uncertainty};
}

export function normalizeAnswerAssurance(assurance={}){
  const status=TRUST_STATES[assurance?.status]?assurance.status:'unverified';
  return {status,statusLabel:TRUST_STATES[status].label,description:TRUST_STATES[status].description,source:String(assurance?.source||'Bedrijfsgeheugen'),sourceUpdatedAt:String(assurance?.sourceUpdatedAt||''),evidencePolicy:String(assurance?.evidencePolicy||''),claimVerification:String(assurance?.claimVerification||'not_independently_verified'),limitations:arr(assurance?.limitations).map(String)};
}

export function renderAnswerAssurance(assurance={}){
  const a=normalizeAnswerAssurance(assurance);
  const limits=a.limitations.length?'<ul>'+a.limitations.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Geen aanvullende beperking geregistreerd.</p>';
  return '<aside class="ta-answer-proof" data-trust-status="'+esc(a.status)+'"><div class="ta-answer-head"><strong>'+esc(a.statusLabel)+'</strong><span>'+esc(a.source)+'</span></div><p>'+esc(a.description)+'</p>'+(a.sourceUpdatedAt?'<small>Bron bijgewerkt: '+esc(fmtDate(a.sourceUpdatedAt))+'</small>':'')+'<details><summary>Waarom kan ik dit vertrouwen?</summary><p><b>Bewijsbeleid:</b> '+esc(a.evidencePolicy||'Niet opgegeven')+'</p><p><b>Claimcontrole:</b> '+esc(a.claimVerification)+'</p>'+limits+'</details></aside>';
}

export function mountTrustedAdvisorAssurance(root,{pageId='overzicht',state={},openPage}={}){
  if(!root) return ()=>{};
  root.querySelector('[data-trusted-advisor-assurance]')?.remove();
  const m=buildPageAssurance({pageId,state});
  const section=document.createElement('section');
  section.className='ta-assurance'; section.dataset.trustedAdvisorAssurance='true'; section.dataset.trustStatus=m.status;
  section.innerHTML='<div class="ta-summary"><div><span class="ta-kicker">Trusted Advisor</span><h3>'+esc(m.statusLabel)+'</h3><p>'+esc(m.description)+'</p></div><button type="button" class="ta-why" data-ta-toggle>Waarom vertrouwen?</button></div><div class="ta-detail" data-ta-detail hidden><div class="ta-grid"><article><small>Herkomst</small><strong>'+esc(m.provenance)+'</strong></article><article><small>Bronnen</small><strong>'+(m.sourceCount?m.healthySourceCount+'/'+m.sourceCount+' gezond':'Niet bewezen')+'</strong></article><article><small>Actualiteit</small><strong>'+esc(fmtDate(m.updatedAt))+'</strong></article><article><small>Status</small><strong>'+esc(m.statusLabel)+'</strong></article></div><div class="ta-gaps"><b>Wat weet Powerhouse nog niet zeker?</b>'+(m.uncertainty.length?'<ul>'+m.uncertainty.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Geen open evidence-gap voor deze status geregistreerd.</p>')+'</div><div class="ta-links"><button data-ta-page="bronnenstatus">Bronnen controleren →</button><button data-ta-page="rekenwijze">Rekenwijze →</button><button data-ta-page="audittrail">Audittrail →</button><button data-ta-page="outcomes-evidence">Outcomes & bewijs →</button></div><p class="ta-rule">Een hypothese mag nooit als feit worden gepresenteerd. Ontbrekend bewijs blijft zichtbaar en blokkeert stellige conclusies.</p></div>';
  root.prepend(section);
  const detail=section.querySelector('[data-ta-detail]');
  section.querySelector('[data-ta-toggle]')?.addEventListener('click',()=>{detail.hidden=!detail.hidden;});
  section.querySelectorAll('[data-ta-page]').forEach(btn=>btn.addEventListener('click',()=>openPage?.(btn.dataset.taPage)));
  return ()=>section.remove();
}