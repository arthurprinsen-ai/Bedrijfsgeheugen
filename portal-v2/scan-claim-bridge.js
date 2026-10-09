// Authenticated Portal V2 projection of existing canonical scan history.
// The visitor's anonymous Bedrijfslek assessment remains aggregate-only until
// they choose to claim it inside their authenticated tenant session.
const KEY='bg_last_scan_ref';
function pendingKey(storage){
  try{const value=String(storage?.getItem(KEY)||'');
    return /^bedrijfslek-[A-Za-z0-9-]{12,170}$/.test(value)?value:null;
  }catch{return null}
}
function element(doc,tag,cls,text){
  const x=doc.createElement(tag);
  if(cls)x.className=cls;
  if(text)x.textContent=text;
  return x;
}
export function createScanClaimBridge({doc=document,fetcher=fetch,storage=sessionStorage}={}){
  const mount=doc.querySelector('.main .executive-glance')||doc.querySelector('.main');
  if(!mount)return {setAuthenticated(){}};
  const section=element(doc,'section','portal-canonical-scans');
  section.id='portalCanonicalScans'; section.hidden=true;
  section.setAttribute('aria-label','Mijn nulmetingen');
  section.style.cssText='margin:16px 0;padding:16px 20px;border:1px solid #dce4ee;border-radius:14px;background:#fff';
  const header=element(doc,'h2','', 'Mijn nulmetingen');
  header.style.cssText='margin:0 0 6px;font-size:1.12rem';
  const intro=element(doc,'p','', 'Je geverifieerde scans en de aansluiting op jouw Bedrijfsgeheugen Brein.');
  intro.style.cssText='margin:0 0 10px;color:#64748b;font-size:.88rem';
  const status=element(doc,'p','');
  status.setAttribute('role','status');status.style.cssText='font-size:.84rem;color:#475569;margin:5px 0';
  const claim=element(doc,'button','','Koppel mijn gratis Bedrijfslek-scan aan dit bedrijf');
  claim.type='button';claim.style.cssText='cursor:pointer;padding:9px 13px;border:1px solid #2742d6;border-radius:9px;background:#2742d6;color:#fff;font-weight:650;margin:7px 0';
  const history=element(doc,'div','portal-canonical-scan-history');
  section.append(header,intro,claim,status,history);
  mount.before(section);
  let authenticated=false,revision=0;
  const json=async response=>response.json().catch(()=>null);
  function clearHistory(){history.replaceChildren()}
  function showHistory(scans){
    clearHistory();
    const rows=Array.isArray(scans)?scans.filter(row=>row?.tenant_identity_status==='verified').slice(0,5):[];
    if(!rows.length){status.textContent='Nog geen geverifieerde nulmeting gekoppeld.';return}
    status.textContent=rows.length+' geverifieerde nulmeting'+(rows.length===1?'':'en')+' beschikbaar.';
    const list=element(doc,'ul');
    list.style.cssText='padding-left:20px;margin:10px 0';
    for(const row of rows){
      const score=Number(row.score);
      const label=String(row.soort||'scan').replace(/_/g,' ');
      const day=String(row.scan_datum||row.aangemaakt||'').slice(0,10);
      const li=element(doc,'li','',label+' · '+(Number.isFinite(score)?Math.round(score)+'/100':'geen score')+(day?' · '+day:''));
      li.style.cssText='margin-bottom:5px;font-size:.9rem';
      list.appendChild(li);
    }
    history.appendChild(list);
    const link=element(doc,'a','','Bekijk acties en impact in het portaal →');
    link.href='https://www.bedrijfsgeheugen.nl/portal-v2/?page=actieve-acties';
    link.style.cssText='font-size:.88rem;color:#2742d6;font-weight:700';
    history.appendChild(link);
  }
  async function refresh(){
    const current=revision;
    if(!authenticated)return;
    const key=pendingKey(storage);
    claim.hidden=!key;
    status.textContent='Geverifieerde scanhistorie ophalen…';
    try{
      const response=await fetcher('/api/portal-scans',{credentials:'same-origin',cache:'no-store'});
      const data=await json(response);
      if(current!==revision||!authenticated)return;
      if(response.status===401||response.status===403){section.hidden=true;clearHistory();return}
      if(!response.ok||data?.ok!==true){status.textContent='De scanhistorie is momenteel niet beschikbaar. Er zijn geen gegevens gewijzigd.';clearHistory();return}
      showHistory(data.scans);
    }catch{
      if(current===revision&&authenticated){status.textContent='De scanhistorie is tijdelijk niet beschikbaar.';clearHistory()}
    }
  }
  claim.addEventListener('click',async()=>{
    if(!authenticated)return;
    const submissionKey=pendingKey(storage);
    if(!submissionKey)return;
    claim.disabled=true;status.textContent='De nulmeting gecontroleerd koppelen aan dit bedrijf…';
    try{
      const response=await fetcher('/api/portal-scans',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({submission_key:submissionKey})});
      const data=await json(response);
      if(!authenticated)return;
      if(!response.ok||data?.ok!==true||data?.claimed!==true){status.textContent='Koppelen is niet gelukt; de scan blijft ongewijzigd. Probeer het opnieuw.';return}
      try{storage.removeItem(KEY)}catch{}
      await refresh();
    }catch{if(authenticated)status.textContent='Koppelen is niet gelukt. De scan is niet als gekoppeld gemarkeerd.'}
    finally{claim.disabled=false}
  });
  return {
    setAuthenticated(value){
      const next=value===true;
      if(next===authenticated)return;
      authenticated=next;revision++;
      section.hidden=!next;
      if(!next){clearHistory();status.textContent='';claim.hidden=true;return}
      refresh();
    }
  };
}
