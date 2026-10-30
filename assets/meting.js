/* Eigen meting van alle interacties (11 sept 2026, besluit Arthur: alles meten om te optimaliseren).
   Naar Supabase bg_interacties via bg-interactie: pagina, elke klik op link of knop, scrolldiepte
   25/50/75/90/100, formulier gestart en verzonden, actieve tijd op de pagina. Privacyarm: geen
   cookies, een sessie-ID per tabblad (sessionStorage), geen IP of browsergegevens opgeslagen,
   van links alleen het pad, van formulieren nooit de ingevulde waarden.
   Met toestemming gaan dezelfde gebeurtenissen ook naar GA4. */
(function(){
  if(window.__bgMeting)return;window.__bgMeting=true;
  /* Bezwaar zonder cookie: stuurt de browser Do Not Track of Global Privacy Control, dan meten we niets (privacyverklaring). */
  try{if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.msDoNotTrack==='1')return;}catch(e){}
  var DOEL='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-interactie';
  var gebied=/^\/(klantportaal|portal-v2|portaal|mijn)/.test(location.pathname)?'portaal':'site';
  var sid='';try{sid=sessionStorage.getItem('bg_meting_sessie')||sessionStorage.getItem('bg_growth_session')||'';if(!sid){sid=(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));}sessionStorage.setItem('bg_meting_sessie',sid);sessionStorage.setItem('bg_growth_session',sid);}catch(e){sid='';}
  var bron='';try{if(document.referrer){var r=new URL(document.referrer);if(r.hostname!==location.hostname)bron=r.hostname;}}catch(e){}
  /* Herkomst per sessie (11 sept 2026): utm-bron / -medium / -campagne van de binnenkomst, anders het verwijzende domein.
     Eén keer per tabblad bepaald en bewaard; nooit persoonsgegevens. */
  var herkomst='';try{herkomst=sessionStorage.getItem('bg_meting_herkomst')||'';if(!herkomst){var q=new URLSearchParams(location.search);var u=[q.get('utm_source'),q.get('utm_medium'),q.get('utm_campaign')].filter(Boolean).map(function(x){return String(x).toLowerCase().replace(/[^a-z0-9._ -]/g,'').slice(0,40);});herkomst=u.length?u.join(' / '):(bron||'(direct)');sessionStorage.setItem('bg_meting_herkomst',herkomst);}}catch(e){herkomst=bron||'';}
  var WACHT_SLEUTEL='bg_meting_niet_bevestigd_v2',wacht=[],totaal=0,MAX=400,bezig=false,poging=0;
  try{var oud=JSON.parse(sessionStorage.getItem(WACHT_SLEUTEL)||'[]');if(Array.isArray(oud))wacht=oud.filter(function(x){return x&&typeof x==='object'&&typeof x.event_uid==='string';}).slice(-400);}catch(e){}
  function bewaar(){try{sessionStorage.setItem(WACHT_SLEUTEL,JSON.stringify(wacht.slice(-400)));}catch(e){}}
  function eventId(){
    try{
      if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
      if(window.crypto&&crypto.getRandomValues){
        var bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
        bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
        var h=Array.from(bytes,function(b){return b.toString(16).padStart(2,'0');}).join('');
        return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
      }
    }catch(e){}
    return null; // Secure randomness unavailable: never enqueue an untrusted UID.
  }
  function toestemming(){try{return localStorage.getItem('bg_consent')==='granted';}catch(e){return false;}}
  function stuur(){
    if(bezig||!wacht.length)return;
    // Consent revoked after collection: never upload previously queued detail events.
    if(!toestemming()){
      var beperkt=/^(sectie_zichtbaar|formulier_fout|formulier_verlaten|whatsapp_klik|frustratie_klik|popup_getoond|popup_gesloten|popup_conversie|experiment_blootstelling|pagina_verlaten)$/;
      var voor=wacht.length;wacht=wacht.filter(function(e){return !beperkt.test(String(e.gebeurtenis||''));});
      if(wacht.length!==voor)bewaar();
      if(!wacht.length)return;
    }
    bezig=true;
    var batch=wacht.slice(0,30);
    var body=JSON.stringify({sessie:sid,gebied:gebied,bron_domein:bron,herkomst:herkomst,toestemming:toestemming(),events:batch});
    fetch(DOEL,{method:'POST',body:body,keepalive:true,credentials:'omit',headers:{'content-type':'text/plain'}})
      .then(function(res){if(!res.ok)throw new Error('HTTP_'+res.status);return res.json();})
      .then(function(ack){
        if(!ack||ack.ok!==true||ack.bevestigd!==batch.length||ack.degraded)throw new Error('NO_DATABASE_ACK');
        var ids={};batch.forEach(function(ev){ids[ev.event_uid]=true;});
        wacht=wacht.filter(function(ev){return !ids[ev.event_uid];});
        poging=0;bewaar();
      }).catch(function(){poging=Math.min(poging+1,7);bewaar();setTimeout(stuur,Math.min(60000,1000*Math.pow(2,poging)));})
      .finally(function(){bezig=false;if(wacht.length&&poging===0)setTimeout(stuur,0);});
  }
  function meet(e){
    if(totaal>=MAX||wacht.length>=MAX){
      // Never evict an unacknowledged event merely to make room for a newer one.
      // Count the lost new observations explicitly so local QA can detect saturation.
      try{var k='bg_meting_queue_overflow_v1';sessionStorage.setItem(k,String((Number(sessionStorage.getItem(k))||0)+1));}catch(_e){}
      stuur();return;
    }
    var uid=eventId();
    if(!uid){
      // Fail closed: an untrusted event UID must never enter the persisted/retried queue.
      try{var k='bg_meting_uid_unavailable_v1';sessionStorage.setItem(k,String((Number(sessionStorage.getItem(k))||0)+1));}catch(_e){}
      return;
    }
    totaal++;e.pad=location.pathname;e.gebeurd_op=new Date().toISOString();e.event_uid=uid;wacht.push(e);bewaar();if(wacht.length>=10)stuur();
  }
  function ga(naam,p){try{if(toestemming()&&typeof window.gtag==='function')window.gtag('event',naam,p);}catch(e){}}

  /* Acquisition truth only after optional analytics consent: map external UTM/referrer
     to fixed categories, never forward raw URLs, names, UTM values or PII. */
  function bronCategorie(){
    if(!toestemming())return {source:'website',medium:'unattributed',campaign:''};
    var parts=String(herkomst||'').toLowerCase().split(' / ');
    var source=String(parts[0]||'').trim(),medium=String(parts[1]||'').trim(),campaign=String(parts[2]||'').trim();
    var out={source:'website',medium:'direct',campaign:''};
    if(/^(linkedin|li|linkedin\.com|www\.linkedin\.com|lnkd\.in|linkedin_personal|linkedin_company)$/.test(source)){
      out.source='linkedin';out.medium='social';
      if(/(personal|persoonlijk)/.test(source+' '+campaign))out.campaign='linkedin_personal';
      else if(/(company|bedrijf|pagina)/.test(source+' '+campaign))out.campaign='linkedin_company';
    }else if(/^(instagram|ig|instagram\.com|www\.instagram\.com)$/.test(source)){
      out.source='instagram';out.medium='social';out.campaign='instagram';
    }else if(/^(email|e-mail|mail|newsletter|nieuwsbrief)$/.test(source)||/^(email|e-mail|newsletter)$/.test(medium)){
      out.source='email';out.medium='email';out.campaign='email';
    }else if(/^(google|google\.com|www\.google\.com|bing|bing\.com|www\.bing\.com|duckduckgo\.com)$/.test(source)){
      out.source=source.split('.')[0].replace(/^www$/,'google');
      out.medium=/^(paid|cpc|ppc)$/.test(medium)?'paid':'organic';
    }else if(source&&source!=='(direct)'&&source!=='direct'){
      out.source='referral';out.medium='referral';
    }
    return out;
  }

  /* Commerciële meetpunten naar de BESTAANDE durable Powerhouse growth queue.
     Alleen bij analytics-toestemming; geen formulierinhoud, identifiers of raw kliktekst.
     Acknowledgement 202 betekent QUEUED, niet dat Supabase-opslag of order bewezen is. */
  function meetGroei(type){
    if(gebied!=='site'||!toestemming())return;
    // Keep one commercial-event writer: generated money pages already have this producer.
    if((type==='primary_cta_click'||type==='form_start'||type==='form_submit_intent') &&
       document.getElementById&&document.getElementById('bg-growth-measurement'))return;
    if(!/^https?:$/.test(location.protocol)||!/(^|\.)bedrijfsgeheugen\.nl$/i.test(location.hostname))return;
    var pad=location.pathname.replace(/[^a-zA-Z0-9/_-]/g,'').slice(0,180)||'/';
    var id='';try{id=crypto.randomUUID();}catch(e){id='g'+Date.now().toString(36)+Math.random().toString(36).slice(2);}
    var acq=bronCategorie();
    var event={
      event_id:id,event_type:type,
      canonical:'https://www.bedrijfsgeheugen.nl'+pad,
      intent_id:pad,source:acq.source,medium:acq.medium,campaign:acq.campaign,
      attribution_root:sid,channel:'website',
      content_type:'page',funnel_stage:'consideration'
    };
    var pogingen=0;
    function poging(){
      if(++pogingen>3)return;
      fetch('/api/growth-event',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify(event),credentials:'omit',keepalive:true
      }).then(function(r){if(!r.ok)throw Error('growth-event-not-accepted');return r.json();})
        .then(function(ack){if(ack.accepted!==true||ack.event_id!==id)throw Error('growth-event-ack-mismatch');})
        .catch(function(){if(pogingen<3)setTimeout(poging,pogingen*1500);});
    }
    poging();
  }

  function tekstVan(el){return String(el.getAttribute('data-bg-meet')||el.id||el.tagName||'').replace(/\s+/g,' ').trim().slice(0,120);}
  function onderdeelVan(el){var c=el.closest&&el.closest('[data-bg-component]');if(c)return c.getAttribute('data-bg-component').slice(0,80);var i=el.parentElement&&el.parentElement.closest&&el.parentElement.closest('section[id],[id]');return i?String(i.id).slice(0,80):'';}
  meet({gebeurtenis:'pagina'});
  var vorig=location.pathname;function route(){if(location.pathname!==vorig){vorig=location.pathname;gehaald={};maxScroll=0;meet({gebeurtenis:'pagina'});}}
  addEventListener('popstate',route);addEventListener('hashchange',route);
  /* Calendly (11 sept 2026): geef de tabbladcode en de pagina mee als utm_content en utm_term, zodat het brein een geboekt
     gesprek aan de pagina en bron van dit bezoek kan koppelen (bg-calendly-sync). Geen naam of e-mailadres. */
  function tagCalendly(el){try{if(!el||el.tagName!=='A'||!/(^|\.)calendly\.com$/i.test(new URL(el.href).hostname)||!sid||!toestemming())return;var u=new URL(el.href);u.searchParams.set('utm_source','bedrijfsgeheugen');u.searchParams.set('utm_medium','site');if(herkomst)u.searchParams.set('utm_campaign',herkomst.slice(0,60));u.searchParams.set('utm_content',sid);u.searchParams.set('utm_term',location.pathname.slice(0,120));el.href=u.toString();}catch(e){}}
  document.addEventListener('click',function(ev){var el=ev.target&&ev.target.closest&&ev.target.closest('a,button,[role="button"],[role="tab"],input[type="submit"],input[type="button"],summary,[data-bg-meet]');if(!el)return;tagCalendly(el);var t=tekstVan(el),o=onderdeelVan(el),dRaw=el.getAttribute('href')||'',d='';try{if(/^mailto:/i.test(dRaw))d='mailto';else if(/^tel:/i.test(dRaw))d='tel';else if(dRaw){var link=new URL(dRaw,location.href);d=link.hostname===location.hostname?link.pathname:'extern:'+link.hostname;}}catch(e){}meet({gebeurtenis:'klik',element_tekst:t,element_soort:(el.getAttribute('role')||el.tagName).toLowerCase(),element_doel:d,onderdeel:o});ga('klik',{element_tekst:t,onderdeel:o,link_pad:d.split('?')[0].split('#')[0]});if(/^mailto:|^tel:/i.test(dRaw))meetGroei('money_link_click');else if(el.closest&&el.closest('main')&&(el.matches('[data-bg-primary-cta],[data-bg-conversion],.btn-primary,.btn-primaire,.cta-primary')||/\/(contact|frisse-blik|aanmelden|prijzen|zelfscan)(\/|$)/i.test(d)))meetGroei('primary_cta_click');setTimeout(route,50);},true);
  var drempels=[10,25,50,75,90,100],gehaald={},wachtScroll=0,maxScroll=0;
  function scrol(){wachtScroll=0;var h=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);var pct=Math.min(100,Math.round((window.scrollY||window.pageYOffset||0)/h*100));maxScroll=Math.max(maxScroll,pct);for(var i=0;i<drempels.length;i++){var d=drempels[i];if(pct>=d&&!gehaald[d]){gehaald[d]=1;meet({gebeurtenis:'scroll',diepte_pct:d});ga('scroll_diepte',{percentage:d});}}}
  addEventListener('scroll',function(){if(!wachtScroll)wachtScroll=setTimeout(scrol,250);},{passive:true});
  function formNaam(f){return String(f.getAttribute('name')||f.id||f.getAttribute('aria-label')||'formulier').slice(0,80);}
  document.addEventListener('focusin',function(ev){var f=ev.target&&(ev.target.form||(ev.target.closest&&ev.target.closest('form')));if(!f||f.__bgGestart)return;f.__bgGestart=1;var n=formNaam(f);meet({gebeurtenis:'formulier_start',element_tekst:n,onderdeel:onderdeelVan(f)});ga('formulier_start',{formulier:n});meetGroei('form_start');},true);
  document.addEventListener('submit',function(ev){var f=ev.target;if(!f||!f.tagName)return;var n=formNaam(f);meet({gebeurtenis:'formulier_verzonden',element_tekst:n,onderdeel:onderdeelVan(f)});ga('formulier_verzonden',{formulier:n});meetGroei('form_submit_intent');stuur();},true);
  var actief=0,sinds=document.hidden?0:Date.now(),tijdGemeten=false;
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(sinds){actief+=Date.now()-sinds;sinds=0;}if(!tijdGemeten){tijdGemeten=true;meet({gebeurtenis:'tijd_op_pagina',seconden:Math.round(actief/1000)});}stuur();}else{sinds=Date.now();}});
  /* Toestemmingsgebonden CRO-instrumentatie; nooit vrije veldwaarden of sessiereplay. */
  var laatsteSectie='',actieveFormulieren=new Map(),klikVenster={};
  if(typeof IntersectionObserver==='function'){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var n=entry.target,naam=String(n.getAttribute('data-bg-component')||n.id||'').slice(0,80);
      if(!naam)return;laatsteSectie=naam;
      if(toestemming()&&!n.__bgZichtbaar){n.__bgZichtbaar=true;meet({gebeurtenis:'sectie_zichtbaar',onderdeel:naam});}
    });},{threshold:0.35});
    document.querySelectorAll('main section[id],main [data-bg-component],article[id]').forEach(function(n,i){if(i<120)io.observe(n);});
  }
  document.addEventListener('invalid',function(ev){
    if(!toestemming())return;var f=ev.target&&ev.target.form;
    if(f)meet({gebeurtenis:'formulier_fout',element_tekst:formNaam(f),onderdeel:onderdeelVan(f)});
  },true);
  document.addEventListener('focusin',function(ev){var f=ev.target&&ev.target.form;if(f)actieveFormulieren.set(f,true);},true);
  document.addEventListener('submit',function(ev){actieveFormulieren.delete(ev.target);},true);
  document.addEventListener('click',function(ev){
    var a=ev.target&&ev.target.closest&&ev.target.closest('a[href]');
    if(a){try{var h=new URL(a.href).hostname.toLowerCase();
      if(toestemming()&&(h==='wa.me'||h==='api.whatsapp.com'||h==='web.whatsapp.com'))meet({gebeurtenis:'whatsapp_klik',element_tekst:tekstVan(a),onderdeel:onderdeelVan(a),element_doel:'extern:'+h});
    }catch(e){}}
    if(!toestemming())return;
    var target=ev.target&&ev.target.closest&&ev.target.closest('button,[role="button"],a[data-bg-meet]');if(!target)return;
    var key=String(target.getAttribute('data-bg-meet')||target.id||target.getAttribute('aria-label')||'');
    if(!key)return;var nu=Date.now(),reeks=klikVenster[key]||[];reeks=reeks.filter(function(t){return nu-t<=1100;});reeks.push(nu);klikVenster[key]=reeks;
    if(reeks.length===3)meet({gebeurtenis:'frustratie_klik',element_tekst:key,onderdeel:onderdeelVan(target)});
  },true);
  document.addEventListener('bg:cro-popup',function(ev){
    if(!toestemming())return;var d=ev.detail||{},soort=String(d.action||'');
    if(!['getoond','gesloten','conversie'].includes(soort))return;
    meet({gebeurtenis:'popup_'+soort,onderdeel:String(d.component||'').slice(0,80)});
  });
  document.addEventListener('bg:cro-exposure',function(ev){
    if(!toestemming())return;var d=ev.detail||{};
    if(!/^[a-z0-9_-]{1,60}$/i.test(d.experiment||'')||!['control','treatment'].includes(d.arm))return;
    meet({gebeurtenis:'experiment_blootstelling',onderdeel:'cro:'+d.experiment,element_tekst:d.arm});
  });
  addEventListener('pagehide',function(){
    if(toestemming()){
      actieveFormulieren.forEach(function(_,f){meet({gebeurtenis:'formulier_verlaten',element_tekst:formNaam(f),onderdeel:onderdeelVan(f)});});
      meet({gebeurtenis:'pagina_verlaten',onderdeel:laatsteSectie,diepte_pct:maxScroll,seconden:Math.round((actief+(sinds?Date.now()-sinds:0))/1000)});
    }
    bewaar();stuur();
  });
  setInterval(stuur,15000);
})();
