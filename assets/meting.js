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
  var sid='';try{sid=sessionStorage.getItem('bg_meting_sessie')||'';if(!sid){sid=(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));sessionStorage.setItem('bg_meting_sessie',sid);}}catch(e){sid='';}
  var bron='';try{if(document.referrer){var r=new URL(document.referrer);if(r.hostname!==location.hostname)bron=r.hostname;}}catch(e){}
  /* Herkomst per sessie (11 sept 2026): utm-bron / -medium / -campagne van de binnenkomst, anders het verwijzende domein.
     Eén keer per tabblad bepaald en bewaard; nooit persoonsgegevens. */
  var herkomst='';try{herkomst=sessionStorage.getItem('bg_meting_herkomst')||'';if(!herkomst){var q=new URLSearchParams(location.search);var u=[q.get('utm_source'),q.get('utm_medium'),q.get('utm_campaign')].filter(Boolean).map(function(x){return String(x).toLowerCase().replace(/[^a-z0-9._ -]/g,'').slice(0,40);});herkomst=u.length?u.join(' / '):(bron||'(direct)');sessionStorage.setItem('bg_meting_herkomst',herkomst);}}catch(e){herkomst=bron||'';}
  var wacht=[],totaal=0,MAX=400;
  function toestemming(){try{return localStorage.getItem('bg_consent')==='granted';}catch(e){return false;}}
  function stuur(){if(!wacht.length)return;var body=JSON.stringify({sessie:sid,gebied:gebied,bron_domein:bron,herkomst:herkomst,toestemming:toestemming(),events:wacht.splice(0,50)});try{if(navigator.sendBeacon&&navigator.sendBeacon(DOEL,new Blob([body],{type:'text/plain'})))return;}catch(e){}try{fetch(DOEL,{method:'POST',body:body,keepalive:true,credentials:'omit',headers:{'content-type':'text/plain'}}).catch(function(){});}catch(e){}}
  function meet(e){if(totaal>=MAX)return;totaal++;e.pad=location.pathname;e.gebeurd_op=new Date().toISOString();wacht.push(e);if(wacht.length>=10)stuur();}
  function ga(naam,p){try{if(toestemming()&&typeof window.gtag==='function')window.gtag('event',naam,p);}catch(e){}}
  function tekstVan(el){return String(el.getAttribute('aria-label')||el.innerText||el.value||el.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,120);}
  function onderdeelVan(el){var c=el.closest&&el.closest('[data-bg-component]');if(c)return c.getAttribute('data-bg-component').slice(0,80);var i=el.parentElement&&el.parentElement.closest&&el.parentElement.closest('section[id],[id]');return i?String(i.id).slice(0,80):'';}
  meet({gebeurtenis:'pagina'});
  var vorig=location.pathname;function route(){if(location.pathname!==vorig){vorig=location.pathname;gehaald={};meet({gebeurtenis:'pagina'});}}
  addEventListener('popstate',route);addEventListener('hashchange',route);
  /* Calendly (11 sept 2026): geef de tabbladcode en de pagina mee als utm_content en utm_term, zodat het brein een geboekt
     gesprek aan de pagina en bron van dit bezoek kan koppelen (bg-calendly-sync). Geen naam of e-mailadres. */
  function tagCalendly(el){try{if(!el||el.tagName!=='A'||!/(^|\.)calendly\.com$/i.test(new URL(el.href).hostname)||!sid)return;var u=new URL(el.href);u.searchParams.set('utm_source','bedrijfsgeheugen');u.searchParams.set('utm_medium','site');if(herkomst)u.searchParams.set('utm_campaign',herkomst.slice(0,60));u.searchParams.set('utm_content',sid);u.searchParams.set('utm_term',location.pathname.slice(0,120));el.href=u.toString();}catch(e){}}
  document.addEventListener('click',function(ev){var el=ev.target&&ev.target.closest&&ev.target.closest('a,button,[role="button"],[role="tab"],input[type="submit"],input[type="button"],summary,[data-bg-meet]');if(!el)return;tagCalendly(el);var t=tekstVan(el),o=onderdeelVan(el),d=el.getAttribute('href')||'';meet({gebeurtenis:'klik',element_tekst:t,element_soort:(el.getAttribute('role')||el.tagName).toLowerCase(),element_doel:d,onderdeel:o});ga('klik',{element_tekst:t,onderdeel:o,link_pad:d.split('?')[0].split('#')[0]});setTimeout(route,50);},true);
  var drempels=[25,50,75,90,100],gehaald={},wachtScroll=0;
  function scrol(){wachtScroll=0;var h=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);var pct=Math.min(100,Math.round((window.scrollY||window.pageYOffset||0)/h*100));for(var i=0;i<drempels.length;i++){var d=drempels[i];if(pct>=d&&!gehaald[d]){gehaald[d]=1;meet({gebeurtenis:'scroll',diepte_pct:d});ga('scroll_diepte',{percentage:d});}}}
  addEventListener('scroll',function(){if(!wachtScroll)wachtScroll=setTimeout(scrol,250);},{passive:true});
  function formNaam(f){return String(f.getAttribute('name')||f.id||f.getAttribute('aria-label')||'formulier').slice(0,80);}
  document.addEventListener('focusin',function(ev){var f=ev.target&&(ev.target.form||(ev.target.closest&&ev.target.closest('form')));if(!f||f.__bgGestart)return;f.__bgGestart=1;var n=formNaam(f);meet({gebeurtenis:'formulier_start',element_tekst:n,onderdeel:onderdeelVan(f)});ga('formulier_start',{formulier:n});},true);
  document.addEventListener('submit',function(ev){var f=ev.target;if(!f||!f.tagName)return;var n=formNaam(f);meet({gebeurtenis:'formulier_verzonden',element_tekst:n,onderdeel:onderdeelVan(f)});ga('formulier_verzonden',{formulier:n});stuur();},true);
  var actief=0,sinds=document.hidden?0:Date.now(),tijdGemeten=false;
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(sinds){actief+=Date.now()-sinds;sinds=0;}if(!tijdGemeten){tijdGemeten=true;meet({gebeurtenis:'tijd_op_pagina',seconden:Math.round(actief/1000)});}stuur();}else{sinds=Date.now();}});
  addEventListener('pagehide',stuur);setInterval(stuur,15000);
})();
