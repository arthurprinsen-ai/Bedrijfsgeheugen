(function(){
  'use strict';
  if(window.BGScanPersistence)return;
  var OUTBOX='bg_scan_outbox_v3',RECEIPTS='bg_scan_receipts_v3',TTL=7*86400000;
  var inFlight=new Map();
  var local=null,session=null;
  try{local=window.localStorage;session=window.sessionStorage}catch(_){}
  function read(storage,key){try{return JSON.parse(storage.getItem(key)||'[]')}catch(_){return []}}
  function write(storage,key,rows){try{if(rows.length)storage.setItem(key,JSON.stringify(rows));else storage.removeItem(key)}catch(_){}}
  function fresh(rows){return Array.isArray(rows)?rows.filter(function(x){return x&&Number.isFinite(x.at)&&Date.now()-x.at<TTL&&x.at<=Date.now()}).slice(-10):[]}
  function pending(payload){var rows=fresh(read(session,OUTBOX)).filter(function(x){return x.payload?.submission_key!==payload.submission_key});rows.push({at:Date.now(),payload:payload});write(session,OUTBOX,rows)}
  function acknowledge(payload,data){
    var rows=fresh(read(local,RECEIPTS)).filter(function(x){return x.submission_key!==payload.submission_key});
    rows.push({at:Date.now(),submission_key:payload.submission_key,scan_id:data.scan_id,event_id:data.event_id});write(local,RECEIPTS,rows);
    write(session,OUTBOX,fresh(read(session,OUTBOX)).filter(function(x){return x.payload?.submission_key!==payload.submission_key}));
  }
  function save(payload,onState){
    var key=String(payload?.submission_key||'');
    if(!/^[A-Za-z0-9._:-]{12,180}$/.test(key))return Promise.reject(Error('INVALID_SUBMISSION_KEY'));
    if(inFlight.has(key))return inFlight.get(key);
    pending(payload);if(onState)onState('saving');
    var job=(async function(){
      for(var attempt=0;attempt<3;attempt++){
        try{
          var r=await fetch('/api/powerhouse-scan-ingest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true});
          var data=await r.json();
          if(!r.ok||data?.ok!==true||!data.scan_id||!data.event_id)throw Error('SCAN_NOT_STORED');
          acknowledge(payload,data);if(onState)onState('stored');return data;
        }catch(_){if(attempt<2)await new Promise(function(resolve){setTimeout(resolve,500*(attempt+1))})}
      }
      if(onState)onState('pending');throw Error('SCAN_NOT_STORED');
    })();
    inFlight.set(key,job);job.then(function(){inFlight.delete(key)},function(){inFlight.delete(key)});return job;
  }
  window.BGScanPersistence={save:save};
  function resume(){fresh(read(session,OUTBOX)).forEach(function(row){save(row.payload).catch(function(){})})}
  window.addEventListener('online',resume);resume();
  // Preserve the existing V18 scan UI while sending completed assessments to
  // the same server authority as Bedrijfslek and the workshop scan.
  if(window.document){
    var completed=new Map();
    document.addEventListener('click',function(event){
      var button=event.target?.closest?.('[data-v18-scan-ai],[data-v18-open-portal]');
      if(!button||typeof window.captureScanState!=='function')return;
      var kind=button.dataset.scanKind||'deep';
      var fields=Array.from(document.querySelectorAll('[data-v17-scan="'+kind+'"]'));
      if(!fields.length)return;
      var state=window.captureScanState(kind);if(!state?.scan)return;
      var answers=fields.map(function(field){return {vraag:field.dataset.label||'',antwoord:String(field.value),dim:field.dataset.label||'',ctx:kind}});
      var signature=JSON.stringify(answers),entry=completed.get(kind);
      if(!entry||entry.signature!==signature){entry={signature:signature,key:'frisse-blik-'+crypto.randomUUID()};completed.set(kind,entry)}
      var dimensions={};fields.forEach(function(field,index){dimensions[field.dataset.label||'dimensie-'+index]=Number(field.value)});
      var scan={score:state.scan.score,niveau:Math.max(1,Math.ceil(state.scan.score/20)),dimAvg:dimensions,antwoorden:answers,submission_key:entry.key};
      try{local?.setItem('bg_scan_pakket',JSON.stringify(scan))}catch(_){}
      var status=document.getElementById('bgCompletedScanStatus');
      if(!status){status=document.createElement('p');status.id='bgCompletedScanStatus';status.setAttribute('role','status');button.parentElement.appendChild(status)}
      status.textContent='Je scan wordt opgeslagen…';
      save({submission_key:entry.key,canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',scan:scan})
        .then(function(){status.textContent='Je scan is opgeslagen en kan aan je portaal worden gekoppeld.'})
        .catch(function(){status.textContent='Opslaan is nog niet gelukt. Probeer opnieuw; je uitslag blijft beschikbaar.'});
    });
  }
})();
