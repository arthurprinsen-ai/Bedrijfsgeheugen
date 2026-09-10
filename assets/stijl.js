/* Bedrijfsgeheugen — gedeelde interactie */

(function(){
  var KEY='bg_consent';
  /* Consent Mode. De default staat inline in de head van elke pagina, vóór de
     analytics-tag; zie tools/site-shell/apply-shell.mjs. Dit script doet de rest:
     het past een eerder gemaakte keuze meteen toe en verwerkt een nieuwe keuze.
     Zonder het toepassen van de opgeslagen keuze zou een bezoeker die eerder
     heeft geweigerd bij het volgende bezoek alsnog gemeten worden. */
  function applyConsent(state){try{if(typeof gtag==='function')gtag('consent','update',{analytics_storage:(state==='granted'?'granted':'denied'),ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});}catch(e){}}
  function el(){return document.getElementById('bgCookie');}
  function show(){var b=el();if(b)b.classList.add('bgShow');}
  function hide(){var b=el();if(b)b.classList.remove('bgShow');}
  function choose(state){try{localStorage.setItem(KEY,state);localStorage.setItem(KEY+'_ts',new Date().toISOString());}catch(e){}applyConsent(state);hide();}
  window.bgOpenCookies=function(){show();};
  document.addEventListener('DOMContentLoaded',function(){
    var a=document.getElementById('bgCookieAccept'),d=document.getElementById('bgCookieDeny');
    if(a)a.addEventListener('click',function(){choose('granted');});
    if(d)d.addEventListener('click',function(){choose('denied');});
    var stored=null;try{stored=localStorage.getItem(KEY);}catch(e){}
    if(stored==='granted'||stored==='denied'){applyConsent(stored);}
    else{show();}
  });
})();

/* De money-page laag die hier stond is verwijderd op 10 september 2026.
   Hij injecteerde een eigen hero, terwijl de canonieke V18-schil die inmiddels
   bij de build genereert — /due-diligence heeft hem gewoon in de HTML staan.
   Twee lagen die dezelfde hero maken vechten met elkaar, en dat was precies wat
   tests/commercial-intent-pages-v1.test.mjs meldde. Wat overblijft is de
   toestemmingslaag hierboven, en die moet wél geladen worden. */
