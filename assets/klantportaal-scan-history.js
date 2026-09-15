(()=>{
  'use strict';
  const esc=v=>String(v??'');
  async function claimLocal(){
    let scan=null;try{scan=JSON.parse(localStorage.getItem('bg_scan_pakket')||'null')}catch{}
    if(!scan?.submission_key)return;
    try{await fetch('/api/portal-scans',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({submission_key:scan.submission_key}),credentials:'same-origin'})}catch{}
  }
  function target(){return document.querySelector('main,[role="main"],.main,.content,.app')||document.body;}
  function render(scans){
    if(!Array.isArray(scans)||!scans.length||document.getElementById('bgCanonicalScanHistory'))return;
    const section=document.createElement('section');section.id='bgCanonicalScanHistory';
    section.style.cssText='margin:18px 0;padding:18px;border:1px solid #dce4ee;border-radius:16px;background:#fff;box-shadow:0 1px 3px rgba(22,39,62,.06)';
    const h=document.createElement('h2');h.textContent='Scanhistorie';h.style.cssText='margin:0 0 6px;font-size:1.15rem';section.appendChild(h);
    const p=document.createElement('p');p.textContent='Oude en nieuwe Frisse Blik-scans uit dezelfde Powerhouse-bron.';p.style.cssText='margin:0 0 12px;color:#64748b;font-size:.86rem';section.appendChild(p);
    const list=document.createElement('div');list.style.cssText='display:grid;gap:8px';
    for(const row of scans.slice(0,12)){
      const item=document.createElement('div');item.style.cssText='display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px';
      const left=document.createElement('div');const date=document.createElement('strong');date.textContent=esc(row.scan_datum||String(row.aangemaakt||'').slice(0,10)||'Scan');left.appendChild(date);
      const meta=document.createElement('div');meta.textContent=`${esc(row.bron||'scan')} · ${esc(row.tenant_identity_status||'')}`;meta.style.cssText='font-size:.75rem;color:#64748b';left.appendChild(meta);
      const right=document.createElement('div');right.style.cssText='text-align:right';const score=document.createElement('strong');score.textContent=row.score==null?'—':`${Number(row.score).toFixed(0)}/100`;right.appendChild(score);
      if(row.score_delta!=null){const delta=document.createElement('div');const n=Number(row.score_delta);delta.textContent=`${n>=0?'+':''}${n.toFixed(0)} sinds vorige`;delta.style.cssText='font-size:.72rem;color:#64748b';right.appendChild(delta);}
      item.append(left,right);list.appendChild(item);
    }
    section.appendChild(list);target().prepend(section);
  }
  async function load(){
    await claimLocal();
    try{const r=await fetch('/api/portal-scans',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;const data=await r.json();render(data.scans||[]);}catch{}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
