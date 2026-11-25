// Beheer-tabel "oud versus nieuw" voor CRO/SEO-wijzigingen. Alleen weergave van het register;
// geen zekerheid zonder steekproef en geen verschil zonder meting ("onbekend is geen nul").
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const num=v=>{const n=Number(v);return v!==null&&v!==undefined&&v!==''&&Number.isFinite(n)?n:null;};
const when=v=>{const t=Date.parse(v||'');if(!Number.isFinite(t))return '—';try{return new Intl.DateTimeFormat('nl-NL',{dateStyle:'short'}).format(new Date(t));}catch{return '—';}};
const pct=r=>r===null?'—':`${(r*100).toFixed(1).replace('.',',')}%`;

export function certainty(row){
  const nieuw=num(row?.nieuw?.sessies),min=num(row?.min_steekproef)??50,p=num(row?.p_waarde);
  if(row?.status==='ROLLED_BACK')return {label:'Niet bevestigd',tone:'bad'};
  if(row?.status==='INSUFFICIENT_EVIDENCE')return {label:'Te weinig bewijs',tone:'warn'};
  if(nieuw===null||nieuw<min)return {label:'Te vroeg om te zeggen',tone:'warn'};
  if(row?.status==='COMPLETE'&&p!==null&&p<0.10)return {label:'Bewezen',tone:'good'};
  return {label:'Onzeker',tone:'neutral'};
}

export function projectExperimentChanges(input){
  const rows=arr(input?.rows).map(r=>{
    const oud=num(r?.oud?.ratio),nieuw=num(r?.nieuw?.ratio),verschil=num(r?.verschil_relatief);
    return {
      id:String(r?.experiment_id||''),gebied:String(r?.gebied||'—'),pagina:String(r?.pagina||'—'),
      wijziging:String(r?.wijziging||'—'),oudGedrag:String(r?.oud_gedrag||''),meetpunt:String(r?.meetpunt||'—'),
      toegepastOp:r?.toegepast_op||'',oud,nieuw,
      oudN:num(r?.oud?.sessies),nieuwN:num(r?.nieuw?.sessies),
      verschil:verschil!==null?verschil:(oud!==null&&nieuw!==null&&oud>0?(nieuw-oud)/oud:null),
      status:String(r?.status||''),besluit:String(r?.besluit||''),door:String(r?.besloten_door||''),
      zekerheid:certainty(r)
    };
  });
  return {status:input?.status==='LIVE'?'LIVE':'UNAVAILABLE',reason:input?.reason||'',rows};
}

export function experimentChangesMarkup(input){
  const model=projectExperimentChanges(input);
  if(model.status!=='LIVE')return `<section class="poc-panel" role="status"><h4>Wijzigingen · oud versus nieuw</h4><p>De registerbron kon niet veilig worden gelezen${model.reason?` (${esc(model.reason)})`:''}. Er worden geen cijfers verzonnen.</p></section>`;
  if(!model.rows.length)return `<section class="poc-panel" role="status"><h4>Wijzigingen · oud versus nieuw</h4><p>Nog geen gestarte wijzigingen met pagina en basislijn in het experimentregister. Zodra een agent een uitgevoerde wijziging registreert, verschijnt die hier met oude waarde, nieuwe waarde en verschil.</p></section>`;
  const body=model.rows.map(r=>{
    const diff=r.verschil===null?'—':`${r.verschil>=0?'+':''}${(r.verschil*100).toFixed(1).replace('.',',')}%`;
    const decider=r.besluit?`${esc(r.besluit)}${r.door?` · ${esc(r.door)}`:''}`:'loopt';
    return `<tr data-experiment-id="${esc(r.id)}"><td>${esc(r.gebied)}</td><td><b>${esc(r.wijziging)}</b><small>${esc(r.pagina)} · meetpunt ${esc(r.meetpunt)}</small></td><td>${esc(when(r.toegepastOp))}</td><td>${r.oud===null?'—':`<s>${esc(pct(r.oud))}</s><small>${esc(r.oudN??'')} sessies</small>`}</td><td>${r.nieuw===null?'—':`<b>${esc(pct(r.nieuw))}</b><small>${esc(r.nieuwN??'')} sessies</small>`}</td><td>${esc(diff)}</td><td><span class="poc-badge ${esc(r.zekerheid.tone)}">${esc(r.zekerheid.label)}</span><small>${decider}</small></td></tr>`;
  }).join('');
  return `<section class="poc-panel"><div class="poc-panelhead"><h4>Wijzigingen · oud versus nieuw</h4><span>${model.rows.length} gestarte wijzigingen</span></div><div class="poc-tablewrap"><table class="poc-table"><thead><tr><th>Gebied</th><th>Wijziging</th><th>Toegepast op</th><th>Oude waarde</th><th>Nieuwe waarde</th><th>Verschil</th><th>Zekerheid</th></tr></thead><tbody>${body}</tbody></table></div><p class="poc-note">Waarde = conversie op het meetpunt, zelfde pagina vóór versus tijdens. Een verschil zonder voldoende steekproef is geen bewijs; zonder consistente controlegroep wordt niets als bewezen behouden zonder mens.</p></section>`;
}
