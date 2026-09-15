(()=>{
  'use strict';
  if(!/^\/frisse-blik(?:\.html)?\/?$/.test(location.pathname))return;
  const STORAGE_KEY='bg_scan_pakket';
  const RECEIPT_KEY='bg_scan_server_receipt_v1';
  let initial=null;try{initial=localStorage.getItem(STORAGE_KEY)}catch{return;}
  let sent=false,checks=0;
  const makeKey=()=>`frisse-blik-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}-${crypto?.randomUUID?.()||Math.random().toString(36).slice(2,14)}`;
  const attempt=async()=>{
    if(sent||checks++>24)return;
    let raw=null;try{raw=localStorage.getItem(STORAGE_KEY)}catch{return;}
    if(!raw||raw===initial)return;
    let scan;try{scan=JSON.parse(raw)}catch{return;}
    if(!scan||typeof scan!=='object'||!Number.isFinite(Number(scan.score)))return;
    const submissionKey=scan.submission_key||makeKey();scan.submission_key=submissionKey;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(scan))}catch{}
    sent=true;
    try{
      const response=await fetch('/api/powerhouse-scan-ingest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({submission_key:submissionKey,canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',scan}),keepalive:true});
      if(!response.ok)throw new Error(`HTTP_${response.status}`);
      const data=await response.json();
      localStorage.setItem(RECEIPT_KEY,JSON.stringify({submission_key:submissionKey,scan_id:data.scan_id||null,event_id:data.event_id||null,stored_at:new Date().toISOString()}));
      localStorage.removeItem('bg_scan_server_pending_v1');
    }catch(error){
      sent=false;
      try{localStorage.setItem('bg_scan_server_pending_v1',JSON.stringify({submission_key:submissionKey,scan,canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',last_error:String(error?.message||error),updated_at:new Date().toISOString()}))}catch{}
    }
  };
  const timer=setInterval(()=>{attempt();if(sent||checks>24)clearInterval(timer)},200);
  window.addEventListener('pagehide',()=>{if(!sent)attempt()},{once:true});
})();
